// services/offline-queue.ts
import NetInfo from "@react-native-community/netinfo";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { getJSON, storeJSON, STORAGE_KEYS } from "../utils/storage";
import {
  createManhole,
  createInspection,
  updateManhole,
  uploadPhoto,
} from "../api/manholes";

export type QueuedOperation =
  | {
      id: string;
      type: "CREATE_MANHOLE";
      payload: Parameters<typeof createManhole>[0] & { id?: string };
    }
  | {
      id: string;
      type: "CREATE_INSPECTION";
      manholeId: string;
      payload: Parameters<typeof createInspection>[1] & { id?: string };
    }
  | {
      id: string;
      type: "UPDATE_MANHOLE";
      manholeId: string;
      payload: Parameters<typeof updateManhole>[1];
    };

export type QueuedOperationPayload =
  | {
      type: "CREATE_MANHOLE";
      payload: Parameters<typeof createManhole>[0];
    }
  | {
      type: "CREATE_INSPECTION";
      manholeId: string;
      payload: Parameters<typeof createInspection>[1];
    }
  | {
      type: "UPDATE_MANHOLE";
      manholeId: string;
      payload: Parameters<typeof updateManhole>[1];
    };

let isFlushing = false;
type QueueChangeListener = (pendingCount: number) => void;
const queueListeners = new Set<QueueChangeListener>();

export function subscribeQueueChange(
  listener: QueueChangeListener,
): () => void {
  queueListeners.add(listener);
  return () => queueListeners.delete(listener);
}

function notifyQueueChange(count: number) {
  queueListeners.forEach((listener) => listener(count));
}

async function readQueue(): Promise<QueuedOperation[]> {
  return (await getJSON<QueuedOperation[]>(STORAGE_KEYS.OFFLINE_QUEUE)) ?? [];
}

async function writeQueue(queue: QueuedOperation[]): Promise<void> {
  await storeJSON(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  notifyQueueChange(queue.length);
}

export async function enqueue(op: QueuedOperationPayload): Promise<void> {
  const queue = await readQueue();
  queue.push({ ...op, id: uuidv4() } as QueuedOperation);
  await writeQueue(queue);
}

export async function getPendingCount(): Promise<number> {
  return (await readQueue()).length;
}

async function removeOperationFromQueue(id: string): Promise<void> {
  const queue = await readQueue();
  const updatedQueue = queue.filter((op) => op.id !== id);
  await writeQueue(updatedQueue);
}

export async function flushQueue(
  onProgress?: (completed: number, total: number) => void,
): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
    const queue = await readQueue();
    if (queue.length === 0) return;

    const total = queue.length;

    for (let i = 0; i < queue.length; i++) {
      const op = queue[i];

      try {
        if (op.type === "CREATE_MANHOLE") {
          const payload = { ...op.payload, id: op.id };
          if (
            payload.photoUrl &&
            (payload.photoUrl.startsWith("file://") ||
              payload.photoUrl.startsWith("content://") ||
              payload.photoUrl.startsWith("ph://"))
          ) {
            const { photoUrl } = await uploadPhoto(payload.photoUrl);
            payload.photoUrl = photoUrl;
          }
          await createManhole(payload);
        } else if (op.type === "CREATE_INSPECTION") {
          const payload = { ...op.payload, id: op.id };
          if (
            payload.photoUrl &&
            (payload.photoUrl.startsWith("file://") ||
              payload.photoUrl.startsWith("content://") ||
              payload.photoUrl.startsWith("ph://"))
          ) {
            const { photoUrl } = await uploadPhoto(payload.photoUrl);
            payload.photoUrl = photoUrl;
          }
          await createInspection(op.manholeId, payload);
        } else if (op.type === "UPDATE_MANHOLE") {
          const payload = { ...op.payload };
          if (
            payload.photoUrl &&
            (payload.photoUrl.startsWith("file://") ||
              payload.photoUrl.startsWith("content://") ||
              payload.photoUrl.startsWith("ph://"))
          ) {
            const { photoUrl } = await uploadPhoto(payload.photoUrl);
            payload.photoUrl = photoUrl;
          }
          await updateManhole(op.manholeId, payload);
        }

        await removeOperationFromQueue(op.id);
        onProgress?.(i + 1, total);
      } catch (err: any) {
        console.error("Failed to sync operation:", op, err);
        const status = err?.response?.status;
        if (
          status &&
          status >= 400 &&
          status < 500 &&
          status !== 429 &&
          status !== 408
        ) {
          await removeOperationFromQueue(op.id);
          continue;
        }
        break;
      }
    }
  } finally {
    isFlushing = false;
  }
}

export function startQueueFlusher(
  onProgress?: (completed: number, total: number) => void,
): () => void {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flushQueue(onProgress).catch(console.error);
    }
  });
}
