import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function POST() {
  try {
    const db = getDbStore();
    const resetResult = db.resetDemo();

    return apiSuccess({
      success: true,
      message: 'Contest demo state successfully restored to initial seed.',
      resetAt: resetResult.resetAt,
      seededIncidents: resetResult.seededIncidents,
      seededQuotes: resetResult.seededQuotes,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
