import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function POST() {
  try {
    const db = getDbStore();
    const result = db.resetDemo();

    return apiSuccess({
      success: true,
      message: 'Synthetic estate demo dataset restored to initial seed state.',
      ...result,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
