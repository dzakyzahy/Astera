import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { assets, estates } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { organizationId } = session.user as { id: string; name: string; role: string; organizationId: string };

    const { searchParams } = new URL(request.url);
    const estateId = searchParams.get('estateId') || undefined;

    const orgEstates = await db.select({ id: estates.id }).from(estates).where(eq(estates.organizationId, organizationId));
    const estateIds = orgEstates.map(e => e.id);

    if (estateIds.length === 0) {
      return apiSuccess({ assets: [], total: 0 });
    }

    const targetEstateIds = estateId && estateIds.includes(estateId) ? [estateId] : estateIds;
    
    const result = await db.select().from(assets).where(inArray(assets.estateId, targetEstateIds));

    return apiSuccess({ assets: result, total: result.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
