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
  const detail =
    (payload && typeof payload === "object" && (payload.detail || payload.message)) ||
    fallback;
  const err = new Error(typeof detail === "string" ? detail : fallback) as ApiError;
  err.status = status;
  err.detail = typeof detail === "string" ? detail : fallback;
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
