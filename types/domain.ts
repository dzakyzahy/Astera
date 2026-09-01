/**
 * ASTERA Shared Domain Contracts & Types
 * Baseline: docs/DATA_MODEL.md, docs/ARCHITECTURE.md, docs/PRD.md, docs/SCOPING.md
 *
 * Rules:
 * - Monetary values use integer minor units (e.g., IDR 18.500.000 -> 18500000)
 * - Timestamps are stored in UTC ISO 8601 strings
 * - AI fields contain advisory markers, confidence scores, and source evidence citations
 * - Cryptographic audit events use SHA-256 chain links (prevHash -> hash)
 */

// ==========================================
// 1. ORGANIZATIONAL & ACCESS MODEL
// ==========================================

export type UserRole = 'principal' | 'estate_manager' | 'steward' | 'vendor' | 'auditor';

export interface Organization {
  id: string;
  name: string;
  policySetId: string;
  createdAt: string;
}

export interface Estate {
  id: string;
  organizationId: string;
  label: string;
  code: string; // e.g. 'JKT', 'BLI'
  location: string;
  timezone: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  activeIncidentsCount: number;
  totalAssetsCount: number;
  monthlyBudgetMinorUnits: number;
  currency: string;
  createdAt: string;
}

export interface Space {
  id: string;
  estateId: string;
  label: string;
  type: 'RESIDENTIAL' | 'UTILITY' | 'GROUNDS' | 'SECURITY' | 'RECREATION';
  floorLevel?: string;
}

export interface Membership {
  id: string;
  userId: string;
  userName: string;
  organizationId: string;
  estateIds: string[];
  role: UserRole;
  spendingLimitMinorUnits?: number;
}

// ==========================================
// 2. ASSET & TELEMETRY MODEL
// ==========================================

export type AssetCategory = 'HVAC' | 'Power' | 'Water' | 'Security' | 'Structural' | 'Network';
export type AssetState = 'Healthy' | 'Scheduled' | 'Attention';

export interface TelemetryReading {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'normal';
  timestamp: string;
  unit?: string;
}

export interface AssetServiceLog {
  date: string;
  summary: string;
  technician: string;
  workOrderId?: string;
}

export interface Asset {
  id: string;
  estateId: string;
  estateLabel: string;
  spaceId: string;
  spaceLabel: string;
  name: string;
  category: AssetCategory;
  state: AssetState;
  nextScheduledService: string;
  location: string;
  serialNumber: string;
  specifications: string;
  lastServiceDate: string;
  telemetry: TelemetryReading[];
  logs: AssetServiceLog[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. INCIDENT & AI TRIAGE MODEL
// ==========================================

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'DRAFT'
  | 'TRIAGED'
  | 'QUOTING'
  | 'AWAITING_APPROVAL'
  | 'REJECTED'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export type EvidenceType = 'photo' | 'document' | 'voice' | 'note';

export interface Evidence {
  id: string;
  incidentId: string;
  storageKey: string;
  mediaType: EvidenceType;
  fileName: string;
  fileSizeBytes: number;
  checksumSha256: string;
  url: string;
  capturedAt: string;
  note?: string;
}

export interface ContainmentStep {
  stepNumber: number;
  action: string;
  targetRole: UserRole;
  completed: boolean;
  completedAt?: string;
}

export interface AdvisoryTriage {
  suggestedSeverity: IncidentSeverity;
  confidenceScore: number; // 0.0 - 1.0
  reasoning: string;
  citations: string[];
  recommendedSpecialty: string;
  containmentSteps: ContainmentStep[];
  aiModelVersion: string;
  triagedAt: string;
  humanOverrideApplied: boolean;
  humanOverrideNotes?: string;
}

export interface Incident {
  id: string;
  referenceNumber: string; // e.g. 'INC-2026-089'
  estateId: string;
  estateLabel: string;
  assetId?: string;
  assetName?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  summary: string;
  description: string;
  reportedBy: string;
  reportedByRole: UserRole;
  reportedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  evidence: Evidence[];
  triage: AdvisoryTriage;
  selectedQuoteId?: string;
  workOrderId?: string;
}

// ==========================================
// 4. QUOTE & NORMALIZER MODEL
// ==========================================

export interface QuoteCostBreakdown {
  laborMinorUnits: number;
  partsMinorUnits: number;
  permitMinorUnits: number;
  taxMinorUnits: number;
}

export interface NormalizedQuote {
  id: string;
  incidentId: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  totalAmountMinorUnits: number;
  currency: string;
  breakdown: QuoteCostBreakdown;
  etaHours: number;
  estimatedArrivalTimestamp: string;
  warrantyMonths: number;
  scopeDescription: string;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  aiRecommendationScore: number; // 0 - 100
  aiRecommendationRationale: string;
  isAiRecommended: boolean;
  complianceVerified: boolean;
  submittedAt: string;
}

// ==========================================
// 5. APPROVAL & SPENDING MODEL
// ==========================================

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Approval {
  id: string;
  incidentId: string;
  quoteId: string;
  approverId: string;
  approverName: string;
  approverRole: UserRole;
  status: ApprovalStatus;
  amountMinorUnits: number;
  currency: string;
  explicitAck: boolean; // Mandatory confirmation checkbox
  notes?: string;
  decidedAt: string;
  idempotencyKey: string;
}

// ==========================================
// 6. WORK ORDER & DISPATCH MODEL
// ==========================================

export type WorkOrderStatus =
  | 'PENDING_DISPATCH'
  | 'DISPATCHED'
  | 'ACKNOWLEDGED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface WorkOrder {
  id: string;
  workOrderNumber: string; // e.g. 'WO-BLI-2026-044'
  incidentId: string;
  quoteId: string;
  estateId: string;
  vendorId: string;
  vendorName: string;
  status: WorkOrderStatus;
  assignedTechnician?: string;
  technicianContact?: string;
  scheduledArrival: string;
  dispatchedAt: string;
  acknowledgedAt?: string;
  startedAt?: string;
  completedAt?: string;
  outboxDispatched: boolean;
  outboxAttempts: number;
  slaTargetMinutes: number;
  notes?: string;
}

// ==========================================
// 7. VENDOR DIRECTORY & COMPLIANCE MODEL
// ==========================================

export interface VendorCompliance {
  insuranceValidUntil: string;
  licenseNumber: string;
  backgroundCheckPassed: boolean;
  ndaSigned: boolean;
  verifiedStatus: 'VERIFIED' | 'PENDING_RENEWAL' | 'SUSPENDED';
}

export interface Vendor {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  primaryContact: string;
  phone: string;
  email: string;
  serviceRegions: string[];
  averageSlaMinutes: number;
  compliance: VendorCompliance;
  rating: number;
  completedJobsCount: number;
  activeStatus: 'ACTIVE' | 'INACTIVE';
}

// ==========================================
// 8. CRYPTOGRAPHIC AUDIT TRAIL MODEL
// ==========================================

export type AuditAggregateType =
  | 'ORGANIZATION'
  | 'ESTATE'
  | 'ASSET'
  | 'INCIDENT'
  | 'QUOTE'
  | 'APPROVAL'
  | 'WORK_ORDER'
  | 'VENDOR'
  | 'SYSTEM';

export interface AuditEvent {
  id: string;
  sequenceNumber: number;
  aggregateType: AuditAggregateType;
  aggregateId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  previousHash: string;
  hash: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface AuditVerificationResult {
  valid: boolean;
  totalEvents: number;
  chainLength: number;
  brokenEventId?: string;
  brokenSequenceNumber?: number;
  reason?: string;
  verifiedAt: string;
}

// ==========================================
// 9. REPORTING & PORTFOLIO SUMMARY
// ==========================================

export interface PortfolioKpis {
  openIncidentsCount: number;
  slaAtRiskCount: number;
  pendingApprovalsCount: number;
  costAvoidanceMinorUnits: number;
  activeEstatesCount: number;
  healthyAssetsPercentage: number;
  monthlySpendMinorUnits: number;
  currency: string;
}

export interface EstatePortfolioSummary {
  estate: Estate;
  kpis: PortfolioKpis;
  recentIncidents: Incident[];
  activeWorkOrders: WorkOrder[];
}

export interface FinancialAndOpsReport {
  generatedAt: string;
  period: string;
  currency: string;
  totalSpendMinorUnits: number;
  emergencySpendMinorUnits: number;
  plannedMaintenanceSpendMinorUnits: number;
  incidentBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  vendorPerformance: {
    vendorId: string;
    vendorName: string;
    jobsCount: number;
    totalPaidMinorUnits: number;
    slaComplianceRate: number;
  }[];
  auditIntegrityVerified: boolean;
}

// ==========================================
// 10. NOTIFICATIONS & SEARCH
// ==========================================

export interface SystemNotification {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface GlobalSearchResult {
  query: string;
  results: {
    type: 'incident' | 'asset' | 'vendor' | 'audit' | 'estate';
    id: string;
    title: string;
    subtitle: string;
    statusBadge?: string;
    url: string;
  }[];
}

// ==========================================
// 11. IDEMPOTENCY & OUTBOX
// ==========================================

export interface IdempotencyRecord {
  key: string;
  action: string;
  statusCode: number;
  responseBody: unknown;
  lockedAt: string;
  completedAt?: string;
}
