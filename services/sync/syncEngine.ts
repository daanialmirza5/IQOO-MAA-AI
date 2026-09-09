import { OfflineSyncQueue } from "./offlineQueue";
import {
  SyncQueueItem,
  SyncBatchResult,
  MaternalVitalsPayload,
  PatientProfilePayload,
} from "./types";
import {
  resolveVitalsConflict,
  resolveProfileConflict,
} from "./conflictResolver";

export interface SyncTransport {
  sendAction(item: SyncQueueItem): Promise<{
    success: boolean;
    conflict?: {
      remoteData: any;
      type: "VITALS" | "PROFILE";
    };
    error?: string;
  }>;
}

export class SyncEngine {
  private queue: OfflineSyncQueue;
  private transport: SyncTransport;
  private isSyncing = false;
  private isOnline = true;

  private stats = {
    totalSynced: 0,
    totalFailed: 0,
    conflictsResolved: 0,
  };

  constructor(queue: OfflineSyncQueue, transport: SyncTransport) {
    this.queue = queue;
    this.transport = transport;
  }

  public setOnlineStatus(online: boolean) {
    this.isOnline = online;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public getStats() {
    return { ...this.stats, pendingQueueSize: this.queue.size() };
  }

  /**
   * Processes all ready pending items in the offline queue in priority order.
   */
  public async flushQueue(now = Date.now()): Promise<SyncBatchResult> {
    if (!this.isOnline || this.isSyncing) {
      return {
        totalProcessed: 0,
        succeeded: 0,
        failed: 0,
        conflictsResolved: 0,
        errors: [],
      };
    }

    this.isSyncing = true;
    const readyItems = this.queue.getReadyItems(now);
    const result: SyncBatchResult = {
      totalProcessed: readyItems.length,
      succeeded: 0,
      failed: 0,
      conflictsResolved: 0,
      errors: [],
    };

    try {
      for (const item of readyItems) {
        try {
          const response = await this.transport.sendAction(item);

          if (response.success) {
            this.queue.completeItem(item.id);
            result.succeeded += 1;
            this.stats.totalSynced += 1;
          } else if (response.conflict) {
            // Handle server-reported conflict
            if (
              response.conflict.type === "VITALS" &&
              item.actionType === "RECORD_VITALS"
            ) {
              const resolution = resolveVitalsConflict(
                item.payload as MaternalVitalsPayload,
                response.conflict.remoteData as MaternalVitalsPayload
              );

              result.conflictsResolved += 1;
              this.stats.conflictsResolved += 1;

              // Re-attempt transmission with resolved payload
              item.payload = resolution.resolved;
              const retryResponse = await this.transport.sendAction(item);
              if (retryResponse.success) {
                this.queue.completeItem(item.id);
                result.succeeded += 1;
                this.stats.totalSynced += 1;
              } else {
                this.queue.recordFailure(
                  item.id,
                  retryResponse.error || "Conflict retry failed",
                  now
                );
                result.failed += 1;
                this.stats.totalFailed += 1;
              }
            } else if (
              response.conflict.type === "PROFILE" &&
              item.actionType === "REGISTER_PATIENT"
            ) {
              const resolution = resolveProfileConflict(
                item.payload as PatientProfilePayload,
                response.conflict.remoteData as PatientProfilePayload
              );

              result.conflictsResolved += 1;
              this.stats.conflictsResolved += 1;

              item.payload = resolution.resolved;
              this.queue.completeItem(item.id);
              result.succeeded += 1;
              this.stats.totalSynced += 1;
            } else {
              this.queue.recordFailure(
                item.id,
                response.error || "Unhandled conflict",
                now
              );
              result.failed += 1;
              this.stats.totalFailed += 1;
            }
          } else {
            // General failure
            this.queue.recordFailure(
              item.id,
              response.error || "Network error",
              now
            );
            result.failed += 1;
            this.stats.totalFailed += 1;
            result.errors.push({
              itemId: item.id,
              error: response.error || "Unknown error",
            });
          }
        } catch (err: any) {
          this.queue.recordFailure(item.id, err.message, now);
          result.failed += 1;
          this.stats.totalFailed += 1;
          result.errors.push({ itemId: item.id, error: err.message });
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return result;
  }
}
