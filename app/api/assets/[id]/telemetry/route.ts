import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-response';
import { getDbStore } from '@/lib/db/db-store';
import { addTelemetryBatchInputSchema } from '@/lib/validations/asset.schema';

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const assetId = params.id;

    const db = getDbStore();
    const asset = db.getAsset(assetId);
    if (!asset) {
      return apiError('Not Found', `Asset ${assetId} not found`, 404);
    }

    return apiSuccess({
      assetId,
      assetName: asset.name,
      state: asset.state,
      telemetry: asset.telemetry,
      lastServiceDate: asset.lastServiceDate,
      logs: asset.logs,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const assetId = params.id;
    const json = await request.json();

    const validated = addTelemetryBatchInputSchema.parse(json);

    const db = getDbStore();
    const asset = db.getAsset(assetId);
    if (!asset) {
      return apiError('Not Found', `Asset ${assetId} not found`, 404);
    }

    const formatted = validated.readings.map((r) => ({
      label: r.label,
      value: r.value,
      status: r.status,
      timestamp: r.timestamp || new Date().toISOString(),
      unit: r.unit,
    }));

    const updated = db.addTelemetry(assetId, formatted);
    return apiSuccess({ assetId, telemetry: updated?.telemetry }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
