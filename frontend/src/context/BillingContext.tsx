// BillingContext — fetches /billing/my-subscriptions + /auth/permissions once
// after auth, exposes per-industry unlock state, trial countdown helpers,
// and the action verbs (start-trial / upgrade / cancel / change). All UI gating
// across the app reads from this provider so the rules stay consistent.
//
// Decision: free trial = everything unlocked. Paid = everything unlocked.
// Locked tile is only shown when the industry has no subscription OR the trial
// has expired AND no paid plan exists.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BillingApi,
  IndustrySlug,
  PermissionsApi,
  PermissionsResponse,
  Subscription,
  isUnlockedStatus,
  statusKind,
} from "@/src/api/billing";
import { useAuth } from "@/src/context/AuthContext";

export type IndustryStatusKind = "trial" | "active" | "canceling" | "expired" | "none";

export interface IndustryStatus {
  industry: IndustrySlug;
  kind: IndustryStatusKind;
  unlocked: boolean;
  daysLeft?: number;
  endsAt?: string;
  tier?: string | null;
  cycle?: "monthly" | "annual" | null;
  sub?: Subscription;
}

export interface TrialBannerInfo {
  industry: IndustrySlug;
  daysLeft: number;
  ends_at?: string;
}

interface BillingContextValue {
  subscriptions: Subscription[];
  permissions: PermissionsResponse | null;
  ready: boolean;
  loading: boolean;
  error: string | null;
  // Helpers
  statusFor: (industry: IndustrySlug) => IndustryStatus;
  isUnlocked: (industry: IndustrySlug) => boolean;
  anyTrialActive: boolean;
  earliestExpiringTrial: TrialBannerInfo | null;
  // Mutators
  refresh: () => Promise<void>;
  startTrial: (industry: IndustrySlug) => Promise<Subscription | null>;
  cancel: (industry: IndustrySlug) => Promise<Subscription | null>;
  change: (industry: IndustrySlug, tier_slug: string) => Promise<Subscription | null>;
}

const INDUSTRIES: IndustrySlug[] = ["trades", "hospitality", "transport", "healthcare", "retail"];

const Ctx = createContext<BillingContextValue | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [permissions, setPermissions] = useState<PermissionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUserId = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [subsR, permsR] = await Promise.allSettled([
        BillingApi.mySubscriptions(),
        PermissionsApi.get(),
      ]);
      if (subsR.status === "fulfilled") setSubscriptions(subsR.value.subscriptions ?? []);
      if (permsR.status === "fulfilled") setPermissions(permsR.value);
      if (subsR.status === "rejected") {
        setError((subsR.reason as any)?.detail ?? "Could not load subscriptions.");
      }
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [user]);

  // Initial + auth-change fetch.
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setSubscriptions([]);
      setPermissions(null);
      setReady(false);
      lastUserId.current = null;
      return;
    }
    if (user.user_id !== lastUserId.current) {
      lastUserId.current = user.user_id ?? null;
      refresh();
    }
  }, [authReady, user, refresh]);

  // Per-industry status object.
  const statusFor = useCallback(
    (industry: IndustrySlug): IndustryStatus => {
      const sub = subscriptions.find((s) => s.industry === industry);
      const kind = statusKind(sub) as IndustryStatusKind;
      const unlockedOwn = isUnlockedStatus(sub);
      return {
        industry,
        kind,
        // Status reflects this industry's own sub state. The `unlocked`
        // flag is updated below with the global-trial override.
        unlocked: unlockedOwn,
        daysLeft: typeof sub?.trial_days_left === "number" ? sub.trial_days_left : undefined,
        endsAt: sub?.ends_at ?? sub?.trial_ends_at ?? sub?.current_period_end ?? undefined,
        tier: sub?.tier ?? null,
        cycle: sub?.cycle ?? null,
        sub,
      };
    },
    [subscriptions],
  );

  // Banner picks the soonest-expiring active trial.
  const earliestExpiringTrial: TrialBannerInfo | null = useMemo(() => {
    const trials = subscriptions.filter(
      (s) => (s.status ?? "").toLowerCase() === "trial" && !s.trial_expired,
    );
    if (trials.length === 0) return null;
    const sorted = [...trials].sort(
      (a, b) => (a.trial_days_left ?? 99) - (b.trial_days_left ?? 99),
    );
    const t = sorted[0];
    return {
      industry: t.industry as IndustrySlug,
      daysLeft: t.trial_days_left ?? 0,
      ends_at: t.trial_ends_at ?? undefined,
    };
  }, [subscriptions]);

  const anyTrialActive = !!earliestExpiringTrial;

  // GLOBAL UNLOCK RULE (per product spec): while ANY 14-day free trial is
  // active anywhere on the account, EVERY module on EVERY industry is
  // unlocked. Once all trials expire (and the user isn't on a paid plan for
  // that industry), per-industry gating kicks back in and unsubscribed
  // industries surface the "Upgrade to unlock" tile again.
  const isUnlocked = useCallback(
    (industry: IndustrySlug) => {
      if (anyTrialActive) return true;
      return statusFor(industry).unlocked;
    },
    [statusFor, anyTrialActive],
  );

  const upsertSub = useCallback((sub: Subscription) => {
    setSubscriptions((prev) => {
      const next = prev.filter((s) => s.industry !== sub.industry);
      next.push(sub);
      return next;
    });
  }, []);

  const startTrial = useCallback(
    async (industry: IndustrySlug): Promise<Subscription | null> => {
      try {
        const r = await BillingApi.startTrial(industry);
        if (r?.subscription) upsertSub(r.subscription);
        return r?.subscription ?? null;
      } catch (e) {
        // refetch on error in case the trial was already started elsewhere
        refresh();
        throw e;
      }
    },
    [upsertSub, refresh],
  );

  const cancel = useCallback(
    async (industry: IndustrySlug): Promise<Subscription | null> => {
      const r = await BillingApi.cancel(industry);
      if (r?.subscription) upsertSub(r.subscription);
      else await refresh();
      return r?.subscription ?? null;
    },
    [upsertSub, refresh],
  );

  const change = useCallback(
    async (industry: IndustrySlug, tier_slug: string): Promise<Subscription | null> => {
      const r = await BillingApi.change(industry, tier_slug);
      if (r?.subscription) upsertSub(r.subscription);
      else await refresh();
      return r?.subscription ?? null;
    },
    [upsertSub, refresh],
  );

  const value = useMemo<BillingContextValue>(
    () => ({
      subscriptions,
      permissions,
      ready,
      loading,
      error,
      statusFor,
      isUnlocked,
      anyTrialActive,
      earliestExpiringTrial,
      refresh,
      startTrial,
      cancel,
      change,
    }),
    [
      subscriptions,
      permissions,
      ready,
      loading,
      error,
      statusFor,
      isUnlocked,
      anyTrialActive,
      earliestExpiringTrial,
      refresh,
      startTrial,
      cancel,
      change,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBilling(): BillingContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBilling must be used inside <BillingProvider>");
  return ctx;
}

export const ALL_INDUSTRIES = INDUSTRIES;
