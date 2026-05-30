// TrialBanner — slim sticky bar shown when at least one industry is mid-trial.
// Takes real layout space (NOT absolute) so it can never overlap a screen's
// back button or content. Background color is the trial industry's brand
// accent (per user request — no universal colour).
//
// Tapping the banner deep-links to /billing?industry={trialIndustry} so the
// billing screen renders only THAT industry's plans (per user request).

import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useBilling } from "@/src/context/BillingContext";
import { COLORS, INDUSTRY_ACCENT, INDUSTRY_LABEL, TOKENS } from "@/src/theme/colors";

// Pre-auth screens & billing don't need the banner.
const HIDE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/admin-login",
  "/billing",
];

export function TrialBanner() {
  const { user } = useAuth();
  const { earliestExpiringTrial, ready } = useBilling();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (!user || !ready || !earliestExpiringTrial) return null;
  if (HIDE_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  const { industry, daysLeft } = earliestExpiringTrial;
  const urgent = daysLeft <= 3;
  // Industry brand colour for the banner background. When the trial is
  // about to expire (≤3 days) we override with destructive red so the
  // urgency reads regardless of brand colour.
  const indAccent = INDUSTRY_ACCENT[industry as keyof typeof INDUSTRY_ACCENT];
  const tone = urgent ? TOKENS.destructive : indAccent;
  const fg = pickReadableForeground(tone);

  const dayLabel = daysLeft === 1 ? "1 day" : `${daysLeft} days`;
  const indLabel = INDUSTRY_LABEL[industry as keyof typeof INDUSTRY_LABEL] ?? industry;

  // Top padding: combine OS status-bar inset with a small visual breathing
  // room. We use SafeAreaInsets so the banner sits below the notch / island,
  // and the SafeAreaView inside each screen still places the back button
  // immediately below the banner (no overlap).
  const topPad = Math.max(insets.top, Platform.OS === "android" ? 8 : 0);

  return (
    <View style={[styles.wrap, { backgroundColor: tone, paddingTop: topPad }]} testID="trial-banner">
      <TouchableOpacity
        testID="trial-banner-cta"
        activeOpacity={0.85}
        onPress={() => router.push((`/billing?industry=${industry}`) as any)}
        style={styles.row}
        accessibilityLabel={`${dayLabel} left in your ${indLabel} free trial`}
        accessibilityRole="button"
      >
        <Ionicons name={urgent ? "alert-circle" : "gift-outline"} size={16} color={fg} />
        <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
          {dayLabel} left in your {indLabel} free trial · Tap to upgrade
        </Text>
        <Ionicons name="chevron-forward" size={14} color={fg} />
      </TouchableOpacity>
    </View>
  );
}

// Pick black/white text for a coloured background using a simple luminance
// check. SafeBase trades amber is light, so dark text reads better; authority
// blue & destructive red are dark, white reads better.
function pickReadableForeground(bgHex: string): string {
  try {
    const hex = bgHex.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? "#0B0E12" : "#FFFFFF";
  } catch {
    return "#FFFFFF";
  }
}

const styles = StyleSheet.create({
  // No absolute positioning — banner takes its natural height in the layout
  // tree so it can never overlap screen chrome (back button, etc.).
  wrap: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginHorizontal: 8,
    flexShrink: 1,
  },
});
