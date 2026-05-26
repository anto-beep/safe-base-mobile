// SafeBase design tokens — light, editorial, brand-matched to the web.
// Identity colours live on `tokens`; the dynamic per-screen `accent` is resolved
// at runtime by `activeAccent()` (or the `useAccent` hook).

import { useMemo } from "react";

import { useA11y } from "@/src/context/AccessibilityContext";
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import { useAuth } from "@/src/context/AuthContext";

export type Industry = "trades" | "hospitality" | "transport" | "healthcare" | "retail";

// ─── Identity tokens ────────────────────────────────────────────────
export const TOKENS = {
  ink: "#0A0A0A",
  background: "#FFFFFF",
  warning: "#FFCC00",
  authority: "#002FA7",
  muted: "#F5F5F4",
  border: "#E5E5E5",
  destructive: "#DC2626",
  success: "#059669",

  // Tints used for status rows
  warnTint: "#FEF3C7", // amber-50
  warnInk: "#92400E",
  dangerTint: "#FEE2E2", // red-50
  dangerInk: "#991B1B",
  successTint: "#ECFDF5", // emerald-50
  successInk: "#065F46",
};

// ─── Industry accents ───────────────────────────────────────────────
export const INDUSTRY_ACCENT: Record<Industry, string> = {
  trades: "#FFA630",
  hospitality: "#E11D48",
  transport: "#0DC4B5",
  healthcare: "#2196A6",
  retail: "#A855F7",
};

export const INDUSTRY_LABEL: Record<Industry, string> = {
  trades: "Trades & Construction",
  hospitality: "Hospitality",
  transport: "Transport & Logistics",
  healthcare: "Healthcare & Aged Care",
  retail: "Retail",
};

export const INDUSTRY_TAGLINE: Record<Industry, string> = {
  trades: "WorkSafe-ready every shift.",
  hospitality: "Food safety, council-pack ready.",
  transport: "Chain of Responsibility, live.",
  healthcare: "Aged Care & AHPRA, evidenced.",
  retail: "Lone-worker safe, every checkout.",
};

// ─── Active accent resolver ─────────────────────────────────────────
// Rule precedence:
//   1. Pre-login → authority blue
//   2. Internal admin signed in → warning yellow
//   3. Customer signed in → industry accent
//   4. High contrast → always warning yellow on ink
export function activeAccent(opts: {
  isAuthenticated: boolean;
  isInternalAdmin: boolean;
  industry?: string | null;
  highContrast?: boolean;
}): string {
  if (opts.highContrast) return TOKENS.warning;
  if (opts.isInternalAdmin) return TOKENS.warning;
  if (!opts.isAuthenticated) return TOKENS.authority;
  const i = opts.industry as Industry | undefined;
  return (i && INDUSTRY_ACCENT[i]) || TOKENS.authority;
}

// React hook — read everything from context.
export function useAccent(): string {
  const { user } = useAuth();
  const { admin } = useAdminAuth();
  const { prefs } = useA11y();
  return useMemo(
    () =>
      activeAccent({
        isAuthenticated: !!user,
        isInternalAdmin: !!admin,
        industry: user?.industry,
        highContrast: prefs.highContrast,
      }),
    [user, admin, prefs.highContrast],
  );
}

// Helper for places that don't have hooks (e.g. data files).
export function accentFor(industry?: string | null): string {
  if (industry && industry in INDUSTRY_ACCENT) {
    return INDUSTRY_ACCENT[industry as Industry];
  }
  return TOKENS.authority;
}

// Foreground text colour for any accent — light backgrounds need ink text,
// dark backgrounds (authority blue) need white text.
export function fgForAccent(accent: string): string {
  if (accent === TOKENS.authority) return TOKENS.background;
  if (accent === TOKENS.destructive) return TOKENS.background;
  return TOKENS.ink;
}

// ─── Back-compat shim ───────────────────────────────────────────────
// The rest of the codebase imports `COLORS.*` — keep those names but
// point them at the new light-theme palette so every screen re-themes
// without touching the call-sites.
export const COLORS = {
  appBg: TOKENS.background, // was #0A0A0A
  surface: TOKENS.background,
  surfaceElevated: TOKENS.muted,
  textPrimary: TOKENS.ink,
  textSecondary: "#525252",
  textMuted: "#737373",
  border: TOKENS.border,
  borderFocus: TOKENS.ink,
  warning: TOKENS.warning,
  error: TOKENS.destructive,
  success: TOKENS.success,
  inputBg: TOKENS.background,
  overlay: "rgba(10,10,10,0.45)",
};
