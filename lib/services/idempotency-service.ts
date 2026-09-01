export interface IdempotencyEntry<T = unknown> {
  key: string;
  action: string;
  statusCode: number;
  responseBody: T;
  lockedAt: number;
  completedAt?: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export class IdempotencyConflictError extends Error {
  constructor(message: string = 'Operation with this idempotency key is currently in progress') {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}

export class IdempotencyService {
  private records = new Map<string, IdempotencyEntry>();
  private readonly defaultTtlMs = 24 * 60 * 60 * 1000; // 24 hours
  private readonly lockTimeoutMs = 30 * 1000; // 30 seconds lock timeout

  public async executeWithLock<T>(
    key: string,
    action: string,
    operation: () => Promise<{ statusCode: number; body: T }>
  ): Promise<{ statusCode: number; body: T; cached: boolean }> {
    const existing = this.records.get(key);
    const now = Date.now();

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return {
          statusCode: existing.statusCode,
          body: existing.responseBody as T,
          cached: true,
        };
      }

      if (existing.status === 'PENDING') {
        // Check if lock expired
        if (now - existing.lockedAt < this.lockTimeoutMs) {
          throw new IdempotencyConflictError();
        }
      }
    }

    // Acquire lock
    this.records.set(key, {
      key,
      action,
      statusCode: 200,
      responseBody: null,
      lockedAt: now,
      status: 'PENDING',
    });

    try {
      const result = await operation();
      this.records.set(key, {
        key,
        action,
        statusCode: result.statusCode,
        responseBody: result.body,
        lockedAt: now,
        completedAt: Date.now(),
        status: 'COMPLETED',
      });
      return {
        statusCode: result.statusCode,
        body: result.body,
        cached: false,
      };
    } catch (error) {
      this.records.delete(key);
      throw error;
    }
  }

  public clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.records.entries()) {
      if (now - entry.lockedAt > this.defaultTtlMs) {
        this.records.delete(key);
      }
    }
  }
}
