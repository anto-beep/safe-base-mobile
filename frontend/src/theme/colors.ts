// SafeBase design tokens — sharp, dark, brutalist.
// All accents derive from user.industry.

export type Industry = "trades" | "hospitality" | "transport" | "healthcare" | "retail";

export const COLORS = {
  // Surfaces
  appBg: "#0A0A0A",
  surface: "#141414",
  surfaceElevated: "#1A1A1A",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",

  // Borders
  border: "#27272A",
  borderFocus: "#FFFFFF",

  // Status
  warning: "#FFCC00",
  error: "#EF4444",
  success: "#10B981",

  // Inputs / overlays
  inputBg: "#0A0A0A",
  overlay: "rgba(10,10,10,0.78)",
};

export const INDUSTRY_ACCENT: Record<Industry, string> = {
  trades: "#FFCC00",
  hospitality: "#F59E0B",
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

export function accentFor(industry?: string | null): string {
  if (industry && industry in INDUSTRY_ACCENT) {
    return INDUSTRY_ACCENT[industry as Industry];
  }
  return COLORS.warning;
}

export const FONT = {
  mono:
    // Use platform monospace fallback for the eyebrow labels.
    // System mono on iOS is "Menlo", Android is "monospace".
    undefined as undefined, // placeholder; we apply via Platform.select inline
};
