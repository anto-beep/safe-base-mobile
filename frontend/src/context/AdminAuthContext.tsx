// Separate auth context for SafeBase internal admins. Lives behind its own
// JWT secret on the backend (ADMIN_JWT_SECRET) and its own storage key here.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

const ADMIN_TOKEN_KEY = "safebase.admin.jwt";
const ADMIN_USER_KEY = "safebase.admin.user";

export interface AdminUser {
  admin_id?: string;
  email?: string;
  name?: string;
  rank?: string;
  requires_2fa?: boolean;
  [k: string]: any;
}

interface AdminLoginResp {
  token?: string;
  admin?: AdminUser;
  requires_2fa?: boolean;
  challenge_token?: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  ready: boolean;
  loading: boolean;
  step: "idle" | "needs_2fa";
  challengeToken: string | null;
  login: (email: string, password: string) => Promise<{ requires_2fa: boolean }>;
  verify2fa: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AdminUser | null>;
}

const Ctx = createContext<AdminAuthState | undefined>(undefined);

async function adminRequest<T>(path: string, body?: any, method: "GET" | "POST" = "POST"): Promise<T> {
  const token = await storage.secureGet<string>(ADMIN_TOKEN_KEY, "");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return apiRequest<T>(path, { method, body, headers, authOptional: true });
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "needs_2fa">("idle");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const persist = useCallback(async (a: AdminUser | null) => {
    setAdmin(a);
    if (a) await storage.setItem(ADMIN_USER_KEY, JSON.stringify(a));
    else await storage.removeItem(ADMIN_USER_KEY);
  }, []);

  const refresh = useCallback(async (): Promise<AdminUser | null> => {
    try {
      const me = await adminRequest<AdminUser>("/internal-admin/me", undefined, "GET");
      await persist(me);
      return me;
    } catch (e: any) {
      if (e?.status === 401) {
        await storage.secureRemove(ADMIN_TOKEN_KEY);
        await persist(null);
      }
      return null;
    }
  }, [persist]);

  useEffect(() => {
    (async () => {
      const tok = await storage.secureGet<string>(ADMIN_TOKEN_KEY, "");
      if (tok) {
        const cached = await storage.getItem<string>(ADMIN_USER_KEY, "");
        if (cached) {
          try {
            setAdmin(JSON.parse(cached));
          } catch {
            // ignore
          }
        }
        await refresh();
      }
      setReady(true);
    })();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setStep("idle");
      setChallengeToken(null);
      try {
        const resp = await adminRequest<AdminLoginResp>("/internal-admin/login", { email, password });
        if (resp.requires_2fa) {
          setStep("needs_2fa");
          setChallengeToken(resp.challenge_token ?? null);
          return { requires_2fa: true };
        }
        if (resp.token) {
          await storage.secureSet(ADMIN_TOKEN_KEY, resp.token);
          await persist(resp.admin ?? null);
          if (!resp.admin) await refresh();
        }
        return { requires_2fa: false };
      } finally {
        setLoading(false);
      }
    },
    [persist, refresh],
  );

  const verify2fa = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        const resp = await adminRequest<AdminLoginResp>("/internal-admin/verify-2fa", {
          code,
          challenge_token: challengeToken,
        });
        if (resp.token) {
          await storage.secureSet(ADMIN_TOKEN_KEY, resp.token);
          await persist(resp.admin ?? null);
          if (!resp.admin) await refresh();
        }
        setStep("idle");
        setChallengeToken(null);
      } finally {
        setLoading(false);
      }
    },
    [challengeToken, persist, refresh],
  );

  const logout = useCallback(async () => {
    try {
      await adminRequest("/internal-admin/logout").catch(() => null);
    } finally {
      await storage.secureRemove(ADMIN_TOKEN_KEY);
      await persist(null);
      setStep("idle");
      setChallengeToken(null);
    }
  }, [persist]);

  const value = useMemo<AdminAuthState>(
    () => ({ admin, ready, loading, step, challengeToken, login, verify2fa, logout, refresh }),
    [admin, ready, loading, step, challengeToken, login, verify2fa, logout, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be inside AdminAuthProvider");
  return ctx;
}

// Helper for admin-area screens to make authenticated calls.
export async function adminApiGet<T = any>(path: string): Promise<T> {
  return adminRequest<T>(path, undefined, "GET");
}
export async function adminApiPost<T = any>(path: string, body?: any): Promise<T> {
  return adminRequest<T>(path, body, "POST");
}
