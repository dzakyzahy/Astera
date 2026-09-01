import { createHash } from 'node:crypto';
import type { AuditAggregateType, AuditEvent, AuditVerificationResult, UserRole } from '../../types/domain';
import { db } from '@/lib/db';
import { auditEvents } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';

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
  private static readonly GENESIS_PREV_HASH = '0'.repeat(64);

  public async getEvents(options?: {
    aggregateType?: AuditAggregateType;
    aggregateId?: string;
    actorId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ events: AuditEvent[]; total: number; nextCursor?: string }> {
    let query = db.select().from(auditEvents).orderBy(desc(auditEvents.sequenceNumber)).$dynamic();
    
    if (options?.aggregateType) query = query.where(eq(auditEvents.aggregateType, options.aggregateType));
    if (options?.aggregateId) query = query.where(eq(auditEvents.aggregateId, options.aggregateId));
    if (options?.actorId) query = query.where(eq(auditEvents.actorId, options.actorId));
    
    const allEvents = await query;
    const limit = options?.limit ?? 50;
    const startIndex = options?.cursor ? allEvents.findIndex((e) => e.id === options.cursor) + 1 : 0;
    
    const page = allEvents.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < allEvents.length ? page[page.length - 1]?.id : undefined;

    return {
      events: page as unknown as AuditEvent[],
      total: allEvents.length,
      nextCursor,
    };
  }

  public async recordEvent(params: {
    aggregateType: AuditAggregateType;
    aggregateId: string;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    action: string;
    payload: Record<string, unknown>;
    occurredAt?: string;
  }): Promise<AuditEvent> {
    const occurredAt = params.occurredAt || new Date().toISOString();
    
    // In a real high-throughput system, this requires a transaction with SERIALIZABLE isolation 
    // or a specialized queue to prevent race conditions on sequenceNumber and previousHash.
    // For this pilot MVP, we fetch the latest event directly.
    const latestEventResult = await db.select().from(auditEvents).orderBy(desc(auditEvents.sequenceNumber)).limit(1);
    const latestEvent = latestEventResult[0];

    const sequenceNumber = latestEvent ? latestEvent.sequenceNumber + 1 : 1;
    const previousHash = latestEvent ? latestEvent.hash : AuditService.GENESIS_PREV_HASH;

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

    const eventToInsert = {
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
      occurredAt: new Date(occurredAt),
    };

    const inserted = await db.insert(auditEvents).values(eventToInsert).returning();
    
    return { ...inserted[0], occurredAt: inserted[0].occurredAt.toISOString() } as unknown as AuditEvent;
  }

  public async verifyChainIntegrity(): Promise<AuditVerificationResult> {
    const verifiedAt = new Date().toISOString();
    const allEventsResult = await db.select().from(auditEvents).orderBy(auditEvents.sequenceNumber);
    
    if (allEventsResult.length === 0) {
      return { valid: true, totalEvents: 0, chainLength: 0, verifiedAt };
    }

    for (let i = 0; i < allEventsResult.length; i++) {
      const current = allEventsResult[i];
      const expectedPrevHash = i === 0 ? AuditService.GENESIS_PREV_HASH : allEventsResult[i - 1].hash;

      if (current.previousHash !== expectedPrevHash) {
        return {
          valid: false,
          totalEvents: allEventsResult.length,
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
        current.aggregateType as AuditAggregateType,
        current.aggregateId,
        current.actorId,
        current.action,
        current.payload as Record<string, unknown>,
        current.occurredAt.toISOString()
      );

      if (current.hash !== recomputedHash) {
        return {
          valid: false,
          totalEvents: allEventsResult.length,
          chainLength: i,
          brokenEventId: current.id,
          brokenSequenceNumber: current.sequenceNumber,
          reason: `Hash signature tamper detected at sequence ${current.sequenceNumber}. Stored ${current.hash}, recomputed ${recomputedHash}`,
          verifiedAt,
        };
      }
    }

    return { valid: true, totalEvents: allEventsResult.length, chainLength: allEventsResult.length, verifiedAt };
  }
}

