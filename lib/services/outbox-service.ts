export interface OutboxMessage {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'DISPATCHED' | 'FAILED';
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
}

export class OutboxService {
  private queue: OutboxMessage[] = [];

  public enqueue(topic: string, payload: Record<string, unknown>): OutboxMessage {
    const msg: OutboxMessage = {
      id: `OUT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic,
      payload,
      attempts: 0,
      maxAttempts: 3,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.queue.push(msg);
    return msg;
  }

  public async processQueue(): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const msg of this.queue) {
      if (msg.status === 'DISPATCHED') continue;

      msg.attempts += 1;
      msg.lastAttemptAt = new Date().toISOString();

      try {
        // Simulated deterministic dispatch delivery
        msg.status = 'DISPATCHED';
        processed += 1;
      } catch (err: unknown) {
        const error = err as Error;
        msg.errorMessage = error.message;
        if (msg.attempts >= msg.maxAttempts) {
          msg.status = 'FAILED';
          failed += 1;
        }
      }
    }

    return { processed, failed };
  }

  public getMessages(status?: 'PENDING' | 'DISPATCHED' | 'FAILED'): OutboxMessage[] {
    if (status) {
      return this.queue.filter((m) => m.status === status);
    }
    return [...this.queue];
  }
}
