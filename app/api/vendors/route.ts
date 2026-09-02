import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET() {
  try {
    const db = getDbStore();
    const vendors = db.getVendors();

    return apiSuccess({ vendors, total: vendors.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
