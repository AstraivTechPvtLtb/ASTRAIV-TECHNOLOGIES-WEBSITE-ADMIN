'use client';

/**
 * @file admin/src/lib/enquiry-poller.ts
 * @description Client-side singleton coordinator for secure admin contact enquiry notifications.
 * Implements 25-second polling, visibility-state awareness, exponential backoff, stable cursors,
 * deduplication, and complete cleanup on unmount/logout.
 */

export interface EnquiryNotificationPayload {
  id: string;
  service: string;
  createdAt: string;
}

export interface EnquiryEvent {
  newEnquiries: EnquiryNotificationPayload[];
  count: number;
  latestTimestamp: string;
}

type NotificationListener = (event: EnquiryEvent) => void;
type StatusListener = (isActive: boolean) => void;

class EnquiryNotificationPoller {
  private notificationListeners = new Set<NotificationListener>();
  private statusListeners = new Set<StatusListener>();
  private cursor: string = new Date().toISOString();
  private seenIds = new Set<string>();
  private pollTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private isActive = false;
  private currentDelayMs = 25000; // 25s base polling interval (20-30s preferred)
  private readonly baseDelayMs = 25000;
  private readonly maxDelayMs = 60000;
  private abortController: AbortController | null = null;
  private isVisibilityBound = false;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Subscribe a component callback to receive new enquiry notifications.
   * Returns an unsubscription function.
   */
  public subscribe(onNotification: NotificationListener): () => void {
    this.notificationListeners.add(onNotification);

    if (this.notificationListeners.size === 1) {
      this.start();
    }

    return () => {
      this.notificationListeners.delete(onNotification);
      if (this.notificationListeners.size === 0) {
        this.stop();
      }
    };
  }

  /**
   * Subscribe to connection/sync active state changes.
   */
  public subscribeStatus(onStatusChange: StatusListener): () => void {
    this.statusListeners.add(onStatusChange);
    onStatusChange(this.isActive);

    return () => {
      this.statusListeners.delete(onStatusChange);
    };
  }

  /**
   * Returns the current sync active state.
   */
  public isSyncActive(): boolean {
    return this.isActive;
  }

  private setSyncState(active: boolean) {
    if (this.isActive !== active) {
      this.isActive = active;
      for (const listener of this.statusListeners) {
        try {
          listener(active);
        } catch {
          // Non-blocking
        }
      }
    }
  }

  private start() {
    if (typeof window === 'undefined') return;

    if (!this.isVisibilityBound) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.isVisibilityBound = true;
    }

    this.setSyncState(true);
    this.scheduleNext(this.baseDelayMs);
  }

  private stop() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.isVisibilityBound && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.isVisibilityBound = false;
    }

    this.setSyncState(false);
  }

  private handleVisibilityChange() {
    if (typeof document === 'undefined') return;

    if (document.visibilityState === 'visible') {
      // Tab became active: trigger immediate check and resume regular polling
      if (this.pollTimer) {
        clearTimeout(this.pollTimer);
        this.pollTimer = null;
      }
      this.executePoll();
    } else {
      // Tab hidden: pause timer to conserve client & server resources
      if (this.pollTimer) {
        clearTimeout(this.pollTimer);
        this.pollTimer = null;
      }
    }
  }

  private scheduleNext(delayMs: number) {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }

    // Only schedule if tab is visible and there are listeners
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }

    if (this.notificationListeners.size === 0) {
      return;
    }

    this.pollTimer = setTimeout(() => {
      this.executePoll();
    }, delayMs);
  }

  public async executePoll() {
    if (this.isPolling) return;
    if (typeof window === 'undefined') return;

    this.isPolling = true;

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      const url = `/api/admin/enquiries/poll?since=${encodeURIComponent(this.cursor)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal,
        cache: 'no-store',
      });

      if (res.status === 401 || res.status === 403) {
        // Session expired or logged out - stop polling
        console.warn('[Enquiry Poller]: Session unauthorized. Polling terminated.');
        this.stop();
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      this.setSyncState(true);
      this.currentDelayMs = this.baseDelayMs; // Reset backoff on success

      if (data.latestTimestamp && new Date(data.latestTimestamp).getTime() > new Date(this.cursor).getTime()) {
        this.cursor = data.latestTimestamp;
      }

      if (data.hasNew && Array.isArray(data.newEnquiries) && data.newEnquiries.length > 0) {
        // Deduplicate against seen IDs
        const unseenEnquiries: EnquiryNotificationPayload[] = [];
        for (const enq of data.newEnquiries) {
          if (!this.seenIds.has(enq.id)) {
            this.seenIds.add(enq.id);
            unseenEnquiries.push(enq);
          }
        }

        if (unseenEnquiries.length > 0) {
          const event: EnquiryEvent = {
            newEnquiries: unseenEnquiries,
            count: unseenEnquiries.length,
            latestTimestamp: data.latestTimestamp || new Date().toISOString(),
          };

          for (const listener of this.notificationListeners) {
            try {
              listener(event);
            } catch (err) {
              console.warn('[Enquiry Poller Listener Error]:', err);
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return; // Normal abort on unmount or tab switch
      }

      console.warn('[Enquiry Poller Notice]: Network poll retry scheduled.', (err as Error)?.message || err);
      // Exponential backoff up to max delay
      this.currentDelayMs = Math.min(this.currentDelayMs * 1.5, this.maxDelayMs);
    } finally {
      this.isPolling = false;
      this.abortController = null;
      this.scheduleNext(this.currentDelayMs);
    }
  }
}

// Global singleton poller instance for admin client context
export const enquiryPoller = new EnquiryNotificationPoller();
