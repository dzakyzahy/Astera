import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { incidents, quotes, approvals, estates } from '@/lib/db/schema';
import { rejectQuoteInputSchema } from '@/lib/validations/approval.schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { AuditService } from '@/lib/services/audit-service';
import { IdempotencyService, IdempotencyConflictError } from '@/lib/services/idempotency-service';

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
      throw new AsteraApiError(403, 'Forbidden', 'Only principals can reject quotes.');
    }

    const params = await Promise.resolve(props.params);
    const quoteId = params.id;
    const json = (await request.json()) as Record<string, unknown>;

    const validated = rejectQuoteInputSchema.parse({
      ...json,
      quoteId,
    });

    const result = await idempotencyService.executeWithLock(
      validated.idempotencyKey,
      'REJECT_QUOTE',
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
            throw new Error(`Incident is in status ${incident.status}, cannot reject quote.`);
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
            status: 'REJECTED',
            amountMinorUnits: quote.totalAmountMinorUnits,
            currency: quote.currency,
            explicitAck: true,
            notes: validated.reason,
            decidedAt: now,
            idempotencyKey: validated.idempotencyKey,
          };

          const insertedApproval = await tx.insert(approvals).values(approvalToInsert).returning();

          const updatedIncident = await tx.update(incidents)
            .set({ 
              status: 'REJECTED', 
              updatedAt: now 
            })
            .where(eq(incidents.id, incident.id))
            .returning();

          return {
            statusCode: 200,
            body: {
              success: true,
              approval: { ...insertedApproval[0], decidedAt: insertedApproval[0].decidedAt.toISOString() },
              incident: { ...updatedIncident[0], updatedAt: updatedIncident[0].updatedAt.toISOString(), reportedAt: updatedIncident[0].reportedAt.toISOString() },
            },
          };
        });
      }
    );

    if (result.statusCode === 200) {
      const auditService = new AuditService();
      await auditService.recordEvent({
        aggregateType: 'APPROVAL',
        aggregateId: result.body.approval.id,
        actorId,
        actorName,
        actorRole,
        action: 'SPENDING_REJECTED',
        payload: {
          approvalId: result.body.approval.id,
          incidentId: result.body.incident.id,
          quoteId: quoteId,
          reason: validated.reason,
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
