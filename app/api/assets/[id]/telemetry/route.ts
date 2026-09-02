import { type NextRequest } from 'next/server';
import { apiError, apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { assets, estates } from '@/lib/db/schema';
import { addTelemetryBatchInputSchema } from '@/lib/validations/asset.schema';
import { getAuthSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { organizationId } = session.user as { id: string; name: string; role: string; organizationId: string };

    const params = await Promise.resolve(props.params);
    const assetId = params.id;

    const assetResult = await db.select({
      asset: assets,
      orgId: estates.organizationId
    })
    .from(assets)
    .innerJoin(estates, eq(assets.estateId, estates.id))
    .where(eq(assets.id, assetId))
    .limit(1);

    if (assetResult.length === 0) {
      return apiError('Not Found', `Asset ${assetId} not found`, 404);
    }
    
    if (assetResult[0].orgId !== organizationId) {
      return apiError('Forbidden', `Access denied to asset ${assetId}`, 403);
    }

    const asset = assetResult[0].asset;

    return apiSuccess({
      assetId,
      assetName: asset.name,
      state: asset.state,
      telemetry: asset.telemetry,
      lastServiceDate: asset.lastServiceDate ? asset.lastServiceDate.toISOString() : undefined,
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
    const session = await getAuthSession();
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { organizationId } = session.user as { id: string; name: string; role: string; organizationId: string };

    const params = await Promise.resolve(props.params);
    const assetId = params.id;
    const json = await request.json();

    const validated = addTelemetryBatchInputSchema.parse(json);

    const assetResult = await db.select({
      asset: assets,
      orgId: estates.organizationId
    })
    .from(assets)
    .innerJoin(estates, eq(assets.estateId, estates.id))
    .where(eq(assets.id, assetId))
    .limit(1);

    if (assetResult.length === 0) {
      return apiError('Not Found', `Asset ${assetId} not found`, 404);
    }
    
    if (assetResult[0].orgId !== organizationId) {
      return apiError('Forbidden', `Access denied to asset ${assetId}`, 403);
    }

    const asset = assetResult[0].asset;

    const formatted = validated.readings.map((r) => ({
      label: r.label,
      value: r.value,
      status: r.status,
      timestamp: r.timestamp || new Date().toISOString(),
      unit: r.unit,
    }));

    const newTelemetry = [...(asset.telemetry || []), ...formatted];

    const updated = await db.update(assets)
      .set({ telemetry: newTelemetry as unknown as typeof asset.telemetry })
      .where(eq(assets.id, assetId))
      .returning();

    return apiSuccess({ assetId, telemetry: updated[0].telemetry }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
