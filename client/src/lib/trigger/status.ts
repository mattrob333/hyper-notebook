/**
 * Trigger.dev Workflow Status Streaming
 *
 * Client-side module for subscribing to workflow status updates.
 * Uses Server-Sent Events (SSE) for real-time status streaming.
 */

// Workflow status types
export type WorkflowStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowStatusUpdate {
  runId: string;
  taskId: string;
  status: WorkflowStatus;
  progress?: number;
  message?: string;
  output?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowStatusSubscription {
  unsubscribe: () => void;
}

// Status change callback type
export type StatusCallback = (update: WorkflowStatusUpdate) => void;

/**
 * Subscribe to workflow status updates via SSE
 */
export function subscribeToWorkflowStatus(
  runId: string,
  onStatus: StatusCallback,
  onError?: (error: Error) => void
): WorkflowStatusSubscription {
  const url = `/api/workflows/status/${runId}`;

  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const update: WorkflowStatusUpdate = JSON.parse(event.data);
      onStatus(update);

      // Auto-close on terminal states
      if (['completed', 'failed', 'cancelled'].includes(update.status)) {
        eventSource.close();
      }
    } catch (err) {
      console.error('Failed to parse workflow status:', err);
    }
  };

  eventSource.onerror = (event) => {
    console.error('Workflow status SSE error:', event);
    eventSource.close();
    onError?.(new Error('Connection to workflow status stream lost'));
  };

  return {
    unsubscribe: () => {
      eventSource.close();
    },
  };
}

/**
 * Poll workflow status (fallback for environments without SSE)
 */
export async function pollWorkflowStatus(
  runId: string,
  onStatus: StatusCallback,
  options: { interval?: number; maxAttempts?: number } = {}
): Promise<void> {
  const { interval = 2000, maxAttempts = 60 } = options;

  let attempts = 0;

  const poll = async (): Promise<void> => {
    attempts++;

    try {
      const response = await fetch(`/api/workflows/status/${runId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const update: WorkflowStatusUpdate = await response.json();
      onStatus(update);

      // Stop polling on terminal states
      if (['completed', 'failed', 'cancelled'].includes(update.status)) {
        return;
      }

      // Continue polling
      if (attempts < maxAttempts) {
        setTimeout(poll, interval);
      }
    } catch (err) {
      console.error('Failed to poll workflow status:', err);
      if (attempts < maxAttempts) {
        setTimeout(poll, interval);
      }
    }
  };

  await poll();
}

/**
 * React hook for workflow status (to be used with store)
 */
export function createWorkflowStatusManager() {
  const subscriptions = new Map<string, WorkflowStatusSubscription>();

  return {
    subscribe(runId: string, onStatus: StatusCallback): void {
      // Unsubscribe existing if any
      this.unsubscribe(runId);

      const subscription = subscribeToWorkflowStatus(runId, onStatus, (error) => {
        console.error(`Workflow ${runId} status error:`, error);
        // Optionally fall back to polling
      });

      subscriptions.set(runId, subscription);
    },

    unsubscribe(runId: string): void {
      const existing = subscriptions.get(runId);
      if (existing) {
        existing.unsubscribe();
        subscriptions.delete(runId);
      }
    },

    unsubscribeAll(): void {
      subscriptions.forEach((sub) => sub.unsubscribe());
      subscriptions.clear();
    },

    isSubscribed(runId: string): boolean {
      return subscriptions.has(runId);
    },
  };
}

// Export singleton manager instance
export const workflowStatusManager = createWorkflowStatusManager();
