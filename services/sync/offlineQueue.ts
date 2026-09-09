import { SyncQueueItem, SyncActionType, SyncPriority } from "./types";

export class OfflineSyncQueue {
  private queue: SyncQueueItem[] = [];
  private idempotencyKeys: Set<string> = new Set();
  private baseDelayMs: number;
  private maxDelayMs: number;

  constructor(baseDelayMs = 1000, maxDelayMs = 60000) {
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  /**
   * Enqueues an action with automatic deduplication by idempotency key.
   */
  public enqueue<T = any>(
    actionType: SyncActionType,
    payload: T,
    idempotencyKey: string,
    priorityOverride?: SyncPriority,
    maxRetries = 5
  ): { enqueued: boolean; item?: SyncQueueItem<T>; message: string } {
    if (this.idempotencyKeys.has(idempotencyKey)) {
      return {
        enqueued: false,
        message: `Action with idempotency key ${idempotencyKey} is already queued`,
      };
    }

    // Default priorities
    let priority: SyncPriority = 2;
    if (actionType === "DISPATCH_EMERGENCY_ALERT") {
      priority = 0; // Highest
    } else if (
      actionType === "RECORD_VITALS" ||
      actionType === "RECORD_SCREENING"
    ) {
      priority = 1;
    }

    if (priorityOverride !== undefined) {
      priority = priorityOverride;
    }

    const item: SyncQueueItem<T> = {
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      actionType,
      priority,
      idempotencyKey,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    this.queue.push(item);
    this.idempotencyKeys.add(idempotencyKey);
    this.sortQueue();

    return {
      enqueued: true,
      item,
      message: `Enqueued with priority ${priority}`,
    };
  }

  /**
   * Sorts queue: Priority 0 first, then 1, then 2.
   * Within the same priority tier, older items (earliest createdAt) come first (FIFO).
   */
  private sortQueue() {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Returns items eligible for execution based on exponential backoff delay.
   */
  public getReadyItems(now = Date.now(), limit = 20): SyncQueueItem[] {
    const ready: SyncQueueItem[] = [];

    for (const item of this.queue) {
      if (ready.length >= limit) break;

      if (item.retryCount === 0 || !item.lastAttemptAt) {
        ready.push(item);
      } else {
        const requiredDelay = this.calculateBackoffDelay(item.retryCount);
        if (now - item.lastAttemptAt >= requiredDelay) {
          ready.push(item);
        }
      }
    }

    return ready;
  }

  /**
   * Calculates exponential backoff with deterministic jitter.
   */
  public calculateBackoffDelay(retryCount: number): number {
    const exponent = Math.min(retryCount, 6);
    const rawDelay = this.baseDelayMs * Math.pow(2, exponent);
    // Add 10% deterministic pseudo-jitter
    const jitter = (retryCount * 137) % 500;
    return Math.min(this.maxDelayMs, rawDelay + jitter);
  }

  /**
   * Marks an item as succeeded and removes it from the queue.
   */
  public completeItem(id: string): boolean {
    const index = this.queue.findIndex((i) => i.id === id);
    if (index !== -1) {
      const item = this.queue[index];
      this.idempotencyKeys.delete(item.idempotencyKey);
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Records a failure attempt, updates backoff timer, or removes if exceeded max retries.
   */
  public recordFailure(
    id: string,
    errorMsg: string,
    now = Date.now()
  ): { deadLettered: boolean; retriesRemaining: number } {
    const item = this.queue.find((i) => i.id === id);
    if (!item) {
      return { deadLettered: true, retriesRemaining: 0 };
    }

    item.retryCount += 1;
    item.lastAttemptAt = now;
    item.lastError = errorMsg;

    if (item.retryCount >= item.maxRetries) {
      // Exceeded max retries -> dead letter
      this.completeItem(id);
      return { deadLettered: true, retriesRemaining: 0 };
    }

    return {
      deadLettered: false,
      retriesRemaining: item.maxRetries - item.retryCount,
    };
  }

  public size(): number {
    return this.queue.length;
  }

  public peek(): SyncQueueItem | undefined {
    return this.queue[0];
  }

  public clear(): void {
    this.queue = [];
    this.idempotencyKeys.clear();
  }

  public toJSON(): string {
    return JSON.stringify(this.queue);
  }

  public fromJSON(jsonStr: string): void {
    try {
      const items: SyncQueueItem[] = JSON.parse(jsonStr);
      this.queue = items;
      this.idempotencyKeys = new Set(items.map((i) => i.idempotencyKey));
      this.sortQueue();
    } catch {
      this.clear();
    }
  }
}
