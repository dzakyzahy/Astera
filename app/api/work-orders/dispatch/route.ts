import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';
import { dispatchWorkOrderInputSchema } from '@/lib/validations/work-order.schema';
import { IdempotencyConflictError } from '@/lib/services/idempotency-service';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = dispatchWorkOrderInputSchema.parse(json);

    const db = getDbStore();
    const result = db.dispatchWorkOrder(validated);

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return apiError('Conflict', error.message, 409);
    }
    return handleRouteError(error);
  }
}

