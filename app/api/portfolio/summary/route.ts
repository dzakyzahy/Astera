import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estateId = searchParams.get('estateId') || undefined;

    const db = getDbStore();
    const kpis = db.getPortfolioKpis(estateId);
    const estates = db.getEstates();
    const activeEstate = estateId ? db.getEstate(estateId) : undefined;
    const incidents = db.getIncidents(estateId);
    const workOrders = db.getWorkOrders(estateId);

    return apiSuccess({
      kpis,
      estates,
      activeEstate,
      recentIncidents: incidents.slice(0, 5),
      activeWorkOrders: workOrders.slice(0, 5),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

