// Offline-first capture queue.
// Each queued POST has a stable client_event_id (uuid). On sync we replay it
// against the original endpoint with header `Idempotency-Key: <client_event_id>`.
// The backend's idempotency story is still on the P1 backlog, so duplicates
// are possible on rare retry — that's acceptable for v1.

import NetInfo from "@react-native-community/netinfo";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import { apiRequest } from "@/src/api/client";

// On web, expo-sqlite needs WASM init that doesn't ship out-of-the-box.
// We fall back to "online-only" mode (no queue) — captures still POST normally.
const QUEUE_AVAILABLE = Platform.OS !== "web";

interface QueueRow {
  id: number;
  client_event_id: string;
  endpoint: string;
  body: string; // JSON-encoded
  status: "pending" | "synced" | "failed";
  attempts: number;
  last_error: string | null;
  created_at: string;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("safebase.db");
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS capture_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_event_id TEXT UNIQUE,
          endpoint TEXT NOT NULL,
          body TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          created_at TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

function uuid(): string {
  // Lightweight RFC4122 v4-ish generator (no crypto dep).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface EnqueueResult {
  ok: boolean;
  syncedOnline: boolean;
  client_event_id: string;
  detail?: string;
}

export async function enqueueCapture(endpoint: string, body: any): Promise<EnqueueResult> {
  // Web fast-path: no SQLite, just POST directly.
  if (!QUEUE_AVAILABLE) {
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

  const db = await getDb();
  const client_event_id = uuid();
  const finalBody = { ...body, client_event_id };
  const now = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO capture_queue (client_event_id, endpoint, body, status, attempts, created_at) VALUES (?, ?, ?, 'pending', 0, ?)",
    [client_event_id, endpoint, JSON.stringify(finalBody), now],
  );

  // Try syncing immediately if we have connectivity.
  const net = await NetInfo.fetch();
  if (net.isConnected && net.isInternetReachable !== false) {
    const ok = await syncOne(client_event_id);
    return { ok: true, syncedOnline: ok, client_event_id };
  }
  return { ok: true, syncedOnline: false, client_event_id };
}

async function syncOne(client_event_id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<QueueRow>(
    "SELECT * FROM capture_queue WHERE client_event_id = ? AND status = 'pending' LIMIT 1",
    [client_event_id],
  );
  if (!row) return false;
  try {
    await apiRequest(row.endpoint, {
      method: "POST",
      body: JSON.parse(row.body),
      headers: { "Idempotency-Key": row.client_event_id },
    });
    await db.runAsync("UPDATE capture_queue SET status = 'synced' WHERE client_event_id = ?", [client_event_id]);
    return true;
  } catch (e: any) {
    const attempts = (row.attempts ?? 0) + 1;
    // Permanent failures (4xx other than 408/429) are marked failed; transient → keep pending.
    const status = e?.status >= 400 && e?.status < 500 && e?.status !== 408 && e?.status !== 429 ? "failed" : "pending";
    await db.runAsync(
      "UPDATE capture_queue SET attempts = ?, last_error = ?, status = ? WHERE client_event_id = ?",
      [attempts, String(e?.detail ?? e?.message ?? "error"), status, client_event_id],
    );
    return false;
  }
}

export async function drainQueue(): Promise<{ synced: number; failed: number; pending: number }> {
  if (!QUEUE_AVAILABLE) return { synced: 0, failed: 0, pending: 0 };
  const db = await getDb();
  const pendingRows = await db.getAllAsync<QueueRow>(
    "SELECT * FROM capture_queue WHERE status = 'pending' ORDER BY id ASC",
  );
  let synced = 0;
  let failed = 0;
  for (const r of pendingRows) {
    const ok = await syncOne(r.client_event_id);
    if (ok) synced++;
    else failed++;
  }
  const stillPending = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM capture_queue WHERE status = 'pending'",
  );
  return { synced, failed, pending: stillPending?.c ?? 0 };
}

export async function queueStats(): Promise<{ pending: number; failed: number; synced: number }> {
  if (!QUEUE_AVAILABLE) return { pending: 0, failed: 0, synced: 0 };
  const db = await getDb();
  const rows = await db.getAllAsync<{ status: string; c: number }>(
    "SELECT status, COUNT(*) as c FROM capture_queue GROUP BY status",
  );
  const out = { pending: 0, failed: 0, synced: 0 } as any;
  for (const r of rows) out[r.status] = r.c;
  return out;
}

// Wire NetInfo: drain the queue every time we regain connectivity.
let unsubscribe: (() => void) | null = null;
export function startBackgroundSync() {
  if (!QUEUE_AVAILABLE) return;
  if (unsubscribe) return;
  unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      drainQueue().catch(() => null);
    }
  });
}

export function stopBackgroundSync() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
