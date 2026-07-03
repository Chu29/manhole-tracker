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
import { createManhole, createInspection } from "../api/manholes";

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
    };

async function readQueue(): Promise<QueuedOperation[]> {
  return (await getJSON<QueuedOperation[]>(STORAGE_KEYS.OFFLINE_QUEUE)) ?? [];
}

async function writeQueue(queue: QueuedOperation[]): Promise<void> {
  await storeJSON(STORAGE_KEYS.OFFLINE_QUEUE, queue);
}

export async function enqueue(op: Omit<QueuedOperation, "id">): Promise<void> {
  const queue = await readQueue();
  queue.push({ ...op, id: uuidv4() } as QueuedOperation);
  await writeQueue(queue);
}

export async function getPendingCount(): Promise<number> {
  return (await readQueue()).length;
}

/**
 * Attempt to flush all queued operations in order.
 * Stops on the first network failure and retains the un-sent remainder.
 * Call this in the NetInfo `isConnected` listener in the root layout.
 */
export async function flushQueue(
  onProgress?: (completed: number, total: number) => void,
): Promise<void> {
  let queue = await readQueue();
  if (queue.length === 0) return;

  const total = queue.length;
  const remaining: QueuedOperation[] = [];

  for (let i = 0; i < queue.length; i++) {
    const op = queue[i];
    try {
      if (op.type === "CREATE_MANHOLE") {
        await createManhole(op.payload);
      } else if (op.type === "CREATE_INSPECTION") {
        await createInspection(op.manholeId, op.payload);
      }
      onProgress?.(i + 1, total);
    } catch {
      // Keep this item and everything after it — retry next flush cycle.
      remaining.push(...queue.slice(i));
      break;
    }
  }

  await writeQueue(remaining);
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
