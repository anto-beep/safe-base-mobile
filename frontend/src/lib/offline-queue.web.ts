// Web stub for the offline capture queue. On web there's no SQLite, so we
// just POST captures directly. NetInfo is also not available on web.
// Mirrors the native API shape from `./offline-queue.ts`.

import { apiRequest } from "@/src/api/client";

export interface EnqueueResult {
  ok: boolean;
  syncedOnline: boolean;
  client_event_id: string;
  detail?: string;
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function enqueueCapture(endpoint: string, body: any): Promise<EnqueueResult> {
  const client_event_id = uuid();
  try {
    await apiRequest(endpoint, {
      method: "POST",
      body: { ...body, client_event_id },
      headers: { "Idempotency-Key": client_event_id },
    });
    return { ok: true, syncedOnline: true, client_event_id };
  } catch (e: any) {
    return { ok: false, syncedOnline: false, client_event_id, detail: e?.detail ?? e?.message };
  }
}

export async function drainQueue() {
  return { synced: 0, failed: 0, pending: 0 };
}

export async function queueStats() {
  return { pending: 0, failed: 0, synced: 0 };
}

export function startBackgroundSync() {
  // no-op on web
}

export function stopBackgroundSync() {
  // no-op on web
}
