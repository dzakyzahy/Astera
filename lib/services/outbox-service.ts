import { db } from '../db';
import { outboxEvents } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface OutboxMessage {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'DISPATCHED' | 'FAILED' | 'PROCESSING' | 'COMPLETED';
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
}

export class OutboxService {
  public async enqueue(topic: string, payload: Record<string, unknown>): Promise<OutboxMessage> {
    const id = `OBX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    
    await db.insert(outboxEvents).values({
      id,
      eventType: topic,
      payload,
      status: 'PENDING',
      attempts: 0,
      createdAt: now,
    });

    return {
      id,
      topic,
      payload,
      attempts: 0,
      maxAttempts: 3,
      status: 'PENDING',
      createdAt: now.toISOString(),
    };
  }

  public async processQueue(): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    // Get pending messages (simple lock by immediately updating status to PROCESSING in real app, here we just select and process)
    const pendingEvents = await db.select()
      .from(outboxEvents)
      .where(eq(outboxEvents.status, 'PENDING'))
      .limit(50);

    for (const msg of pendingEvents) {
      const attempts = msg.attempts + 1;
      const now = new Date();
      let newStatus = 'COMPLETED';
      let errorMsg = null;

      try {
        // Simulated deterministic dispatch delivery
        // In real life: await fetch(webhookUrl)
        processed += 1;
      } catch (err: unknown) {
        const error = err as Error;
        errorMsg = error.message;
        if (attempts >= 3) {
          newStatus = 'FAILED';
          failed += 1;
        } else {
          // Keep it pending for retry
          newStatus = 'PENDING';
        }
      }

      await db.update(outboxEvents).set({
        status: newStatus,
        attempts,
        processedAt: newStatus === 'COMPLETED' ? now : null,
        lastError: errorMsg,
      }).where(eq(outboxEvents.id, msg.id));
    }

    return { processed, failed };
  }

  public async getMessages(status?: 'PENDING' | 'DISPATCHED' | 'FAILED' | 'COMPLETED' | 'PROCESSING'): Promise<OutboxMessage[]> {
    let query = db.select().from(outboxEvents);
    if (status) {
      // Map 'DISPATCHED' to 'COMPLETED' for backward compatibility with old tests if needed
      const mappedStatus = status === 'DISPATCHED' ? 'COMPLETED' : status;
      query = query.where(eq(outboxEvents.status, mappedStatus)) as unknown as typeof query;
    }
    
    const events = await query.orderBy(outboxEvents.createdAt);
    
    return events.map(e => ({
      id: e.id,
      topic: e.eventType,
      payload: e.payload as Record<string, unknown>,
      attempts: e.attempts,
      maxAttempts: 3,
      status: (e.status === 'COMPLETED' ? 'DISPATCHED' : e.status) as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
      createdAt: e.createdAt.toISOString(),
      lastAttemptAt: e.processedAt?.toISOString(),
      errorMessage: e.lastError || undefined,
    }));
  }
}
