import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET() {
  try {
    const db = getDbStore();
    const estates = db.getEstates();

    return apiSuccess({ estates });
  } catch (error) {
    return handleRouteError(error);
  }
}
