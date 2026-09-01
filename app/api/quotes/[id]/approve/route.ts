import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { incidents, quotes, approvals, workOrders, estates } from '@/lib/db/schema';
import { approveQuoteInputSchema } from '@/lib/validations/approval.schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { AuditService } from '@/lib/services/audit-service';
import { IdempotencyService, IdempotencyConflictError } from '@/lib/services/idempotency-service';

// Global singleton for Next.js dev server persistence
const globalForIdempotency = globalThis as unknown as { idempotencyService: IdempotencyService };
const idempotencyService = globalForIdempotency.idempotencyService || new IdempotencyService();
if (process.env.NODE_ENV !== 'production') globalForIdempotency.idempotencyService = idempotencyService;

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { id: actorId, name: actorName, role: actorRole, organizationId } = session.user as any;

    if (actorRole !== 'principal') {
      throw new AsteraApiError(403, 'Forbidden', 'Only principals can approve quotes.');
    }

    const params = await Promise.resolve(props.params);
    const quoteId = params.id;
    const json = (await request.json()) as Record<string, unknown>;

    const validated = approveQuoteInputSchema.parse({
      ...json,
      quoteId,
    });

    const result = await idempotencyService.executeWithLock(
      validated.idempotencyKey,
      'APPROVE_QUOTE',
      async () => {
        return await db.transaction(async (tx) => {
          const quoteResult = await tx.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
          if (quoteResult.length === 0) throw new Error(`Quote ${quoteId} not found`);
          const quote = quoteResult[0];

          if (quote.incidentId !== validated.incidentId) {
             throw new Error(`Quote ${quoteId} does not belong to incident ${validated.incidentId}`);
          }

          const incidentResult = await tx.select().from(incidents).where(eq(incidents.id, validated.incidentId)).limit(1);
          if (incidentResult.length === 0) throw new Error(`Incident ${validated.incidentId} not found`);
          const incident = incidentResult[0];

          // Verify organization
          const estateResult = await tx.select({ orgId: estates.organizationId }).from(estates).where(eq(estates.id, incident.estateId)).limit(1);
          if (estateResult.length === 0 || estateResult[0].orgId !== organizationId) {
            throw new Error('Forbidden: Estate does not belong to organization.');
          }

          if (incident.status !== 'AWAITING_APPROVAL') {
            throw new Error(`Incident is in status ${incident.status}, cannot approve quote.`);
          }

          const now = new Date();
          const approvalId = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          
          const approvalToInsert = {
            id: approvalId,
            incidentId: incident.id,
            quoteId: quote.id,
            approverId: actorId,
            approverName: actorName,
            approverRole: actorRole,
            status: 'APPROVED',
            amountMinorUnits: quote.totalAmountMinorUnits,
            currency: quote.currency,
            explicitAck: validated.explicitAck,
            notes: validated.notes || null,
            decidedAt: now,
            idempotencyKey: validated.idempotencyKey,
          };

          const insertedApproval = await tx.insert(approvals).values(approvalToInsert).returning();

          const woNumber = `WO-${incident.estateLabel.substring(0, 3).toUpperCase()}-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          const workOrderId = `WO-${Date.now()}`;

          const workOrderToInsert = {
            id: workOrderId,
            workOrderNumber: woNumber,
            incidentId: incident.id,
            quoteId: quote.id,
            estateId: incident.estateId,
            vendorId: quote.vendorId,
            vendorName: quote.vendorName,
            status: 'PENDING_DISPATCH',
            scheduledArrival: quote.estimatedArrivalTimestamp,
            dispatchedAt: now,
            outboxDispatched: false,
            outboxAttempts: 0,
            slaTargetMinutes: quote.etaHours * 60,
            notes: `Authorized spend: ${quote.currency} ${(quote.totalAmountMinorUnits / 1000000).toFixed(1)}M by ${actorName}`,
          };

          const insertedWo = await tx.insert(workOrders).values(workOrderToInsert).returning();

          const updatedIncident = await tx.update(incidents)
            .set({ 
              status: 'APPROVED', 
              selectedQuoteId: quote.id,
              workOrderId: workOrderId,
              updatedAt: now 
            })
            .where(eq(incidents.id, incident.id))
            .returning();

          return {
            statusCode: 200,
            body: {
              success: true,
              approval: { ...insertedApproval[0], decidedAt: insertedApproval[0].decidedAt.toISOString() },
              workOrder: { ...insertedWo[0], scheduledArrival: insertedWo[0].scheduledArrival.toISOString(), dispatchedAt: insertedWo[0].dispatchedAt?.toISOString() },
              incident: { ...updatedIncident[0], updatedAt: updatedIncident[0].updatedAt.toISOString(), reportedAt: updatedIncident[0].reportedAt.toISOString() },
            },
          };
        });
      }
    );

    // Audit Event happens outside transaction since AuditService is currently managing its own flow (and we want to avoid long locks)
    if (result.statusCode === 200) {
      const auditService = new AuditService();
      await auditService.recordEvent({
        aggregateType: 'APPROVAL',
        aggregateId: result.body.approval.id,
        actorId,
        actorName,
        actorRole,
        action: 'SPENDING_AUTHORIZED_AND_LOCKED',
        payload: {
          approvalId: result.body.approval.id,
          incidentId: result.body.incident.id,
          quoteId: quoteId,
          amountMinorUnits: result.body.approval.amountMinorUnits,
          currency: result.body.approval.currency,
          idempotencyKey: validated.idempotencyKey,
        },
      });
    }

    return apiSuccess(result.body, result.statusCode);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return apiError('Conflict', error.message, 409);
    }
    return handleRouteError(error);
  }
}
