// Billing API wrappers — talks to the external SafeBase backend
// /api/billing/* + /api/auth/permissions.
//
// Endpoint shapes confirmed by probe (May 2026):
//   GET  /billing/plans?industry=trades        → { industry, trial_days, plans: Plan[] }
//   GET  /billing/my-subscriptions             → { subscriptions: Subscription[] }
//   POST /billing/start-trial      {industry}  → { ok, subscription: Subscription }
//   POST /billing/checkout-industry {industry, tier_slug?} → Stripe checkout URL
//   POST /billing/change           {industry, tier_slug}   → updated subscription
//   POST /billing/cancel           {industry}              → updated subscription
//   GET  /auth/permissions                    → { role, permissions, all_features }

import { api } from "@/src/api/client";

export type IndustrySlug = "trades" | "hospitality" | "transport" | "healthcare" | "retail";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "canceling"
  | "canceled"
  | "past_due"
  | "expired";

export interface Plan {
  slug: string;
  tier: string;       // sole_trader | small_business | growing_business | enterprise
  cycle: "monthly" | "annual";
  amount: number;     // cents (e.g. 799 = $7.99? or dollars? backend returns 799.0 for monthly, 7990.0 for annual → AUD dollars)
  currency: string;   // "aud"
  label: string;      // "Solo Tradie (monthly)"
  worker_cap: number;
}

export interface PlansResponse {
  industry: string;
  trial_days: number;
  plans: Plan[];
}

export interface Subscription {
  sub_id: string;
  user_id: string;
  email: string;
  industry: IndustrySlug | string;
  tier: string | null;
  cycle: "monthly" | "annual" | null;
  tier_slug: string | null;
  status: SubscriptionStatus | string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_end?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  trial_days_left?: number;
  trial_expired?: boolean;
  created_at?: string;
  updated_at?: string;
  canceled_at?: string | null;
  ends_at?: string | null;
}

export interface MySubscriptionsResponse {
  subscriptions: Subscription[];
}

export interface CheckoutResponse {
  url?: string;
  checkout_url?: string;
  session_id?: string;
  ok?: boolean;
  [k: string]: any;
}

export interface PermissionsResponse {
  role: string;
  permissions: Record<string, { read: boolean; write: boolean; delete: boolean }>;
  all_features: string[];
}

export const BillingApi = {
  plans: (industry: IndustrySlug | string) =>
    api.get<PlansResponse>(`/billing/plans?industry=${encodeURIComponent(industry)}`),
  mySubscriptions: () =>
    api.get<MySubscriptionsResponse>("/billing/my-subscriptions"),
  startTrial: (industry: IndustrySlug | string) =>
    api.post<{ ok: boolean; subscription: Subscription }>("/billing/start-trial", { industry }),
  checkoutIndustry: (industry: IndustrySlug | string, tier_slug?: string) =>
    api.post<CheckoutResponse>("/billing/checkout-industry", tier_slug ? { industry, tier_slug } : { industry }),
  change: (industry: IndustrySlug | string, tier_slug: string) =>
    api.post<{ ok: boolean; subscription: Subscription }>("/billing/change", { industry, tier_slug }),
  cancel: (industry: IndustrySlug | string) =>
    api.post<{ ok: boolean; subscription: Subscription }>("/billing/cancel", { industry }),
};

export const PermissionsApi = {
  get: () => api.get<PermissionsResponse>("/auth/permissions"),
};

// --- Helpers ---

export function isUnlockedStatus(sub: Subscription | undefined): boolean {
  if (!sub) return false;
  const s = (sub.status ?? "").toLowerCase();
  if (s === "active") return true;
  if (s === "trial") return !sub.trial_expired;
  if (s === "canceling") {
    // Grace period — unlocked until ends_at
    const endsAt = sub.ends_at ? new Date(sub.ends_at).getTime() : 0;
    return endsAt > Date.now();
  }
  return false;
}

export function statusKind(
  sub: Subscription | undefined,
): "trial" | "active" | "canceling" | "expired" | "none" {
  if (!sub) return "none";
  const s = (sub.status ?? "").toLowerCase();
  if (s === "active") return "active";
  if (s === "trial") return sub.trial_expired ? "expired" : "trial";
  if (s === "canceling") {
    const endsAt = sub.ends_at ? new Date(sub.ends_at).getTime() : 0;
    return endsAt > Date.now() ? "canceling" : "expired";
  }
  if (s === "canceled" || s === "expired") return "expired";
  return "none";
}

export function formatAud(amount: number): string {
  // Backend returns amounts in major units (e.g. 799 = $799.00 AUD per probe;
  // annual 7990 = $7990). Format with thousand separator.
  return `$${amount.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
