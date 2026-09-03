import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { estates, incidents, assets, workOrders, quotes } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, inArray, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AsteraApiError(401, 'Unauthorized', 'You must be logged in.');
    }
    const { organizationId } = session.user as { id: string; name: string; role: string; organizationId: string };
    if (!organizationId) {
      throw new AsteraApiError(403, 'Forbidden', 'No organization assigned.');
    }

    const { searchParams } = new URL(request.url);
    const estateId = searchParams.get('estateId') || undefined;

    // Fetch org estates
    const orgEstates = await db.select().from(estates).where(eq(estates.organizationId, organizationId));
    const estateIds = orgEstates.map(e => e.id);
    if (estateIds.length === 0) {
      return apiSuccess({ kpis: null, estates: [], recentIncidents: [], activeWorkOrders: [] });
    }

    // Filter by single estate if requested
    const targetEstateIds = estateId && estateIds.includes(estateId) ? [estateId] : estateIds;
    const activeEstate = estateId ? orgEstates.find(e => e.id === estateId) : undefined;

    // Fetch incidents for the target estates
    const allIncidents = await db.select().from(incidents).where(inArray(incidents.estateId, targetEstateIds)).orderBy(desc(incidents.reportedAt));
    
    // Fetch assets
    const allAssets = await db.select().from(assets).where(inArray(assets.estateId, targetEstateIds));
    
    // Fetch work orders
    const allWorkOrders = await db.select().from(workOrders).where(inArray(workOrders.estateId, targetEstateIds)).orderBy(desc(workOrders.dispatchedAt));

    // Calculate KPIs
    const openIncidents = allIncidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'REJECTED');
    const pendingApprovals = allIncidents.filter(i => i.status === 'AWAITING_APPROVAL');
    const slaAtRisk = allIncidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    
    const healthyCount = allAssets.filter(a => a.state === 'Healthy').length;
    const healthyPct = allAssets.length > 0 ? Math.round((healthyCount / allAssets.length) * 100) : 100;

    let monthlySpend = 0;
    for (const wo of allWorkOrders) {
      if (wo.status === 'COMPLETED') {
        const q = await db.select().from(quotes).where(eq(quotes.id, wo.quoteId)).limit(1);
        if (q.length > 0) monthlySpend += q[0].totalAmountMinorUnits;
      }
    }

    const kpis = {
      openIncidentsCount: openIncidents.length,
      slaAtRiskCount: slaAtRisk.length,
      pendingApprovalsCount: pendingApprovals.length,
      costAvoidanceMinorUnits: 42000000, // Synthetic saving metric
      activeEstatesCount: estateId ? 1 : orgEstates.length,
      healthyAssetsPercentage: healthyPct,
      monthlySpendMinorUnits: monthlySpend,
      currency: 'IDR',
    };

    return apiSuccess({
      kpis,
      estates: orgEstates,
      activeEstate,
      recentIncidents: allIncidents.slice(0, 5),
      activeWorkOrders: allWorkOrders.slice(0, 5),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

