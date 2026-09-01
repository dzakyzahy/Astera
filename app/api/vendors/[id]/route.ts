import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const vendorId = params.id;

    const db = getDbStore();
    const vendor = db.getVendor(vendorId);
    if (!vendor) {
      return apiError('Not Found', `Vendor ${vendorId} not found`, 404);
    }

    return apiSuccess({ vendor });
  } catch (error) {
    return handleRouteError(error);
  }
}
