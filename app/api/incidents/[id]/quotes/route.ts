import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const incidentId = params.id;

    const db = getDbStore();
    const incident = db.getIncident(incidentId);
    if (!incident) {
      return apiError('Not Found', `Incident with ID ${incidentId} was not found`, 404);
    }

    const quotes = db.getQuotesForIncident(incidentId);
    return apiSuccess({ incidentId, quotes });
  } catch (error) {
    return handleRouteError(error);
  }
}
