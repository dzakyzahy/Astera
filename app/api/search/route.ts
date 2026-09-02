import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const db = getDbStore();
    const results = db.search(query);

    return apiSuccess({ query, results });
  } catch (error) {
    return handleRouteError(error);
  }
}
