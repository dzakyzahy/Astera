import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';
import { createIncidentInputSchema } from '@/lib/validations/incident.schema';
import type { IncidentStatus } from '@/types/domain';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estateId = searchParams.get('estateId') || undefined;
    const status = (searchParams.get('status') as IncidentStatus) || undefined;

    const db = getDbStore();
    const incidents = db.getIncidents(estateId, status);

    return apiSuccess({ incidents, total: incidents.length });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = createIncidentInputSchema.parse(json);

    const db = getDbStore();
    const incident = db.createIncident(validated);

    return apiSuccess({ incident }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
