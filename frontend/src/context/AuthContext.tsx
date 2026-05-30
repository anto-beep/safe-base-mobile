import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, clearToken, getToken, setToken, USER_KEY } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

export interface SafeBaseUser {
  user_id?: string;
  email?: string;
  name?: string;
  role?: string;
  // role_variant is the SafeBase UI-routing variant returned by the backend
  // (owner | safety_lead | supervisor | worker). Used for dashboard routing
  // and tab-gating. `role` itself is the workspace permission role (the
  // registering user is always workspace "owner"); role_variant captures
  // what kind of person they are within the workspace.
  role_variant?: "owner" | "safety_lead" | "supervisor" | "worker";
  role_title?: string;
  industry?: string;
  primary_industry?: string;
  industries?: string[];
  company_name?: string;
  onboarding_complete?: boolean;
  subscription_status?: string;
  [k: string]: any;
}

interface AuthState {
  user: SafeBaseUser | null;
  loading: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<SafeBaseUser>;
  register: (input: RegisterInput) => Promise<SafeBaseUser>;
  loginWithEmergentSession: (sessionId: string) => Promise<SafeBaseUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<SafeBaseUser | null>;
  setActiveIndustry: (industry: string) => Promise<void>;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  company_name?: string;
  industry?: string;
  role?: string;
  // SafeBase role-catalogue fields — see src/data/rolesByIndustry.ts.
  // The backend validates {role_id, role_label, role_variant,
  // permission_role} against the canonical web-app catalogue.
  role_id?: string;
  role_label?: string;
  role_variant?: "owner" | "safety_lead" | "supervisor" | "worker";
  permission_role?: "owner" | "worker";
  marketing_opt_in?: boolean;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeBaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const persistUser = useCallback(async (u: SafeBaseUser | null) => {
    setUser(u);
    if (u) {
      // Persist a serialisable snapshot for offline read.
      await storage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      await storage.removeItem(USER_KEY);
    }
  }, []);

  const refresh = useCallback(async (): Promise<SafeBaseUser | null> => {
    try {
      const me = await api.get<SafeBaseUser>("/auth/me");
      await persistUser(me);
      return me;
    } catch (e: any) {
      if (e?.status === 401) {
        await clearToken();
        await persistUser(null);
      }
      return null;
    }
  }, [persistUser]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        // Hydrate from cache while we refresh in the background.
        const cached = await storage.getItem<string>(USER_KEY, "");
        if (cached) {
          try {
            setUser(JSON.parse(cached));
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
      try {
        const resp = await api.post<{ token: string; user: SafeBaseUser }>(
          "/auth/login",
          { email, password },
        );
        await setToken(resp.token);
        await persistUser(resp.user);
        return resp.user;
      } finally {
        setLoading(false);
      }
    },
    [persistUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setLoading(true);
      try {
        const resp = await api.post<{ token: string; user: SafeBaseUser; user_id?: string }>(
          "/auth/register",
          input,
        );
        await setToken(resp.token);
        await persistUser(resp.user);
        return resp.user;
      } finally {
        setLoading(false);
      }
    },
    [persistUser],
  );

  const loginWithEmergentSession = useCallback(
    async (sessionId: string) => {
      setLoading(true);
      try {
        // The SafeBase backend exposes POST /api/auth/google-session.
        // We forward the Emergent-issued session_id; backend will exchange
        // it server-side and return its own customer JWT + user.
        const resp = await api.post<{ token: string; user: SafeBaseUser }>(
          "/auth/google-session",
          { session_id: sessionId, session_token: sessionId },
        );
        await setToken(resp.token);
        await persistUser(resp.user);
        return resp.user;
      } finally {
        setLoading(false);
      }
    },
    [persistUser],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout").catch(() => null);
    } finally {
      await clearToken();
      await persistUser(null);
    }
  }, [persistUser]);

  const setActiveIndustry = useCallback(
    async (industry: string) => {
      try {
        await api.patch("/auth/me/industry", { industry });
      } catch {
        // Non-fatal — still update locally so the UI reflects the choice.
      }
      if (user) {
        const updated = { ...user, industry };
        await persistUser(updated);
      }
    },
    [user, persistUser],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      ready,
      login,
      register,
      loginWithEmergentSession,
      logout,
      refresh,
      setActiveIndustry,
    }),
    [user, loading, ready, login, register, loginWithEmergentSession, logout, refresh, setActiveIndustry],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
