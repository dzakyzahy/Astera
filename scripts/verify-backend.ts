import assert from 'node:assert/strict';
import { AuditService } from '../lib/services/audit-service';
import { IdempotencyService } from '../lib/services/idempotency-service';
import { AiOrchestrationService } from '../lib/services/ai-orchestration-service';
import { QuoteNormalizerService } from '../lib/services/quote-normalizer-service';
import { OutboxService } from '../lib/services/outbox-service';
import { AsteraLangGraphOrchestrator } from '../lib/services/ai-graph-service';
import { AsteraDbStore } from '../lib/db/db-store';

console.log('--- RUNNING ASTERA BACKEND VERIFICATION SUITE ---');

// ==========================================
// 1. AUDIT SERVICE & CRYPTOGRAPHIC INTEGRITY
// ==========================================
console.log('1. Testing SHA-256 Audit Chain Integrity & Tamper Detection...');
const audit = new AuditService();

const evt1 = audit.recordEvent({
  aggregateType: 'ORGANIZATION',
  aggregateId: 'ORG-01',
  actorId: 'ACT-01',
  actorName: 'Lead Admin',
  actorRole: 'auditor',
  action: 'BOOTSTRAP',
  payload: { initialized: true },
});

const evt2 = audit.recordEvent({
  aggregateType: 'INCIDENT',
  aggregateId: 'INC-01',
  actorId: 'ACT-02',
  actorName: 'Staff Lead',
  actorRole: 'estate_manager',
  action: 'INCIDENT_INTAKE',
  payload: { severity: 'HIGH', note: 'AC leak' },
});

assert.equal(evt1.sequenceNumber, 1);
assert.equal(evt2.sequenceNumber, 2);
assert.equal(evt2.previousHash, evt1.hash, 'Event 2 must chain to Event 1 hash');

const initialCheck = audit.verifyChainIntegrity();
assert.equal(initialCheck.valid, true, 'Clean chain must pass integrity check');
assert.equal(initialCheck.chainLength, 2);

// Tamper simulation test
const tamperedAudit = new AuditService([
  { ...evt1 },
  { ...evt2, payload: { severity: 'LOW_TAMPERED' } }, // Tampered payload
]);
const tamperCheck = tamperedAudit.verifyChainIntegrity();
assert.equal(tamperCheck.valid, false, 'Tampered chain must be detected');
assert.equal(tamperCheck.brokenSequenceNumber, 2);
console.log('✓ SHA-256 Cryptographic Audit Chain passed.');

// ==========================================
// 2. IDEMPOTENCY ENGINE & CONCURRENCY LOCK
// ==========================================
console.log('2. Testing Idempotency Lock Engine...');
const idempotency = new IdempotencyService();
let counter = 0;

const runOp = async (key: string) =>
  idempotency.executeWithLock(key, 'TEST_OP', async () => {
    counter += 1;
    return { statusCode: 200, body: { counterValue: counter } };
  });

const res1 = await runOp('IDEMP-KEY-1001');
assert.equal(res1.cached, false);
assert.equal(res1.body.counterValue, 1);

const res2 = await runOp('IDEMP-KEY-1001');
assert.equal(res2.cached, true, 'Second call with same key must return cached result');
assert.equal(res2.body.counterValue, 1, 'Operation must not execute twice');
assert.equal(counter, 1);
console.log('✓ Idempotency Lock Engine passed.');

// ==========================================
// 3. AI ORCHESTRATION & ADVISORY TRIAGE
// ==========================================
console.log('3. Testing AI Advisory Triage Service...');
const ai = new AiOrchestrationService();
const triage = ai.generateAdvisoryTriage({
  summary: 'Master bedroom AC leaking water into ceiling',
  description: 'Water dripping rapidly near electrical conduit',
});

assert.equal(triage.suggestedSeverity, 'HIGH');
assert.ok(triage.confidenceScore > 0.8);
assert.ok(triage.containmentSteps.length >= 2);
assert.equal(triage.humanOverrideApplied, false);
console.log('✓ AI Advisory Triage passed.');

// ==========================================
// 4. QUOTE NORMALIZER & COMPARISON ENGINE
// ==========================================
console.log('4. Testing Quote Normalizer Service...');
const normalizer = new QuoteNormalizerService();
const normQuote = normalizer.normalizeVendorQuote({
  incidentId: 'INC-2026-089',
  vendorId: 'VND-01',
  vendorName: 'Bali Climate Works',
  vendorRating: 4.9,
  laborAmountMinorUnits: 7500000,
  partsAmountMinorUnits: 9200000,
  taxAmountMinorUnits: 1800000,
  etaHours: 2,
  warrantyMonths: 12,
  scopeDescription: 'Drain line clear & ultrasonic sensor install',
});

assert.equal(normQuote.totalAmountMinorUnits, 18500000);
assert.equal(normQuote.breakdown.laborMinorUnits, 7500000);
assert.equal(normQuote.riskRating, 'LOW');
assert.equal(normQuote.isAiRecommended, true);
console.log('✓ Quote Normalizer passed.');

// ==========================================
// 5. TRANSACTIONAL OUTBOX ENGINE
// ==========================================
console.log('5. Testing Outbox Queue Service...');
const outbox = new OutboxService();
outbox.enqueue('vendor.dispatch', { woId: 'WO-01' });
const pendingMsgs = outbox.getMessages('PENDING');
assert.equal(pendingMsgs.length, 1);

const outboxResult = await outbox.processQueue();
assert.equal(outboxResult.processed, 1);
const dispatchedMsgs = outbox.getMessages('DISPATCHED');
assert.equal(dispatchedMsgs.length, 1);
console.log('✓ Transactional Outbox passed.');

// ==========================================
// 6. END-TO-END GOLDEN WORKFLOW IN DB STORE
// ==========================================
console.log('6. Testing End-to-End Golden Workflow in AsteraDbStore...');
const store = new AsteraDbStore();

// Step A: Intake Incident
const newInc = store.createIncident({
  estateId: 'EST-BLI-01',
  assetId: 'BLI-HVAC-04',
  summary: 'Chiller pressure anomaly',
  description: 'Line pressure dropped below nominal threshold 15 PSI',
  severitySuggestion: 'HIGH',
  reportedBy: 'Staff Lead',
  reportedByRole: 'estate_manager',
  evidence: [],
});
assert.equal(newInc.status, 'TRIAGED');
assert.ok(newInc.id.startsWith('INC-2026-'));

// Step B: Spending Approval (Human-in-the-Loop)
const quotes = store.getQuotesForIncident('INC-2026-089');
assert.ok(quotes.length >= 1);
const selectedQuote = quotes[0];

const approvalRes = store.approveQuote({
  incidentId: 'INC-2026-089',
  quoteId: selectedQuote.id,
  approverId: 'USR-PRIN-01',
  approverName: 'Estate Principal',
  approverRole: 'principal',
  explicitAck: true,
  notes: 'Approved for immediate remediation',
  idempotencyKey: 'IDEMP-APP-TEST-99',
});

assert.equal(approvalRes.approval.status, 'APPROVED');
assert.equal(approvalRes.incident.status, 'APPROVED');
assert.equal(approvalRes.workOrder.status, 'PENDING_DISPATCH');

// Step C: Vendor Dispatch
const dispatchedWo = store.dispatchWorkOrder({
  workOrderId: approvalRes.workOrder.id,
  actorId: 'USR-MGR-01',
  actorRole: 'estate_manager',
  assignedTechnician: 'I Wayan S.',
  technicianContact: '+62 361 8849 011',
});

assert.equal(dispatchedWo.status, 'DISPATCHED');
assert.equal(dispatchedWo.outboxDispatched, true);

// Step D: Verify Entire Audit Chain
const fullAuditVerification = store.verifyAuditChain();
assert.equal(fullAuditVerification.valid, true, 'Full database audit chain must remain cryptographically valid');
console.log(`✓ Full Golden Workflow passed. Audit chain verified with ${fullAuditVerification.totalEvents} tamper-evident events.`);

// ==========================================
// 7. LANGGRAPH MULTI-AGENT STATEGRAPH ORCHESTRATION
// ==========================================
console.log('7. Testing LangGraph StateGraph Multi-Agent Workflow...');
const graphOrchestrator = new AsteraLangGraphOrchestrator();

const graphIntake = await graphOrchestrator.runIntakeAndTriage({
  incidentId: 'INC-LG-001',
  summary: 'Server room chiller compressor vibration spike',
  description: 'Chiller unit registering 4.2 mm/s vibration and high head pressure',
  evidence: [],
});

assert.equal(graphIntake.currentStage, 'AWAITING_APPROVAL');
assert.ok(graphIntake.quotes.length > 0);
assert.equal(graphIntake.humanApproved, false);

// Now execute human approval decision
const graphApproved = await graphOrchestrator.processHumanDecision(graphIntake, {
  approved: true,
  approverId: 'USR-PRIN-01',
  selectedQuoteId: graphIntake.quotes[0].id,
});

assert.equal(graphApproved.currentStage, 'DISPATCHED');
assert.ok(graphApproved.workOrder !== undefined);
assert.equal(graphApproved.workOrder.status, 'DISPATCHED');
console.log('✓ LangGraph Multi-Agent StateGraph Workflow passed.');

// ==========================================
// 8. CONTEST DEMO RESET LIFECYCLE
// ==========================================
console.log('8. Testing Contest Demo Reset Lifecycle (Approve -> Dispatch -> Reset -> Initial State)...');
// 1. Initial State: INC-2026-089 is AWAITING_APPROVAL
const resetStore = new AsteraDbStore();
let inc = resetStore.getIncident('INC-2026-089');
assert.equal(inc?.status, 'AWAITING_APPROVAL');

// 2. Approve and Dispatch
const appRes = resetStore.approveQuote({
  incidentId: 'INC-2026-089',
  quoteId: 'QUO-BLI-01',
  approverId: 'USR-PRIN-01',
  approverName: 'Estate Principal',
  approverRole: 'principal',
  explicitAck: true,
  idempotencyKey: 'IDEMP-RESET-TEST-01',
});
assert.equal(appRes.incident.status, 'APPROVED');

const dispWo = resetStore.dispatchWorkOrder({
  workOrderId: appRes.workOrder.id,
  actorId: 'USR-MGR-01',
  actorRole: 'estate_manager',
});
assert.equal(dispWo.status, 'DISPATCHED');
inc = resetStore.getIncident('INC-2026-089');
assert.equal(inc?.status, 'DISPATCHED');

// 3. Reset Demo State
const resetResult = resetStore.resetDemo();
assert.ok(resetResult.resetAt);
assert.equal(resetResult.seededIncidents, 1);

// 4. Verify Restored Initial State
inc = resetStore.getIncident('INC-2026-089');
assert.equal(inc?.status, 'AWAITING_APPROVAL', 'Incident must be restored to AWAITING_APPROVAL after demo reset');
const restoredAudit = resetStore.verifyAuditChain();
assert.equal(restoredAudit.valid, true, 'Audit chain must be valid after demo reset');
console.log('✓ Contest Demo Reset Lifecycle passed.');

console.log('\n=============================================');
console.log(' ALL BACKEND VERIFICATION CHECKS COMPLETED ');
console.log('=============================================');
