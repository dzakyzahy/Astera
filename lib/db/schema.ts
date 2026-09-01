import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, serial } from 'drizzle-orm/pg-core';
import type { 
  Evidence, AdvisoryTriage, QuoteCostBreakdown, VendorCompliance, TelemetryReading, AssetServiceLog
} from '../../types/domain';

// --- ORGANIZATIONAL & ACCESS ---

export const organizations = pgTable('organizations', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  policySetId: varchar('policy_set_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const estates = pgTable('estates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organizations.id),
  label: varchar('label', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  timezone: varchar('timezone', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  activeIncidentsCount: integer('active_incidents_count').notNull(),
  totalAssetsCount: integer('total_assets_count').notNull(),
  monthlyBudgetMinorUnits: integer('monthly_budget_minor_units').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
});

// --- ASSETS & TELEMETRY ---

export const assets = pgTable('assets', {
  id: varchar('id', { length: 255 }).primaryKey(),
  estateId: varchar('estate_id', { length: 255 }).notNull().references(() => estates.id),
  estateLabel: varchar('estate_label', { length: 255 }).notNull(),
  spaceId: varchar('space_id', { length: 255 }).notNull(),
  spaceLabel: varchar('space_label', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  state: varchar('state', { length: 50 }).notNull(),
  nextScheduledService: timestamp('next_scheduled_service').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  serialNumber: varchar('serial_number', { length: 255 }).notNull(),
  specifications: text('specifications').notNull(),
  lastServiceDate: timestamp('last_service_date').notNull(),
  telemetry: jsonb('telemetry').$type<TelemetryReading[]>().notNull().default([]),
  logs: jsonb('logs').$type<AssetServiceLog[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

// --- INCIDENTS ---

export const incidents = pgTable('incidents', {
  id: varchar('id', { length: 255 }).primaryKey(),
  referenceNumber: varchar('reference_number', { length: 100 }).notNull(),
  estateId: varchar('estate_id', { length: 255 }).notNull().references(() => estates.id),
  estateLabel: varchar('estate_label', { length: 255 }).notNull(),
  assetId: varchar('asset_id', { length: 255 }).references(() => assets.id),
  assetName: varchar('asset_name', { length: 255 }),
  severity: varchar('severity', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  summary: varchar('summary', { length: 500 }).notNull(),
  description: text('description').notNull(),
  reportedBy: varchar('reported_by', { length: 255 }).notNull(),
  reportedByRole: varchar('reported_by_role', { length: 100 }).notNull(),
  reportedAt: timestamp('reported_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  resolvedAt: timestamp('resolved_at'),
  evidence: jsonb('evidence').$type<Evidence[]>().notNull().default([]),
  triage: jsonb('triage').$type<AdvisoryTriage>().notNull(),
  selectedQuoteId: varchar('selected_quote_id', { length: 255 }),
  workOrderId: varchar('work_order_id', { length: 255 }),
});

// --- VENDORS ---

export const vendors = pgTable('vendors', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  primaryContact: varchar('primary_contact', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  serviceRegions: jsonb('service_regions').$type<string[]>().notNull(),
  averageSlaMinutes: integer('average_sla_minutes').notNull(),
  compliance: jsonb('compliance').$type<VendorCompliance>().notNull(),
  rating: integer('rating').notNull(),
  completedJobsCount: integer('completed_jobs_count').notNull(),
  activeStatus: varchar('active_status', { length: 50 }).notNull(),
});

// --- QUOTES ---

export const quotes = pgTable('quotes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  incidentId: varchar('incident_id', { length: 255 }).notNull().references(() => incidents.id),
  vendorId: varchar('vendor_id', { length: 255 }).notNull().references(() => vendors.id),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  vendorRating: integer('vendor_rating').notNull(),
  totalAmountMinorUnits: integer('total_amount_minor_units').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  breakdown: jsonb('breakdown').$type<QuoteCostBreakdown>().notNull(),
  etaHours: integer('eta_hours').notNull(),
  estimatedArrivalTimestamp: timestamp('estimated_arrival_timestamp').notNull(),
  warrantyMonths: integer('warranty_months').notNull(),
  scopeDescription: text('scope_description').notNull(),
  riskRating: varchar('risk_rating', { length: 50 }).notNull(),
  aiRecommendationScore: integer('ai_recommendation_score').notNull(),
  aiRecommendationRationale: text('ai_recommendation_rationale').notNull(),
  isAiRecommended: boolean('is_ai_recommended').notNull(),
  complianceVerified: boolean('compliance_verified').notNull(),
  submittedAt: timestamp('submitted_at').notNull(),
});

// --- APPROVALS ---

export const approvals = pgTable('approvals', {
  id: varchar('id', { length: 255 }).primaryKey(),
  incidentId: varchar('incident_id', { length: 255 }).notNull().references(() => incidents.id),
  quoteId: varchar('quote_id', { length: 255 }).notNull().references(() => quotes.id),
  approverId: varchar('approver_id', { length: 255 }).notNull(),
  approverName: varchar('approver_name', { length: 255 }).notNull(),
  approverRole: varchar('approver_role', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  amountMinorUnits: integer('amount_minor_units').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  explicitAck: boolean('explicit_ack').notNull(),
  notes: text('notes'),
  decidedAt: timestamp('decided_at').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
});

// --- WORK ORDERS ---

export const workOrders = pgTable('work_orders', {
  id: varchar('id', { length: 255 }).primaryKey(),
  workOrderNumber: varchar('work_order_number', { length: 100 }).notNull().unique(),
  incidentId: varchar('incident_id', { length: 255 }).notNull().references(() => incidents.id),
  quoteId: varchar('quote_id', { length: 255 }).notNull().references(() => quotes.id),
  estateId: varchar('estate_id', { length: 255 }).notNull().references(() => estates.id),
  vendorId: varchar('vendor_id', { length: 255 }).notNull().references(() => vendors.id),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  assignedTechnician: varchar('assigned_technician', { length: 255 }),
  technicianContact: varchar('technician_contact', { length: 255 }),
  scheduledArrival: timestamp('scheduled_arrival').notNull(),
  dispatchedAt: timestamp('dispatched_at').notNull(),
  acknowledgedAt: timestamp('acknowledged_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  outboxDispatched: boolean('outbox_dispatched').notNull().default(false),
  outboxAttempts: integer('outbox_attempts').notNull().default(0),
  slaTargetMinutes: integer('sla_target_minutes').notNull(),
  notes: text('notes'),
});

// --- AUDIT TRAIL ---

export const auditEvents = pgTable('audit_events', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sequenceNumber: serial('sequence_number').notNull(),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  aggregateId: varchar('aggregate_id', { length: 255 }).notNull(),
  actorId: varchar('actor_id', { length: 255 }).notNull(),
  actorName: varchar('actor_name', { length: 255 }).notNull(),
  actorRole: varchar('actor_role', { length: 100 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  previousHash: varchar('previous_hash', { length: 100 }).notNull(),
  hash: varchar('hash', { length: 100 }).notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
});

// --- OUTBOX EVENTS ---
export const outboxEvents = pgTable('outbox_events', {
  id: varchar('id', { length: 255 }).primaryKey(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, PROCESSING, COMPLETED, FAILED
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at').notNull(),
  processedAt: timestamp('processed_at'),
  lastError: text('last_error'),
});
