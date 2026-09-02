import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';
import { approveQuoteInputSchema } from '@/lib/validations/approval.schema';
import { IdempotencyConflictError } from '@/lib/services/idempotency-service';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const quoteId = params.id;
    const json = (await request.json()) as Record<string, unknown>;

    const validated = approveQuoteInputSchema.parse({
      ...json,
      quoteId,
    });

    const db = getDbStore();
    const result = db.approveQuote(validated);

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return apiError('Conflict', error.message, 409);
    }
    return handleRouteError(error);
  }
}
