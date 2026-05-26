// Phase 1F · Risk reviews — quick view of risks due for review.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { SafetyApi } from "@/src/api/safebase";
import { Card, EmptyState, Eyebrow, MONO, Pill, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function RiskReviewsScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await SafetyApi.list("risks" as any); setRows(Array.isArray(r) ? r : []); }
    catch (e: any) { setError(e?.detail ?? "Could not load risks."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  // Risks with review_date or due_date in the past or within 30 days
  const now = Date.now();
  const due = rows.filter((r: any) => {
    const d = r.review_date ?? r.due_date ?? r.next_review_at;
    if (!d) return false;
    const t = new Date(d).getTime();
    return !isNaN(t) && t - now <= 30 * 86400000;
  });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Risk" title="Risk reviews" subtitle={`${due.length} risk(s) due for review within 30 days.`} accent={accent} />
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          due.length === 0 ? <EmptyState icon="refresh-circle-outline" title="All caught up" body="No risks fall due for review in the next 30 days." /> :
          due.map((r: any) => {
            const d = r.review_date ?? r.due_date ?? r.next_review_at;
            const overdue = new Date(d).getTime() < now;
            return (
              <TouchableOpacity key={r.item_id ?? r.id} onPress={() => router.push(`/risk/${r.item_id ?? r.id}` as any)} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{r.hazard ?? r.title ?? "Risk"}</Text>
                  <Text style={[s.meta, { fontFamily: MONO }]}>{(r.activity ?? r.process ?? "").toString().toUpperCase()}</Text>
                  <Text style={s.sub}>Review by {new Date(d).toLocaleDateString("en-AU")}</Text>
                </View>
                <Pill label={overdue ? "OVERDUE" : "DUE"} color={overdue ? TOKENS.destructive : TOKENS.warnInk} />
              </TouchableOpacity>
            );
          })}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10 },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
