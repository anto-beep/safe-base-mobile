// Reports index — catalog from /api/reports. Tap a report → /reports/[type].
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReportMeta, ReportsApi } from "@/src/api/safebase";
import { Card, EmptyState, MONO, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  compliance_score: "shield-checkmark",
  incidents_trend: "warning",
  licence_expiry: "card",
  training_matrix: "grid",
  swms_register: "document-text",
  toolbox_talks_log: "megaphone",
  risk_register_export: "alert-circle",
  inspections_summary: "checkmark-done",
  plant_register: "build",
  worker_roster: "people",
};

export default function ReportsIndex() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<ReportMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setRows(await ReportsApi.list()); }
    catch (e: any) { setError(e?.detail ?? "Could not load reports."); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity testID="reports-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Insights" title="Reports" subtitle="Same 10 reports as the SafeBase web. Generated live from your data." accent={accent} />
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 30 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : rows.length === 0 ? (
          <EmptyState icon="document-text-outline" title="No reports available" body="Check back later." />
        ) : rows.map((r) => (
          <TouchableOpacity key={r.type} testID={`report-${r.type}`} activeOpacity={0.85} onPress={() => router.push({ pathname: "/reports/[type]", params: { type: r.type } })} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: `${accent}1A` }]}><Ionicons name={ICONS[r.type] ?? "document-text"} size={20} color={accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{r.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>{r.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginRight: 12 },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  desc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 },
  err: { color: TOKENS.destructive, fontSize: 14, fontFamily: MONO },
});
