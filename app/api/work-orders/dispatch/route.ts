import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';
import { dispatchWorkOrderInputSchema } from '@/lib/validations/work-order.schema';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = dispatchWorkOrderInputSchema.parse(json);

    const db = getDbStore();
    const existingWo = db.getWorkOrder(validated.workOrderId);
    if (!existingWo) {
      return apiError('Not Found', `Work Order ${validated.workOrderId} not found`, 404);
    }

    const result = await db.idempotencyService.executeWithLock(
      validated.idempotencyKey,
      'DISPATCH_WORK_ORDER',
      async () => {
        const dispatchedWo = db.dispatchWorkOrder({
          workOrderId: validated.workOrderId,
          actorId: validated.actorId,
          actorRole: validated.actorRole,
          assignedTechnician: validated.assignedTechnician,
          technicianContact: validated.technicianContact,
          notes: validated.notes,
        });

        // Trigger asynchronous outbox processor
        await db.outboxService.processQueue();

        return {
          statusCode: 200,
          body: {
            success: true,
            workOrder: dispatchedWo,
          },
        };
      }
    );

    return apiSuccess(result.body, result.statusCode);
  } catch (error) {
    return handleRouteError(error);
  }
}
