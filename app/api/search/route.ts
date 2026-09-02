import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { incidents, assets, vendors, estates } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, or, ilike } from 'drizzle-orm';
import type { GlobalSearchResult } from '@/types/domain';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { organizationId } = session.user as { id: string; name: string; role: string; organizationId: string };

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return apiSuccess({ query, results: [] });
    }

    const orgEstates = await db.select({ id: estates.id }).from(estates).where(eq(estates.organizationId, organizationId));
    const estateIds = orgEstates.map(e => e.id);
    if (estateIds.length === 0) return apiSuccess({ query, results: [] });

    const q = `%${query}%`;
    const searchResults: GlobalSearchResult['results'] = [];

    // Search Incidents
    const incs = await db.select()
      .from(incidents)
      .where(
        or(
          ilike(incidents.referenceNumber, q),
          ilike(incidents.summary, q),
          ilike(incidents.description, q)
        )
      );

    for (const inc of incs.filter(i => estateIds.includes(i.estateId))) {
      searchResults.push({
        type: 'incident',
        id: inc.id,
        title: `${inc.referenceNumber}: ${inc.summary}`,
        subtitle: `${inc.estateLabel} · Status: ${inc.status}`,
        statusBadge: inc.severity,
        url: `#incidents`,
      });
    }

    // Search Assets
    const asts = await db.select()
      .from(assets)
      .where(
        or(
          ilike(assets.id, q),
          ilike(assets.name, q),
          ilike(assets.serialNumber, q),
          ilike(assets.location, q)
        )
      );

    for (const ast of asts.filter(a => estateIds.includes(a.estateId))) {
      searchResults.push({
        type: 'asset',
        id: ast.id,
        title: `${ast.name} (${ast.id})`,
        subtitle: `${ast.estateLabel} · ${ast.location}`,
        statusBadge: ast.state,
        url: `#assets`,
      });
    }

    // Search Vendors (Globally visible to org for simplicity)
    const vends = await db.select()
      .from(vendors)
      .where(
        or(
          ilike(vendors.name, q),
          ilike(vendors.category, q)
        )
      )
      .limit(10);

    for (const v of vends) {
      searchResults.push({
        type: 'vendor',
        id: v.id,
        title: v.name,
        subtitle: v.category,
        statusBadge: v.rating.toString(),
        url: `#vendors`,
      });
    }

    return apiSuccess({ query, results: searchResults });
  } catch (error) {
    return handleRouteError(error);
  }
}
