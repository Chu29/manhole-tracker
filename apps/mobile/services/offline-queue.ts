/**
 * Offline write queue.
 *
 * When the device is offline, new manhole registrations and inspection logs are
 * appended to this queue instead of being sent immediately. When connectivity
 * returns (detected via NetInfo), `flushQueue()` replays them against the API
 * in order. Client-generated UUIDs on each item ensure idempotency — if the
 * device disconnects mid-flush and reconnects again, the server ignores
 * duplicate inserts (UUID primary keys + UNIQUE constraints).
 */

import NetInfo from "@react-native-community/netinfo";
import "react-native-get-random-values"; // polyfill for crypto.getRandomValues
import { v4 as uuidv4 } from "uuid";
import { getJSON, storeJSON, STORAGE_KEYS } from "../utils/storage";
import { createManhole, createInspection, updateManhole, uploadPhoto } from "../api/manholes";

export type QueuedOperation =
  | {
      id: string; // client-generated UUID used for idempotency
      type: "CREATE_MANHOLE";
      payload: Parameters<typeof createManhole>[0];
    }
  | {
      id: string;
      type: "CREATE_INSPECTION";
      manholeId: string;
      payload: Parameters<typeof createInspection>[1];
    }
  | {
      id: string;
      type: "UPDATE_MANHOLE";
      manholeId: string;
      payload: Parameters<typeof updateManhole>[1];
    };

export type QueuedOperationPayload =
  | {
      id?: string;
      type: "CREATE_MANHOLE";
      payload: Parameters<typeof createManhole>[0];
    }
  | {
      id?: string;
      type: "CREATE_INSPECTION";
      manholeId: string;
      payload: Parameters<typeof createInspection>[1];
    }
  | {
      id?: string;
      type: "UPDATE_MANHOLE";
      manholeId: string;
      payload: Parameters<typeof updateManhole>[1];
    };

type QueueListener = (flushedOps: QueuedOperation[]) => void;
const flushListeners: Set<QueueListener> = new Set();

export function subscribeQueueFlushed(listener: QueueListener): () => void {
  flushListeners.add(listener);
  return () => {
    flushListeners.delete(listener);
  };
}

function notifyFlushed(flushedOps: QueuedOperation[]) {
  flushListeners.forEach((listener) => {
    try {
      listener(flushedOps);
    } catch (err) {
      console.error("Queue listener error:", err);
    }
  });
}

async function readQueue(): Promise<QueuedOperation[]> {
  return (await getJSON<QueuedOperation[]>(STORAGE_KEYS.OFFLINE_QUEUE)) ?? [];
}

async function writeQueue(queue: QueuedOperation[]): Promise<void> {
  await storeJSON(STORAGE_KEYS.OFFLINE_QUEUE, queue);
}

export async function enqueue(op: QueuedOperationPayload): Promise<string> {
  const queue = await readQueue();
  const id = op.id || uuidv4();
  queue.push({ ...op, id } as QueuedOperation);
  await writeQueue(queue);
  return id;
}

export async function getPendingCount(): Promise<number> {
  return (await readQueue()).length;
}

let isFlushing = false;

/**
 * Attempt to flush all queued operations in order.
 * Uses an execution lock to prevent parallel flushes.
 * Stops on network failure and retains un-sent remainder.
 */
export async function flushQueue(
  onProgress?: (completed: number, total: number) => void,
): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
    let queue = await readQueue();
    if (queue.length === 0) return;

    const total = queue.length;
    const syncedOps: QueuedOperation[] = [];
    let completedCount = 0;

    while (queue.length > 0) {
      const op = queue[0];
      try {
        if (op.type === "CREATE_MANHOLE") {
          const payload = { ...op.payload };
          if (
            payload.photoUrl &&
            !payload.photoUrl.startsWith("http://") &&
            !payload.photoUrl.startsWith("https://")
          ) {
            const { photoUrl } = await uploadPhoto(payload.photoUrl);
            payload.photoUrl = photoUrl;
          }
          await createManhole({ ...payload, id: op.id });
        } else if (op.type === "CREATE_INSPECTION") {
          const payload = { ...op.payload };
          if (
            payload.photoUrl &&
            !payload.photoUrl.startsWith("http://") &&
            !payload.photoUrl.startsWith("https://")
          ) {
            const { photoUrl } = await uploadPhoto(payload.photoUrl);
            payload.photoUrl = photoUrl;
          }
          await createInspection(op.manholeId, { ...payload, id: op.id });
        } else if (op.type === "UPDATE_MANHOLE") {
          const payload = { ...op.payload };
          if (
            payload.photoUrl &&
            !payload.photoUrl.startsWith("http://") &&
            !payload.photoUrl.startsWith("https://")
          ) {
            const { photoUrl } = await uploadPhoto(payload.photoUrl);
            payload.photoUrl = photoUrl;
          }
          await updateManhole(op.manholeId, payload);
        }

        syncedOps.push(op);
        completedCount++;
        // Remove item from queue immediately upon success
        queue.shift();
        await writeQueue(queue);
        onProgress?.(completedCount, total);
      } catch (err: any) {
        const status = err.response?.status;
        // Non-retryable 4xx client errors (except 429 rate limit or 408 timeout)
        if (status && status >= 400 && status < 500 && status !== 429 && status !== 408) {
          console.error("Discarding unrecoverable queued operation (4xx error):", op, err);
          queue.shift();
          await writeQueue(queue);
          continue;
        }

        console.error("Network or server error during sync, halting flush cycle:", op, err);
        break;
      }
    }

    if (syncedOps.length > 0) {
      notifyFlushed(syncedOps);
    }
  } finally {
    isFlushing = false;
  }
}

/**
 * Register a NetInfo listener that auto-flushes the queue whenever connectivity
 * is restored. Call once in the root layout and store the returned unsubscribe fn.
 */
export function startQueueFlusher(
  onProgress?: (completed: number, total: number) => void,
): () => void {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flushQueue(onProgress).catch(console.error);
    }
  });
}
