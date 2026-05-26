// Severity pill — mirrors the web's severityColor() helper.
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { severityColor } from "@/src/constants/incident";
import { MONO } from "@/src/components/ui";

export function SeverityBadge({ value }: { value?: number | null }) {
  const { bg, fg } = severityColor(value ?? null);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{value ? `SEV ${value}` : "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  text: { fontFamily: MONO, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
});
