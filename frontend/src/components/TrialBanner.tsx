// TrialBanner — slim sticky bar shown when at least one industry is mid-trial.
// Tappable → navigates to /billing for upgrade / management.
// Mounted globally in app/_layout.tsx so it follows the user across screens.

import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { useBilling } from "@/src/context/BillingContext";
import { COLORS, INDUSTRY_LABEL, TOKENS } from "@/src/theme/colors";

// Don't show the banner on pre-auth screens and inside the billing screen itself
// (would be redundant).
const HIDE_PREFIXES = ["/login", "/register", "/forgot-password", "/admin-login", "/billing"];

export function TrialBanner() {
  const { user } = useAuth();
  const { earliestExpiringTrial, ready } = useBilling();
  const router = useRouter();
  const pathname = usePathname();

  if (!user || !ready || !earliestExpiringTrial) return null;
  if (HIDE_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  const { industry, daysLeft } = earliestExpiringTrial;
  const urgent = daysLeft <= 3;
  const tone = urgent ? TOKENS.destructive : TOKENS.authority;

  const dayLabel = daysLeft === 1 ? "1 day" : `${daysLeft} days`;
  const indLabel = INDUSTRY_LABEL[industry as keyof typeof INDUSTRY_LABEL] ?? industry;

  return (
    <View style={[styles.wrap, Platform.OS === "web" ? styles.wrapWeb : null]} testID="trial-banner">
      <TouchableOpacity
        testID="trial-banner-cta"
        activeOpacity={0.85}
        onPress={() => router.push("/billing" as any)}
        style={[styles.row, { backgroundColor: tone }]}
      >
        <Ionicons name={urgent ? "alert-circle" : "gift-outline"} size={16} color="#fff" />
        <Text style={styles.text} numberOfLines={1}>
          {dayLabel} left in your {indLabel} free trial · Tap to upgrade
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  wrapWeb: {
    // @ts-ignore — web-only
    pointerEvents: "box-none",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    paddingTop: Platform.OS === "ios" ? 38 : 26,
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginHorizontal: 8,
    flexShrink: 1,
  },
});
