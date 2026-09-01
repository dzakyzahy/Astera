import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { estates } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AsteraApiError(401, 'Unauthorized', 'You must be logged in to access this resource.');
    }

    const { organizationId } = session.user as any;
    if (!organizationId) {
       throw new AsteraApiError(403, 'Forbidden', 'No organization assigned to this user.');
    }

    // Security: Only fetch estates belonging to the user's organization
    const result = await db.select().from(estates).where(eq(estates.organizationId, organizationId));
    
    return apiSuccess({ estates: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
