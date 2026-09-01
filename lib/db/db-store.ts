import type {
  Approval,
  Asset,
  AuditAggregateType,
  AuditEvent,
  AuditVerificationResult,
  Estate,
  FinancialAndOpsReport,
  GlobalSearchResult,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  NormalizedQuote,
  Organization,
  PortfolioKpis,
  SystemNotification,
  TelemetryReading,
  UserRole,
  Vendor,
  WorkOrder,
} from '../../types/domain';
import { AuditService } from '../services/audit-service';
import { IdempotencyService } from '../services/idempotency-service';
import { OutboxService } from '../services/outbox-service';
import { AiOrchestrationService } from '../services/ai-orchestration-service';
import { QuoteNormalizerService } from '../services/quote-normalizer-service';
import {
  initialAssets,
  initialEstates,
  initialIncidents,
  initialOrganization,
  initialQuotes,
  initialVendors,
} from './seed';

export class AsteraDbStore {
  private organization: Organization = initialOrganization;
  private estates: Map<string, Estate> = new Map();
  private assets: Map<string, Asset> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private quotes: Map<string, NormalizedQuote> = new Map();
  private approvals: Map<string, Approval> = new Map();
  private workOrders: Map<string, WorkOrder> = new Map();
  private vendors: Map<string, Vendor> = new Map();
  private notifications: SystemNotification[] = [];

  public auditService: AuditService;
  public idempotencyService: IdempotencyService;
  public outboxService: OutboxService;
  public aiService: AiOrchestrationService;
  public quoteNormalizer: QuoteNormalizerService;

  constructor() {
    this.auditService = new AuditService();
    this.idempotencyService = new IdempotencyService();
    this.outboxService = new OutboxService();
    this.aiService = new AiOrchestrationService();
    this.quoteNormalizer = new QuoteNormalizerService();

    this.initializeData();
  }

  public resetDemo(): { resetAt: string; seededIncidents: number; seededQuotes: number } {
    this.estates.clear();
    this.assets.clear();
    this.incidents.clear();
    this.quotes.clear();
    this.approvals.clear();
    this.workOrders.clear();
    this.vendors.clear();
    this.notifications = [];

    this.auditService = new AuditService();
    this.idempotencyService = new IdempotencyService();
    this.outboxService = new OutboxService();

    this.initializeData();

    return {
      resetAt: new Date().toISOString(),
      seededIncidents: this.incidents.size,
      seededQuotes: this.quotes.size,
    };
  }

  private initializeData(): void {
    for (const est of initialEstates) {
      this.estates.set(est.id, { ...est });
    }
    for (const ast of initialAssets) {
      this.assets.set(ast.id, { ...ast });
    }
    for (const vnd of initialVendors) {
      this.vendors.set(vnd.id, { ...vnd });
    }
    for (const inc of initialIncidents) {
      this.incidents.set(inc.id, { ...inc });
    }
    for (const q of initialQuotes) {
      this.quotes.set(q.id, { ...q });
    }

    // Seed initial genesis audit events
    this.auditService.recordEvent({
      aggregateType: 'ORGANIZATION',
      aggregateId: this.organization.id,
      actorId: 'ACT-SYS-001',
      actorName: 'ASTERA System Bootstrap',
      actorRole: 'auditor',
      action: 'ORGANIZATION_INITIALIZED',
      payload: { orgName: this.organization.name, policy: this.organization.policySetId },
      occurredAt: '2026-01-01T00:00:00.000Z',
    });

    this.auditService.recordEvent({
      aggregateType: 'INCIDENT',
      aggregateId: 'INC-2026-089',
      actorId: 'ACT-USR-MGR',
      actorName: 'Staff Lead',
      actorRole: 'estate_manager',
      action: 'INCIDENT_INTAKE_RECORDED',
      payload: {
        estateId: 'EST-BLI-01',
        assetId: 'BLI-HVAC-04',
        severity: 'HIGH',
        summary: 'Master Suite HVAC condensate drain line backflow',
      },
      occurredAt: '2026-08-29T08:32:00.000Z',
    });

    this.auditService.recordEvent({
      aggregateType: 'QUOTE',
      aggregateId: 'QUO-BLI-01',
      actorId: 'ACT-SYS-AI',
      actorName: 'ASTERA AI Normalizer',
      actorRole: 'auditor',
      action: 'VENDOR_QUOTES_NORMALIZED',
      payload: {
        incidentId: 'INC-2026-089',
        quotesCount: 2,
        recommendedQuoteId: 'QUO-BLI-01',
        amountMinorUnits: 18500000,
      },
      occurredAt: '2026-08-29T09:48:00.000Z',
    });

    this.notifications.push({
      id: 'NOTIF-001',
      recipientId: 'USR-PRIN-01',
      recipientRole: 'principal',
      title: 'Spending Approval Required (Rp 18.5M)',
      message: 'Master-suite HVAC repair quote by Bali Climate Works awaits your authorization.',
      level: 'warning',
      read: false,
      linkUrl: '#incidents',
      createdAt: '2026-08-29T09:50:00.000Z',
    });
  }

  // --- ESTATES & PORTFOLIO ---

  public getEstates(): Estate[] {
    return Array.from(this.estates.values());
  }

  public getEstate(id: string): Estate | undefined {
    return this.estates.get(id);
  }

  public getPortfolioKpis(estateId?: string): PortfolioKpis {
    const incidents = this.getIncidents(estateId);
    const openIncidents = incidents.filter(
      (i) => i.status !== 'RESOLVED' && i.status !== 'REJECTED'
    );
    const pendingApprovals = incidents.filter((i) => i.status === 'AWAITING_APPROVAL');
    const slaAtRisk = incidents.filter(
      (i) => i.severity === 'CRITICAL' || i.severity === 'HIGH'
    );

    const assets = this.getAssets(estateId);
    const healthyCount = assets.filter((a) => a.state === 'Healthy').length;
    const healthyPct = assets.length > 0 ? Math.round((healthyCount / assets.length) * 100) : 100;

    let monthlySpend = 0;
    for (const wo of this.workOrders.values()) {
      if (wo.status === 'COMPLETED') {
        const q = this.quotes.get(wo.quoteId);
        if (q) monthlySpend += q.totalAmountMinorUnits;
      }
    }

    return {
      openIncidentsCount: openIncidents.length,
      slaAtRiskCount: slaAtRisk.length,
      pendingApprovalsCount: pendingApprovals.length,
      costAvoidanceMinorUnits: 42000000, // Rp 42,000,000 estimated savings via preventative catch
      activeEstatesCount: estateId ? 1 : this.estates.size,
      healthyAssetsPercentage: healthyPct,
      monthlySpendMinorUnits: monthlySpend,
      currency: 'IDR',
    };
  }

  // --- ASSETS & TELEMETRY ---

  public getAssets(estateId?: string): Asset[] {
    const list = Array.from(this.assets.values());
    if (estateId) {
      return list.filter((a) => a.estateId === estateId);
    }
    return list;
  }

  public getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  public addTelemetry(assetId: string, readings: TelemetryReading[]): Asset | undefined {
    const asset = this.assets.get(assetId);
    if (!asset) return undefined;

    asset.telemetry = [...readings, ...asset.telemetry].slice(0, 20);
    asset.updatedAt = new Date().toISOString();
    this.assets.set(assetId, asset);
    return asset;
  }

  // --- INCIDENTS ---

  public getIncidents(estateId?: string, status?: IncidentStatus): Incident[] {
    let list = Array.from(this.incidents.values());
    if (estateId) {
      list = list.filter((i) => i.estateId === estateId);
    }
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    return list.sort(
      (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }

  public getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  public createIncident(params: {
    estateId: string;
    assetId?: string;
    summary: string;
    description: string;
    severitySuggestion?: IncidentSeverity;
    reportedBy: string;
    reportedByRole: UserRole;
    evidence?: {
      fileName: string;
      mediaType: 'photo' | 'document' | 'voice' | 'note';
      fileSizeBytes: number;
      url: string;
      checksumSha256?: string;
      note?: string;
    }[];
  }): Incident {
    const estate = this.estates.get(params.estateId);
    const estateLabel = estate ? estate.label : 'Estate';
    let assetName: string | undefined;
    if (params.assetId) {
      const ast = this.assets.get(params.assetId);
      if (ast) assetName = ast.name;
    }

    const incSeq = this.incidents.size + 90;
    const incId = `INC-2026-${String(incSeq).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const formattedEvidence = (params.evidence || []).map((e, idx) => ({
      id: `EVD-${incSeq}-${String(idx + 1).padStart(2, '0')}`,
      incidentId: incId,
      storageKey: `evidence/${incId.toLowerCase()}/${e.fileName}`,
      mediaType: e.mediaType,
      fileName: e.fileName,
      fileSizeBytes: e.fileSizeBytes,
      checksumSha256: e.checksumSha256 || '0'.repeat(64),
      url: e.url,
      capturedAt: now,
      note: e.note,
    }));

    // Generate Advisory AI Triage
    const triage = this.aiService.generateAdvisoryTriage({
      summary: params.summary,
      description: params.description,
      evidence: formattedEvidence,
      severityHint: params.severitySuggestion,
      assetName,
    });

    const incident: Incident = {
      id: incId,
      referenceNumber: incId,
      estateId: params.estateId,
      estateLabel,
      assetId: params.assetId,
      assetName,
      severity: triage.suggestedSeverity,
      status: 'TRIAGED',
      summary: params.summary,
      description: params.description,
      reportedBy: params.reportedBy,
      reportedByRole: params.reportedByRole,
      reportedAt: now,
      updatedAt: now,
      evidence: formattedEvidence,
      triage,
    };

    this.incidents.set(incId, incident);

    // Record Append-Only Audit Event
    this.auditService.recordEvent({
      aggregateType: 'INCIDENT',
      aggregateId: incId,
      actorId: params.reportedBy,
      actorName: params.reportedBy,
      actorRole: params.reportedByRole,
      action: 'INCIDENT_CREATED',
      payload: {
        incidentId: incId,
        estateId: params.estateId,
        summary: params.summary,
        severity: incident.severity,
      },
    });

    return incident;
  }

  // --- QUOTES ---

  public getQuotesForIncident(incidentId: string): NormalizedQuote[] {
    return Array.from(this.quotes.values()).filter((q) => q.incidentId === incidentId);
  }

  public getQuote(id: string): NormalizedQuote | undefined {
    return this.quotes.get(id);
  }

  // --- APPROVALS (HUMAN-IN-THE-LOOP SPENDING GUARD) ---

  public approveQuote(params: {
    incidentId: string;
    quoteId: string;
    approverId: string;
    approverName: string;
    approverRole: UserRole;
    explicitAck: true;
    notes?: string;
    idempotencyKey: string;
  }): { approval: Approval; workOrder: WorkOrder; incident: Incident } {
    const incident = this.incidents.get(params.incidentId);
    if (!incident) throw new Error(`Incident ${params.incidentId} not found`);

    const quote = this.quotes.get(params.quoteId);
    if (!quote) throw new Error(`Quote ${params.quoteId} not found`);

    const now = new Date().toISOString();
    const approvalId = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const approval: Approval = {
      id: approvalId,
      incidentId: params.incidentId,
      quoteId: params.quoteId,
      approverId: params.approverId,
      approverName: params.approverName,
      approverRole: params.approverRole,
      status: 'APPROVED',
      amountMinorUnits: quote.totalAmountMinorUnits,
      currency: quote.currency,
      explicitAck: params.explicitAck,
      notes: params.notes,
      decidedAt: now,
      idempotencyKey: params.idempotencyKey,
    };
    this.approvals.set(approvalId, approval);

    // Auto-create Work Order in PENDING_DISPATCH state
    const woNumber = `WO-${incident.estateLabel.substring(0, 3).toUpperCase()}-2026-${String(
      this.workOrders.size + 45
    ).padStart(3, '0')}`;
    const workOrderId = `WO-${Date.now()}`;

    const workOrder: WorkOrder = {
      id: workOrderId,
      workOrderNumber: woNumber,
      incidentId: incident.id,
      quoteId: quote.id,
      estateId: incident.estateId,
      vendorId: quote.vendorId,
      vendorName: quote.vendorName,
      status: 'PENDING_DISPATCH',
      scheduledArrival: quote.estimatedArrivalTimestamp,
      dispatchedAt: now,
      outboxDispatched: false,
      outboxAttempts: 0,
      slaTargetMinutes: quote.etaHours * 60,
      notes: `Authorized spend: ${quote.currency} ${(
        quote.totalAmountMinorUnits / 1000000
      ).toFixed(1)}M by ${params.approverName}`,
    };
    this.workOrders.set(workOrderId, workOrder);

    // Update Incident State
    incident.status = 'APPROVED';
    incident.selectedQuoteId = quote.id;
    incident.workOrderId = workOrderId;
    incident.updatedAt = now;
    this.incidents.set(incident.id, incident);

    // Record Audit Event
    this.auditService.recordEvent({
      aggregateType: 'APPROVAL',
      aggregateId: approvalId,
      actorId: params.approverId,
      actorName: params.approverName,
      actorRole: params.approverRole,
      action: 'SPENDING_AUTHORIZED_AND_LOCKED',
      payload: {
        approvalId,
        incidentId: incident.id,
        quoteId: quote.id,
        amountMinorUnits: quote.totalAmountMinorUnits,
        currency: quote.currency,
        workOrderId,
        explicitAck: true,
      },
    });

    return { approval, workOrder, incident };
  }

  public rejectQuote(params: {
    incidentId: string;
    quoteId: string;
    approverId: string;
    approverName: string;
    approverRole: UserRole;
    reason: string;
    idempotencyKey: string;
  }): { approval: Approval; incident: Incident } {
    const incident = this.incidents.get(params.incidentId);
    if (!incident) throw new Error(`Incident ${params.incidentId} not found`);

    const quote = this.quotes.get(params.quoteId);
    if (!quote) throw new Error(`Quote ${params.quoteId} not found`);

    const now = new Date().toISOString();
    const approvalId = `APP-${Date.now()}`;

    const approval: Approval = {
      id: approvalId,
      incidentId: params.incidentId,
      quoteId: params.quoteId,
      approverId: params.approverId,
      approverName: params.approverName,
      approverRole: params.approverRole,
      status: 'REJECTED',
      amountMinorUnits: quote.totalAmountMinorUnits,
      currency: quote.currency,
      explicitAck: false,
      notes: params.reason,
      decidedAt: now,
      idempotencyKey: params.idempotencyKey,
    };
    this.approvals.set(approvalId, approval);

    incident.status = 'REJECTED';
    incident.updatedAt = now;
    this.incidents.set(incident.id, incident);

    this.auditService.recordEvent({
      aggregateType: 'APPROVAL',
      aggregateId: approvalId,
      actorId: params.approverId,
      actorName: params.approverName,
      actorRole: params.approverRole,
      action: 'SPENDING_REJECTED',
      payload: {
        incidentId: incident.id,
        quoteId: quote.id,
        reason: params.reason,
      },
    });

    return { approval, incident };
  }

  // --- WORK ORDERS & DISPATCH ---

  public getWorkOrders(estateId?: string): WorkOrder[] {
    const list = Array.from(this.workOrders.values());
    if (estateId) return list.filter((w) => w.estateId === estateId);
    return list;
  }

  public getWorkOrder(id: string): WorkOrder | undefined {
    return this.workOrders.get(id);
  }

  public dispatchWorkOrder(params: {
    workOrderId: string;
    actorId: string;
    actorRole: UserRole;
    assignedTechnician?: string;
    technicianContact?: string;
    notes?: string;
  }): WorkOrder {
    const wo = this.workOrders.get(params.workOrderId);
    if (!wo) throw new Error(`WorkOrder ${params.workOrderId} not found`);

    const now = new Date().toISOString();
    wo.status = 'DISPATCHED';
    wo.assignedTechnician = params.assignedTechnician || 'Primary Field Dispatch';
    wo.technicianContact = params.technicianContact || '+62 361 8849 011';
    wo.dispatchedAt = now;
    wo.outboxDispatched = true;
    wo.outboxAttempts = 1;

    // Enqueue in Outbox
    this.outboxService.enqueue('vendor.dispatch.webhook', {
      workOrderId: wo.id,
      vendorId: wo.vendorId,
      incidentId: wo.incidentId,
    });

    const incident = this.incidents.get(wo.incidentId);
    if (incident) {
      incident.status = 'DISPATCHED';
      incident.updatedAt = now;
      this.incidents.set(incident.id, incident);
    }

    this.auditService.recordEvent({
      aggregateType: 'WORK_ORDER',
      aggregateId: wo.id,
      actorId: params.actorId,
      actorName: params.actorId,
      actorRole: params.actorRole,
      action: 'WORK_ORDER_DISPATCHED',
      payload: {
        workOrderId: wo.id,
        vendorId: wo.vendorId,
        incidentId: wo.incidentId,
      },
    });

    return wo;
  }

  // --- VENDORS ---

  public getVendors(): Vendor[] {
    return Array.from(this.vendors.values());
  }

  public getVendor(id: string): Vendor | undefined {
    return this.vendors.get(id);
  }

  // --- AUDIT & VERIFICATION ---

  public getAuditEvents(options?: {
    aggregateType?: AuditAggregateType;
    aggregateId?: string;
    actorId?: string;
    limit?: number;
    cursor?: string;
  }): { events: AuditEvent[]; total: number; nextCursor?: string } {
    return this.auditService.getEvents(options);
  }

  public verifyAuditChain(): AuditVerificationResult {
    return this.auditService.verifyChainIntegrity();
  }

  // --- SEARCH & REPORTS ---

  public search(query: string): GlobalSearchResult {
    const q = query.toLowerCase().trim();
    if (!q) return { query, results: [] };

    const results: GlobalSearchResult['results'] = [];

    // Search Incidents
    for (const inc of this.incidents.values()) {
      if (
        inc.referenceNumber.toLowerCase().includes(q) ||
        inc.summary.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'incident',
          id: inc.id,
          title: `${inc.referenceNumber}: ${inc.summary}`,
          subtitle: `${inc.estateLabel} · Status: ${inc.status}`,
          statusBadge: inc.severity,
          url: `#incidents`,
        });
      }
    }

    // Search Assets
    for (const ast of this.assets.values()) {
      if (
        ast.id.toLowerCase().includes(q) ||
        ast.name.toLowerCase().includes(q) ||
        ast.serialNumber.toLowerCase().includes(q) ||
        ast.location.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'asset',
          id: ast.id,
          title: `${ast.name} (${ast.id})`,
          subtitle: `${ast.estateLabel} · ${ast.location}`,
          statusBadge: ast.state,
          url: `#assets`,
        });
      }
    }

    // Search Vendors
    for (const vnd of this.vendors.values()) {
      if (
        vnd.name.toLowerCase().includes(q) ||
        vnd.category.toLowerCase().includes(q) ||
        vnd.primaryContact.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'vendor',
          id: vnd.id,
          title: vnd.name,
          subtitle: `${vnd.category} · Rating: ${vnd.rating} ★`,
          statusBadge: vnd.compliance.verifiedStatus,
          url: `#vendors`,
        });
      }
    }

    return { query, results };
  }

  public getFinancialReport(period: string = '2026-08'): FinancialAndOpsReport {
    const auditStatus = this.verifyAuditChain();

    return {
      generatedAt: new Date().toISOString(),
      period,
      currency: 'IDR',
      totalSpendMinorUnits: 32700000, // Rp 32.7M
      emergencySpendMinorUnits: 18500000, // Rp 18.5M
      plannedMaintenanceSpendMinorUnits: 14200000, // Rp 14.2M
      incidentBreakdown: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        total: 1,
      },
      vendorPerformance: Array.from(this.vendors.values()).map((v) => ({
        vendorId: v.id,
        vendorName: v.name,
        jobsCount: v.completedJobsCount,
        totalPaidMinorUnits: v.completedJobsCount * 12500000,
        slaComplianceRate: 98.4,
      })),
      auditIntegrityVerified: auditStatus.valid,
    };
  }

  public getNotifications(role?: UserRole): SystemNotification[] {
    if (role) {
      return this.notifications.filter((n) => n.recipientRole === role);
    }
    return [...this.notifications];
  }
}

// Global Singleton for in-memory persistence during server execution
declare global {
  // eslint-disable-next-line no-var
  var __asteraDbStore: AsteraDbStore | undefined;
}

export function getDbStore(): AsteraDbStore {
  if (!globalThis.__asteraDbStore) {
    globalThis.__asteraDbStore = new AsteraDbStore();
  }
  return globalThis.__asteraDbStore;
}
