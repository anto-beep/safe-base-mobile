// LockedTile — used on Modules / Apps & Add-ons / Capture grids for features
// the user's plan does not include. Supports two visual variants:
//   • "upgrade" (default) — yellow "UPGRADE TO UNLOCK" pill, taps go to /billing.
//   • "trial" — authority-blue "START FREE TRIAL" pill, taps go to /billing.
//
// Mirrors the web "Upgrade to unlock" pattern.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, TOKENS } from "@/src/theme/colors";

export type LockedVariant = "upgrade" | "trial";

export function LockedTile({
  label,
  sub,
  icon = "lock-closed-outline",
  testID,
  href = "/billing",
  variant = "upgrade",
}: {
  label: string;
  sub?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  href?: string;
  variant?: LockedVariant;
}) {
  const router = useRouter();
  const isTrial = variant === "trial";
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={() => router.push(href as any)}
      style={styles.tile}
    >
      <View
        style={[
          styles.iconBox,
          isTrial ? { borderColor: TOKENS.authority, backgroundColor: `${TOKENS.authority}10` } : null,
        ]}
      >
        <Ionicons
          name={isTrial ? "gift-outline" : icon}
          size={20}
          color={isTrial ? TOKENS.authority : COLORS.textMuted}
        />
      </View>
      <Text style={styles.title}>{label}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      <View
        style={[
          styles.pill,
          isTrial
            ? { backgroundColor: `${TOKENS.authority}15`, borderColor: TOKENS.authority }
            : null,
        ]}
      >
        <Ionicons
          name={isTrial ? "rocket-outline" : "sparkles-outline"}
          size={11}
          color={isTrial ? TOKENS.authority : TOKENS.warnInk}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.pillText, isTrial ? { color: TOKENS.authority } : null]}>
          {isTrial ? "START FREE TRIAL" : "UPGRADE TO UNLOCK"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 10,
    opacity: 0.95,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: TOKENS.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "700" },
  sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: TOKENS.warnTint,
    borderWidth: 1,
    borderColor: TOKENS.warning,
  },
  pillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: TOKENS.warnInk,
  },
});
