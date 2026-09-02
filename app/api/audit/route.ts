import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';
import type { AuditAggregateType } from '@/types/domain';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aggregateType = (searchParams.get('aggregateType') as AuditAggregateType) || undefined;
    const aggregateId = searchParams.get('aggregateId') || undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const cursor = searchParams.get('cursor') || undefined;

    const db = getDbStore();
    const result = db.getAuditEvents({
      aggregateType,
      aggregateId,
      actorId,
      limit,
      cursor,
    });

    const chainVerification = db.verifyAuditChain();

    return apiSuccess({
      events: result.events,
      total: result.total,
      nextCursor: result.nextCursor,
      chainIntegrity: {
        valid: chainVerification.valid,
        verifiedAt: chainVerification.verifiedAt,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

