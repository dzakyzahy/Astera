import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET() {
  try {
    const db = getDbStore();
    const verification = db.verifyAuditChain();
    return apiSuccess(verification);
  } catch (error) {
    return handleRouteError(error);
  }
}
