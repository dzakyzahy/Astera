import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estateId = searchParams.get('estateId') || undefined;

    const db = getDbStore();
    const assets = db.getAssets(estateId);

    return apiSuccess({ assets, total: assets.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
