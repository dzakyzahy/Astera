import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || undefined;

    const db = getDbStore();
    const report = db.getFinancialReport(period);

    return apiSuccess({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
