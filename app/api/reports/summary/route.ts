import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { sql, eq } from 'drizzle-orm';
import { incidents, workOrders, quotes, estates } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      throw new AsteraApiError(401, 'Unauthorized', 'You must be logged in.');
    }
    const { organizationId } = session.user as { organizationId: string };
    
    if (!organizationId) {
      throw new AsteraApiError(403, 'Forbidden', 'No organization assigned.');
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || new Date().toISOString().substring(0, 7); // e.g. "2026-08"

    // 1. Calculate Total Spend for the organization
    // Sum of quote amounts for completed work orders in the org
    const spendResult = await db
      .select({
        totalSpendMinorUnits: sql<number>`COALESCE(SUM(${quotes.totalAmountMinorUnits}), 0)::int`,
      })
      .from(workOrders)
      .innerJoin(quotes, eq(workOrders.quoteId, quotes.id))
      .innerJoin(estates, eq(workOrders.estateId, estates.id))
      .where(eq(estates.organizationId, organizationId));

    const totalSpend = spendResult[0]?.totalSpendMinorUnits || 0;

    // 2. Aggregate Incidents by Severity
    const severityResult = await db
      .select({
        severity: incidents.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(incidents)
      .innerJoin(estates, eq(incidents.estateId, estates.id))
      .where(eq(estates.organizationId, organizationId))
      .groupBy(incidents.severity);

    const incidentsBySeverity = severityResult.reduce((acc, row) => {
      acc[row.severity] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // 3. Aggregate Incidents by Status
    const statusResult = await db
      .select({
        status: incidents.status,
        count: sql<number>`count(*)::int`,
      })
      .from(incidents)
      .innerJoin(estates, eq(incidents.estateId, estates.id))
      .where(eq(estates.organizationId, organizationId))
      .groupBy(incidents.status);
      
    const incidentsByStatus = statusResult.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // Return structured report
    const report = {
      period,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalSpendMinorUnits: totalSpend,
        currency: 'IDR',
        incidentsBySeverity,
        incidentsByStatus,
      },
    };

    return apiSuccess({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
