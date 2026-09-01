import { createHash } from 'node:crypto';
import type { AuditAggregateType, AuditEvent, AuditVerificationResult, UserRole } from '../../types/domain';

export function calculateSha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function computeAuditEventHash(
  sequenceNumber: number,
  previousHash: string,
  aggregateType: AuditAggregateType,
  aggregateId: string,
  actorId: string,
  action: string,
  payload: Record<string, unknown>,
  occurredAt: string
): string {
  const canonicalPayload = JSON.stringify(payload, Object.keys(payload).sort());
  const preImage = `${sequenceNumber}|${previousHash}|${aggregateType}|${aggregateId}|${actorId}|${action}|${canonicalPayload}|${occurredAt}`;
  return calculateSha256(preImage);
}

export class AuditService {
  private events: AuditEvent[] = [];
  private static readonly GENESIS_PREV_HASH = '0'.repeat(64);

  constructor(initialEvents: AuditEvent[] = []) {
    this.events = [...initialEvents];
  }

  public getEvents(options?: {
    aggregateType?: AuditAggregateType;
    aggregateId?: string;
    actorId?: string;
    limit?: number;
    cursor?: string;
  }): { events: AuditEvent[]; total: number; nextCursor?: string } {
    let filtered = [...this.events];

    if (options?.aggregateType) {
      filtered = filtered.filter((e) => e.aggregateType === options.aggregateType);
    }
    if (options?.aggregateId) {
      filtered = filtered.filter((e) => e.aggregateId === options.aggregateId);
    }
    if (options?.actorId) {
      filtered = filtered.filter((e) => e.actorId === options.actorId);
    }

    // Sort descending by sequenceNumber (newest first)
    filtered.sort((a, b) => b.sequenceNumber - a.sequenceNumber);

    const limit = options?.limit ?? 50;
    const startIndex = options?.cursor
      ? filtered.findIndex((e) => e.id === options.cursor) + 1
      : 0;

    const page = filtered.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < filtered.length ? page[page.length - 1]?.id : undefined;

    return {
      events: page,
      total: filtered.length,
      nextCursor,
    };
  }

  public recordEvent(params: {
    aggregateType: AuditAggregateType;
    aggregateId: string;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    action: string;
    payload: Record<string, unknown>;
    occurredAt?: string;
  }): AuditEvent {
    const sequenceNumber = this.events.length + 1;
    const previousHash =
      this.events.length === 0
        ? AuditService.GENESIS_PREV_HASH
        : this.events[this.events.length - 1].hash;

    const occurredAt = params.occurredAt || new Date().toISOString();

    const hash = computeAuditEventHash(
      sequenceNumber,
      previousHash,
      params.aggregateType,
      params.aggregateId,
      params.actorId,
      params.action,
      params.payload,
      occurredAt
    );

    const event: AuditEvent = {
      id: `AUD-${String(sequenceNumber).padStart(6, '0')}`,
      sequenceNumber,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      previousHash,
      hash,
      payload: params.payload,
      occurredAt,
    };

    this.events.push(event);
    return event;
  }

  public verifyChainIntegrity(): AuditVerificationResult {
    const verifiedAt = new Date().toISOString();

    if (this.events.length === 0) {
      return {
        valid: true,
        totalEvents: 0,
        chainLength: 0,
        verifiedAt,
      };
    }

    for (let i = 0; i < this.events.length; i++) {
      const current = this.events[i];
      const expectedPrevHash =
        i === 0 ? AuditService.GENESIS_PREV_HASH : this.events[i - 1].hash;

      if (current.previousHash !== expectedPrevHash) {
        return {
          valid: false,
          totalEvents: this.events.length,
          chainLength: i,
          brokenEventId: current.id,
          brokenSequenceNumber: current.sequenceNumber,
          reason: `Previous hash mismatch at sequence ${current.sequenceNumber}. Expected ${expectedPrevHash}, found ${current.previousHash}`,
          verifiedAt,
        };
      }

      const recomputedHash = computeAuditEventHash(
        current.sequenceNumber,
        current.previousHash,
        current.aggregateType,
        current.aggregateId,
        current.actorId,
        current.action,
        current.payload,
        current.occurredAt
      );

      if (current.hash !== recomputedHash) {
        return {
          valid: false,
          totalEvents: this.events.length,
          chainLength: i,
          brokenEventId: current.id,
          brokenSequenceNumber: current.sequenceNumber,
          reason: `Hash signature tamper detected at sequence ${current.sequenceNumber}. Stored ${current.hash}, recomputed ${recomputedHash}`,
          verifiedAt,
        };
      }
    }

    return {
      valid: true,
      totalEvents: this.events.length,
      chainLength: this.events.length,
      verifiedAt,
    };
  }
}
