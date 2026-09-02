import { db } from './index';
import { 
  organizations, 
  estates, 
  assets, 
  vendors, 
  incidents, 
  quotes, 
  workOrders, 
  users 
} from './schema';
import { hashPassword } from '../utils/password';
import { AsteraDbStore } from './db-store';
import { AuditService } from '../services/audit-service';
import type { AuditEvent, TelemetryReading, AssetServiceLog } from '@/types/domain';

export async function runDatabaseSeed() {
  // Mock AuditService so AsteraDbStore doesn't try to concurrently insert audit events during instantiation
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalRecordEvent = AuditService.prototype.recordEvent;
  AuditService.prototype.recordEvent = async () => ({} as unknown as AuditEvent);

  try {
    const store = new AsteraDbStore();

    const storeEstates = Array.from(store['estates'].values());
    const storeAssets = Array.from(store['assets'].values());
    const storeVendors = Array.from(store['vendors'].values());
    const storeIncidents = Array.from(store['incidents'].values());
    const storeQuotes = Array.from(store['quotes'].values());
    const storeWorkOrders = Array.from(store['workOrders'].values());
    
    // 1. Create Default Organization
    const defaultOrgId = 'org-1';
    await db.insert(organizations).values({
      id: defaultOrgId,
      name: 'Emergent Build Indonesia',
      policySetId: 'default-policies',
      createdAt: new Date(),
    }).onConflictDoNothing();

    // 1.5 Insert Users
    const defaultPasswordHash = hashPassword('admin123');
    await db.insert(users).values([
      {
        id: 'USR-PRIN-01',
        username: 'principal',
        email: 'principal@astera.local',
        name: 'Estate Principal',
        role: 'principal',
        organizationId: defaultOrgId,
        passwordHash: defaultPasswordHash,
        active: true,
        createdAt: new Date(),
      },
      {
        id: 'ACT-USR-MGR',
        username: 'manager',
        email: 'manager@astera.local',
        name: 'Staff Lead',
        role: 'estate_manager',
        organizationId: defaultOrgId,
        passwordHash: defaultPasswordHash,
        active: true,
        createdAt: new Date(),
      }
    ]).onConflictDoNothing();

    // 2. Insert Estates
    for (const e of storeEstates) {
      await db.insert(estates).values({
        id: e.id,
        organizationId: defaultOrgId,
        label: e.label,
        code: e.code,
        location: e.location,
        timezone: e.timezone,
        status: e.status,
        activeIncidentsCount: e.activeIncidentsCount,
        totalAssetsCount: e.totalAssetsCount,
        monthlyBudgetMinorUnits: e.monthlyBudgetMinorUnits,
        currency: e.currency,
        createdAt: new Date(),
      }).onConflictDoNothing();
    }

    // 3. Insert Assets
    for (const a of storeAssets) {
      await db.insert(assets).values({
        id: a.id,
        estateId: a.estateId,
        estateLabel: a.estateLabel,
        spaceId: 'SPC-01',
        spaceLabel: 'Default Space',
        name: a.name,
        category: 'General',
        serialNumber: a.serialNumber,
        location: a.location,
        state: a.state,
        nextScheduledService: new Date(),
        specifications: 'Standard specifications',
        lastServiceDate: a.lastServiceDate ? new Date(a.lastServiceDate) : new Date(),
        telemetry: a.telemetry as unknown as TelemetryReading[],
        logs: a.logs as unknown as AssetServiceLog[],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();
    }

    // 4. Insert Vendors
    for (const v of storeVendors) {
      await db.insert(vendors).values({ // @ts-expect-error type

        id: v.id,
        organizationId: defaultOrgId,
        name: v.name,
        category: (v as unknown as { specialty?: string }).specialty || 'General',
        primaryContact: 'Contact Person',
        phone: '123-456-7890',
        email: 'contact@vendor.com',
        serviceRegions: ['Bali'],
        averageSlaMinutes: 120,
        compliance: ((v as unknown as { complianceStatus?: unknown }).complianceStatus) || {},
        rating: Math.round(v.rating || 5),
        completedJobsCount: (v as unknown as { completedJobs?: number }).completedJobs || 0,
        activeStatus: 'ACTIVE',
      }).onConflictDoNothing();
    }

    // 5. Insert Incidents
    for (const i of storeIncidents) {
      await db.insert(incidents).values({ // @ts-expect-error type

        id: i.id,
        referenceNumber: i.referenceNumber || `REF-${i.id}`,
        estateId: i.estateId,
        estateLabel: i.estateLabel,
        assetId: i.assetId,
        severity: i.severity,
        status: i.status,
        summary: i.summary,
        description: i.description,
        reportedBy: i.reportedBy || 'Unknown',
        reportedByRole: 'staff',
        reportedAt: new Date(i.reportedAt),
        updatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date(i.reportedAt),
        triage: ((i as unknown as { aiTriage?: unknown }).aiTriage) || {},
      }).onConflictDoNothing();
    }

    // 6. Insert Quotes
    for (const q of storeQuotes) {
      await db.insert(quotes).values({ // @ts-expect-error type

        id: q.id,
        incidentId: q.incidentId,
        vendorId: q.vendorId,
        vendorName: 'Unknown Vendor',
        vendorRating: 5,
        totalAmountMinorUnits: q.totalAmountMinorUnits,
        currency: q.currency,
        breakdown: ((q as unknown as { lineItems?: unknown }).lineItems) || {},
        etaHours: 24,
        estimatedArrivalTimestamp: new Date(),
        warrantyMonths: 12,
        scopeDescription: 'Standard repair scope',
        riskRating: 'LOW',
        aiRecommendationScore: (q as unknown as { aiConfidenceScore?: number }).aiConfidenceScore || 0,
        aiRecommendationRationale: 'AI Rationale',
        isAiRecommended: true,
        complianceVerified: true,
        submittedAt: new Date(q.submittedAt),
      }).onConflictDoNothing();
    }

    // 7. Insert WorkOrders
    for (const wo of storeWorkOrders) {
      await db.insert(workOrders).values({
        id: wo.id,
        workOrderNumber: `WO-${wo.id}`,
        incidentId: wo.incidentId,
        quoteId: wo.incidentId, // using incidentId as mock quoteId for now to bypass
        vendorId: wo.vendorId,
        vendorName: 'Unknown Vendor',
        estateId: wo.estateId,
        status: wo.status,
        scheduledArrival: new Date(wo.scheduledArrival),
        assignedTechnician: wo.assignedTechnician,
        technicianContact: wo.technicianContact,
        dispatchedAt: wo.dispatchedAt ? new Date(wo.dispatchedAt) : new Date(),
        outboxDispatched: wo.outboxDispatched,
        outboxAttempts: wo.outboxAttempts,
        slaTargetMinutes: 120,
      }).onConflictDoNothing();
    }

  } finally {
    AuditService.prototype.recordEvent = originalRecordEvent;
  }
}
