// Risk Register — mirrors web /tmp/safebase_ref/frontend/src/pages/Risks.jsx
// list page. Uses /safety/risks live endpoint; backend auto-computes
// inherent_score/inherent_level + residual_score/residual_level. Tap a row
// to view detail/edit; tap "Add risk" to open the matrix-driven creator.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SafetyApi, SafetyItem } from "@/src/api/safebase";
import { Card, EmptyState, Eyebrow, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { LEVEL_COLOR, LEVEL_TINT, Level } from "@/src/components/RiskMatrix";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const LEVELS: (Level | "all")[] = ["all", "low", "medium", "high", "extreme"];

export default function RiskRegisterScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<SafetyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await SafetyApi.list("risks");
      setRows(r);
    } catch (e: any) { setError(e?.detail ?? "Could not load risks."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const filtered = useMemo(() => rows.filter((r) => {
    if (level !== "all" && r.inherent_level !== level) return false;
    if (q && !`${r.title || ""} ${r.hazard || ""} ${r.category || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, q, level]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />}>
        <TouchableOpacity testID="risk-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Safety" title="Risk register" subtitle="5×5 matrix with computed inherent and residual scores." accent={accent} />
        <PrimaryButton testID="add-risk-btn" label="Add risk" onPress={() => router.push("/risk/new")} accent={accent} iconName="add" />
        <View style={{ height: 14 }} />

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput testID="risk-search" value={q} onChangeText={setQ} placeholder="Search title, hazard, category…" placeholderTextColor={COLORS.textMuted} style={styles.search} />
        </View>
        <View style={styles.filterRow}>
          {LEVELS.map((lv) => {
            const active = level === lv;
            const color = lv === "all" ? accent : LEVEL_COLOR[lv as Level];
            return (
              <TouchableOpacity key={lv} testID={`risk-filter-${lv}`} activeOpacity={0.85} onPress={() => setLevel(lv)} style={[styles.chip, { borderColor: active ? color : TOKENS.border, backgroundColor: active ? (lv === "all" ? `${color}1A` : LEVEL_TINT[lv as Level]) : "transparent" }]}>
                <Text style={[styles.chipLabel, { color: active ? TOKENS.ink : COLORS.textSecondary }]}>{lv.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? <ActivityIndicator color={accent} style={{ marginVertical: 30 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : filtered.length === 0 ? (
          <EmptyState icon="shield-checkmark-outline" title="No risks yet" body="Tap ‘Add risk’ to register a hazard with the 5×5 matrix." />
        ) : filtered.map((r) => (
          <TouchableOpacity key={r.item_id} testID={`risk-row-${r.item_id}`} activeOpacity={0.85} onPress={() => router.push({ pathname: "/risk/[id]", params: { id: r.item_id } })} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.title} numberOfLines={2}>{r.title || "Untitled"}</Text>
              <LevelPill prefix="INHERENT" level={r.inherent_level} score={r.inherent_score} />
            </View>
            <Text style={styles.meta} numberOfLines={1}>{r.hazard || r.category || "—"}</Text>
            <View style={styles.rowBottom}>
              <LevelPill prefix="RESIDUAL" level={r.residual_level} score={r.residual_score} />
              <Text style={styles.metaSm}>{r.responsible_person || r.risk_owner || "—"}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LevelPill({ level, score, prefix }: { level?: Level | string; score?: number; prefix?: string }) {
  if (!level) return <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>{prefix ? `${prefix} —` : "—"}</Text>;
  const lv = level as Level;
  return (
    <View style={[styles.lvPill, { backgroundColor: LEVEL_TINT[lv] ?? "#F5F5F4", borderColor: LEVEL_COLOR[lv] ?? TOKENS.border }]}>
      <Text style={[styles.lvPillText, { color: LEVEL_COLOR[lv] ?? COLORS.textPrimary }]}>{prefix ? `${prefix} · ` : ""}{lv.toUpperCase()} · {score ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  searchRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: TOKENS.border, paddingHorizontal: 12, marginBottom: 10 },
  search: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 14, color: COLORS.textPrimary },
  filterRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  chip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6, minHeight: 32, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, fontFamily: MONO },
  row: { borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  rowTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  metaSm: { color: COLORS.textMuted, fontSize: 11 },
  metaSmStrong: { color: TOKENS.ink, fontWeight: "700" },
  lvPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  lvPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, fontFamily: MONO },
  err: { color: TOKENS.destructive, fontSize: 14 },
});
