import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import type { AuditAggregateType } from '@/types/domain';
import { getAuthSession } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    // Check if user is allowed to view audit logs (e.g. principal or manager)
    const { role } = session.user as { id: string; name: string; role: string; organizationId: string };
    if (role !== 'principal' && role !== 'estate_manager') {
       throw new AsteraApiError(403, 'Forbidden', 'Not authorized to view audit logs');
    }

    const { searchParams } = new URL(request.url);
    const aggregateType = (searchParams.get('aggregateType') as AuditAggregateType) || undefined;
    const aggregateId = searchParams.get('aggregateId') || undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const cursor = searchParams.get('cursor') || undefined;

    const auditService = new AuditService();
    const result = await auditService.getEvents({
      aggregateType,
      aggregateId,
      actorId,
      limit,
      cursor,
    });

    const chainVerification = await auditService.verifyChainIntegrity();

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

