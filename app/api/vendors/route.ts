import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { vendors } from '@/lib/db/schema';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');

    const result = await db.select().from(vendors);
    return apiSuccess({ vendors: result, total: result.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
