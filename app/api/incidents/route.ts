import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { incidents, estates, assets } from '@/lib/db/schema';
import { createIncidentInputSchema } from '@/lib/validations/incident.schema';
import type { IncidentStatus, IncidentSeverity, UserRole } from '@/types/domain';
import { getAuthSession } from '@/lib/auth';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { AiOrchestrationService } from '@/lib/services/ai-orchestration-service';
import { AuditService } from '@/lib/services/audit-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { organizationId } = session.user as { id: string; name: string; role: string; organizationId: string };

    const { searchParams } = new URL(request.url);
    const estateId = searchParams.get('estateId') || undefined;
    const status = (searchParams.get('status') as IncidentStatus) || undefined;

    const orgEstates = await db.select({ id: estates.id }).from(estates).where(eq(estates.organizationId, organizationId));
    const estateIds = orgEstates.map(e => e.id);

    if (estateIds.length === 0) {
      return apiSuccess({ incidents: [], total: 0 });
    }

    const targetEstateIds = estateId && estateIds.includes(estateId) ? [estateId] : estateIds;
    
    let query = db.select().from(incidents).where(inArray(incidents.estateId, targetEstateIds)).orderBy(desc(incidents.reportedAt)).$dynamic();
    if (status) query = query.where(eq(incidents.status, status));

    const result = await query;

    return apiSuccess({ incidents: result, total: result.length });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) throw new AsteraApiError(401, 'Unauthorized', 'Login required.');
    const { id: actorId, name: actorName, role: actorRole, organizationId } = session.user as { id: string; name: string; role: string; organizationId: string };

    const json = await request.json();
    const validated = createIncidentInputSchema.parse(json);

    // Validate estate belongs to org
    const estateResult = await db.select().from(estates).where(and(eq(estates.id, validated.estateId), eq(estates.organizationId, organizationId))).limit(1);
    if (estateResult.length === 0) throw new AsteraApiError(403, 'Forbidden', 'Estate not found or access denied.');
    const estate = estateResult[0];

    let assetName = undefined;
    if (validated.assetId) {
      const assetResult = await db.select().from(assets).where(and(eq(assets.id, validated.assetId), eq(assets.estateId, estate.id))).limit(1);
      if (assetResult.length > 0) assetName = assetResult[0].name;
    }

    // Determine ID
    const latestIncident = await db.select({ id: incidents.id }).from(incidents).orderBy(desc(incidents.id)).limit(1);
    const lastSeq = latestIncident.length > 0 ? parseInt(latestIncident[0].id.split('-')[2]) : 89;
    const incId = `INC-2026-${String(lastSeq + 1).padStart(3, '0')}`;
    const now = new Date();

    const formattedEvidence = (validated.evidence || []).map((e, idx) => ({
      id: `EVD-${lastSeq + 1}-${String(idx + 1).padStart(2, '0')}`,
      incidentId: incId,
      storageKey: `evidence/${incId.toLowerCase()}/${e.fileName}`,
      mediaType: e.mediaType,
      fileName: e.fileName,
      fileSizeBytes: e.fileSizeBytes,
      checksumSha256: e.checksumSha256 || '0'.repeat(64),
      url: e.url,
      capturedAt: now.toISOString(),
      note: e.note,
    }));

    const aiService = new AiOrchestrationService();
    const triage = aiService.generateAdvisoryTriage({
      summary: validated.summary,
      description: validated.description,
      evidence: formattedEvidence,
      severityHint: validated.severitySuggestion as IncidentSeverity,
      assetName,
    });

    const incidentToInsert = {
      id: incId,
      referenceNumber: incId,
      estateId: estate.id,
      estateLabel: estate.label,
      assetId: validated.assetId || null,
      assetName: assetName || null,
      severity: triage.suggestedSeverity,
      status: 'TRIAGED',
      summary: validated.summary,
      description: validated.description,
      reportedBy: actorId, // Use session ID
      reportedByRole: actorRole,
      reportedAt: now,
      updatedAt: now,
      evidence: formattedEvidence,
      triage: triage,
    };

    const inserted = await db.insert(incidents).values(incidentToInsert).returning();

    // Record Audit Event
    const auditService = new AuditService();
    await auditService.recordEvent({
      aggregateType: 'INCIDENT',
      aggregateId: incId,
      actorId: actorId,
      actorName: actorName,
      actorRole: actorRole as UserRole,
      action: 'INCIDENT_CREATED',
      payload: {
        incidentId: incId,
        estateId: estate.id,
        summary: validated.summary,
        severity: triage.suggestedSeverity,
      },
    });

    return apiSuccess({ incident: { ...inserted[0], reportedAt: inserted[0].reportedAt.toISOString(), updatedAt: inserted[0].updatedAt.toISOString() } }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
