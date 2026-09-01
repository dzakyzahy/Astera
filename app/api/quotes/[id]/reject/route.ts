import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';
import { rejectQuoteInputSchema } from '@/lib/validations/approval.schema';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const quoteId = params.id;
    const json = (await request.json()) as Record<string, unknown>;

    const validated = rejectQuoteInputSchema.parse({
      ...json,
      quoteId,
    });

    const db = getDbStore();
    const quote = db.getQuote(quoteId);
    if (!quote) {
      return apiError('Not Found', `Quote ${quoteId} not found`, 404);
    }

    const result = await db.idempotencyService.executeWithLock(
      validated.idempotencyKey,
      'REJECT_QUOTE',
      async () => {
        const res = db.rejectQuote({
          incidentId: validated.incidentId,
          quoteId: validated.quoteId,
          approverId: validated.approverId,
          approverName: validated.approverName,
          approverRole: validated.approverRole,
          reason: validated.reason,
          idempotencyKey: validated.idempotencyKey,
        });

        return {
          statusCode: 200,
          body: {
            success: true,
            approval: res.approval,
            incident: res.incident,
          },
        };
      }
    );

    return apiSuccess(result.body, result.statusCode);
  } catch (error) {
    return handleRouteError(error);
  }
}
