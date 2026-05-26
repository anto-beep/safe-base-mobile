// SafeBase API client — thin fetch wrapper that automatically attaches the
// stored JWT, surfaces a typed error, and points at the external SafeBase
// backend defined by EXPO_PUBLIC_SAFEBASE_API.

import { storage } from "@/src/utils/storage";

export const TOKEN_KEY = "safebase.jwt";
export const USER_KEY = "safebase.user";

const RAW_BASE =
  (process.env.EXPO_PUBLIC_SAFEBASE_API ?? "").replace(/\/+$/, "") ||
  "https://safe-systems.preview.emergentagent.com";

export const API_BASE = `${RAW_BASE}/api`;

export interface ApiError extends Error {
  status: number;
  detail?: string;
  payload?: any;
}

function makeError(status: number, payload: any, fallback: string): ApiError {
  // Surface human-friendly messages distinguishing the two failure modes the
  // mobile UI cares about:
  //   - 403: backend reachable but the authenticated account lacks the
  //          feature/industry — show "you don't have access".
  //   - 404 on an /api/* call usually means the SafeBase pod is down /
  //          suspended (the entire FastAPI app returns 404 when off), NOT a
  //          missing record. Distinguish so error cards don't say
  //          "Request failed (404)" when SafeBase is offline.
  let friendly: string | null = null;
  if (status === 403) {
    friendly = "You don't have access to this feature on this account.";
  } else if (status === 404) {
    // Heuristic: if the payload is empty / non-JSON the whole pod is offline.
    if (!payload || typeof payload === "string") {
      friendly = "SafeBase service is temporarily unavailable. Please try again in a moment.";
    }
  } else if (status === 401) {
    friendly = "Your session has expired. Please sign in again.";
  } else if (status >= 500) {
    friendly = "SafeBase encountered an error. Please retry shortly.";
  }

  const backendDetail =
    (payload && typeof payload === "object" && (payload.detail || payload.message)) || null;

  const detail =
    backendDetail ||
    friendly ||
    fallback;

  const message = typeof detail === "string" ? detail : fallback;
  const err = new Error(message) as ApiError;
  err.status = status;
  err.detail = message;
  err.payload = payload;
  return err;
}

export async function getToken(): Promise<string | null> {
  return await storage.secureGet<string>(TOKEN_KEY, "");
}

export async function setToken(token: string): Promise<void> {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
  await storage.removeItem(USER_KEY);
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOpts {
  method?: Method;
  body?: any;
  authOptional?: boolean;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>(
  path: string,
  opts: RequestOpts = {},
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = await getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (opts.headers) Object.assign(headers, opts.headers);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timeoutId);
    const err = new Error(
      e?.name === "AbortError"
        ? "Request timed out. Check your connection."
        : `Network error: ${e?.message ?? "Unable to reach SafeBase."}`,
    ) as ApiError;
    err.status = 0;
    err.detail = err.message;
    throw err;
  }
  clearTimeout(timeoutId);

  const ct = resp.headers.get("content-type") ?? "";
  const payload = ct.includes("application/json") ? await resp.json().catch(() => null) : await resp.text();

  if (!resp.ok) {
    throw makeError(resp.status, payload, `Request failed (${resp.status})`);
  }
  return payload as T;
}

export const api = {
  get: <T = any>(path: string, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T = any>(path: string, body?: any, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),
  patch: <T = any>(path: string, body?: any, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),
  del: <T = any>(path: string, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
};
