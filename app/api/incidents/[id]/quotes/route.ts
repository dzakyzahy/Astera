import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { incidents, quotes, estates } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { organizationId } = session.user as any;

    const params = await Promise.resolve(props.params);
    const incidentId = params.id;

    const incidentResult = await db.select({
      id: incidents.id,
      estateId: incidents.estateId,
      orgId: estates.organizationId
    })
    .from(incidents)
    .innerJoin(estates, eq(incidents.estateId, estates.id))
    .where(eq(incidents.id, incidentId))
    .limit(1);

    if (incidentResult.length === 0) {
      return apiError('Not Found', `Incident with ID ${incidentId} was not found`, 404);
    }
    
    if (incidentResult[0].orgId !== organizationId) {
       return apiError('Forbidden', `Access denied to incident ${incidentId}`, 403);
    }

    const incidentQuotes = await db.select().from(quotes).where(eq(quotes.incidentId, incidentId));

    return apiSuccess({ incidentId, quotes: incidentQuotes });
  } catch (error) {
    return handleRouteError(error);
  }
}

