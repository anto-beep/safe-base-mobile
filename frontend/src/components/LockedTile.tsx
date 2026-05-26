// LockedTile — used on Modules / Apps & Add-ons grids for features the user's
// plan does not include. Mirrors the web "Upgrade to unlock" pattern. Tapping
// it opens the AddOns marketplace screen instead of the locked target.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, TOKENS } from "@/src/theme/colors";

export function LockedTile({
  label,
  sub,
  icon = "lock-closed-outline",
  testID,
  href = "/module/addons",
}: {
  label: string;
  sub?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  href?: string;
}) {
  const router = useRouter();
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={() => router.push(href as any)}
      style={styles.tile}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color={COLORS.textMuted} />
      </View>
      <Text style={styles.title}>{label}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      <View style={styles.pill}>
        <Ionicons name="sparkles-outline" size={11} color={TOKENS.warnInk} style={{ marginRight: 4 }} />
        <Text style={styles.pillText}>UPGRADE TO UNLOCK</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 10,
    opacity: 0.85,
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
