import { type NextRequest, NextResponse } from 'next/server';
import type { IncidentStatus, IncidentSeverity, UserRole } from '@/types/domain';
import { apiError, apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { incidents, workOrders, outboxEvents, estates } from '@/lib/db/schema';
import { dispatchWorkOrderInputSchema } from '@/lib/validations/work-order.schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { AuditService } from '@/lib/services/audit-service';
import { IdempotencyService, IdempotencyConflictError } from '@/lib/services/idempotency-service';

const globalForIdempotency = globalThis as unknown as { idempotencyService: IdempotencyService };
const idempotencyService = globalForIdempotency.idempotencyService || new IdempotencyService();
if (process.env.NODE_ENV !== 'production') globalForIdempotency.idempotencyService = idempotencyService;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { id: actorId, name: actorName, role: actorRole, organizationId } = session.user as { id: string; name: string; role: string; organizationId: string };
    const json = await request.json();
    const validated = dispatchWorkOrderInputSchema.parse(json);

    const result = await idempotencyService.executeWithLock(
      validated.idempotencyKey,
      'DISPATCH_WORK_ORDER',
      async (): Promise<{ statusCode: number; body: any }> => {
        return await db.transaction(async (tx) => {
          const woResult = await tx.select().from(workOrders).where(eq(workOrders.id, validated.workOrderId)).limit(1);
          if (woResult.length === 0) throw new Error(`Work Order ${validated.workOrderId} not found`);
          const wo = woResult[0];

          // Org isolation check
          const estateResult = await tx.select({ orgId: estates.organizationId }).from(estates).where(eq(estates.id, wo.estateId)).limit(1);
          if (estateResult.length === 0 || estateResult[0].orgId !== organizationId) {
             throw new Error('Forbidden: Access denied to work order estate.');
          }

          if (wo.status === 'DISPATCHED') {
            return {
              statusCode: 200,
              body: { success: true, workOrder: wo },
            };
          }

          const now = new Date();
          
          const updatedWo = await tx.update(workOrders)
            .set({
              status: 'DISPATCHED',
              assignedTechnician: validated.assignedTechnician || 'Primary Field Dispatch',
              technicianContact: validated.technicianContact || '+62 361 8849 011',
              dispatchedAt: now,
              outboxDispatched: true,
              outboxAttempts: 1,
            })
            .where(eq(workOrders.id, wo.id))
            .returning();

          await tx.update(incidents)
            .set({ status: 'DISPATCHED', updatedAt: now })
            .where(eq(incidents.id, wo.incidentId));

          const outboxEventToInsert = {
            id: `OBX-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            eventType: 'vendor.dispatch.webhook',
            payload: {
              workOrderId: wo.id,
              vendorId: wo.vendorId,
              incidentId: wo.incidentId,
            },
            status: 'PENDING',
            attempts: 0,
            createdAt: now,
          };

          await tx.insert(outboxEvents).values(outboxEventToInsert);

          return {
            statusCode: 200,
            body: {
              success: true,
              workOrder: { ...updatedWo[0], scheduledArrival: updatedWo[0].scheduledArrival.toISOString(), dispatchedAt: updatedWo[0].dispatchedAt?.toISOString() },
            },
          };
        });
      }
    );

    if (result.statusCode === 200) {
      const auditService = new AuditService();
      await auditService.recordEvent({
        aggregateType: 'WORK_ORDER',
        aggregateId: result.body.workOrder.id,
        actorId,
        actorName,
        actorRole: actorRole as UserRole,
        action: 'WORK_ORDER_DISPATCHED',
        payload: {
          workOrderId: result.body.workOrder.id,
          vendorId: result.body.workOrder.vendorId,
          assignedTechnician: result.body.workOrder.assignedTechnician,
          idempotencyKey: validated.idempotencyKey,
        },
      });

      // Fire and forget worker trigger (do not wait)
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/worker/outbox`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}` }
      }).catch(e => console.error('Failed to trigger outbox worker:', e));
    }

    return apiSuccess(result.body, result.statusCode);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return apiError('Conflict', error.message, 409);
    }
    return handleRouteError(error);
  }
}

