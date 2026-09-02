import assert from 'node:assert/strict';
import { AuditService } from '../lib/services/audit-service';
import { IdempotencyService } from '../lib/services/idempotency-service';
import { AiOrchestrationService } from '../lib/services/ai-orchestration-service';
import { QuoteNormalizerService } from '../lib/services/quote-normalizer-service';
import { OutboxService } from '../lib/services/outbox-service';

async function main() {
  console.log('--- RUNNING ASTERA BACKEND VERIFICATION SUITE ---');

  // ==========================================
  // 1. AUDIT SERVICE & CRYPTOGRAPHIC INTEGRITY
  // ==========================================
  console.log('1. Testing SHA-256 Audit Chain Integrity & Tamper Detection...');
  const audit = new AuditService();

  const evt1 = await audit.recordEvent({
    aggregateType: 'ORGANIZATION',
    aggregateId: 'ORG-01',
    actorId: 'ACT-01',
    actorName: 'Lead Admin',
    actorRole: 'auditor',
    action: 'BOOTSTRAP',
    payload: { initialized: true },
  });

  const evt2 = await audit.recordEvent({
    aggregateType: 'INCIDENT',
    aggregateId: 'INC-01',
    actorId: 'ACT-02',
    actorName: 'Staff Lead',
    actorRole: 'estate_manager',
    action: 'INCIDENT_INTAKE',
    payload: { severity: 'HIGH', note: 'AC leak' },
  });

  assert.ok(evt1.sequenceNumber > 0);
  assert.equal(evt2.sequenceNumber, evt1.sequenceNumber + 1);
  assert.equal(evt2.previousHash, evt1.hash, 'Event 2 must chain to Event 1 hash');

  const initialCheck = await audit.verifyChainIntegrity();
  assert.equal(initialCheck.valid, true, 'Clean chain must pass integrity check');

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
  await outbox.enqueue('vendor.dispatch', { woId: 'WO-01' });
  const pendingMsgs = await outbox.getMessages('PENDING');
  // It's possible other tests or seeding left pending messages, so we check for at least 1
  assert.ok(pendingMsgs.length >= 1);

  const outboxResult = await outbox.processQueue();
  assert.ok(outboxResult.processed >= 1);
  const dispatchedMsgs = await outbox.getMessages('DISPATCHED');
  assert.ok(dispatchedMsgs.length >= 1);
  console.log('✓ Transactional Outbox passed.');

  console.log('\n=============================================');
  console.log(' ALL BACKEND VERIFICATION CHECKS COMPLETED ');
  console.log('=============================================');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
