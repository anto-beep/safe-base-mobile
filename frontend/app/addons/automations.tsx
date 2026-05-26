// Phase 1I · Automations — if-this-then-that recipes.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { AutomationsApi, Automation } from "@/src/api/extras";
import { Card, EmptyState, Eyebrow, MONO, Pill, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function AutomationsScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<Automation[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const [r, a] = await Promise.all([AutomationsApi.list(), AutomationsApi.analytics().catch(() => null)]); setRows(Array.isArray(r) ? r : []); setAnalytics(a); }
    catch (e: any) { setError(e?.detail ?? "Could not load automations."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const test = async (id: string) => {
    setTesting(id);
    try { await AutomationsApi.test(id); Alert.alert("Test sent", "Automation test fired."); }
    catch (e: any) { Alert.alert("Test failed", e?.detail ?? ""); }
    finally { setTesting(null); }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Add-on" title="Automations" subtitle="If-this-then-that recipes. Build & edit on web; trigger tests from mobile." accent={accent} />
        {analytics ? <Card><Eyebrow color={accent}>Last 7 days</Eyebrow><Text style={s.body}>Runs: {analytics.runs ?? 0} · successful: {analytics.successful ?? 0} · failed: {analytics.failed ?? 0}</Text></Card> : null}
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          rows.length === 0 ? <EmptyState icon="git-network-outline" title="No automations" body="Create automations on the SafeBase web app." /> :
          rows.map((r) => (
            <Card key={r.automation_id} testID={`auto-${r.automation_id}`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{r.name}</Text>
                  <Text style={[s.meta, { fontFamily: MONO }]}>{r.trigger ?? "trigger"} → {r.action ?? "action"}{typeof r.runs === "number" ? ` · ${r.runs} runs` : ""}</Text>
                </View>
                <Pill label={r.enabled ? "ON" : "OFF"} color={r.enabled ? TOKENS.success : COLORS.textMuted} />
              </View>
              <TouchableOpacity testID={`auto-test-${r.automation_id}`} onPress={() => test(r.automation_id)} disabled={testing === r.automation_id} style={s.btn}>
                {testing === r.automation_id ? <ActivityIndicator size="small" color={accent} /> : <Text style={[s.btnText, { color: accent }]}>FIRE TEST</Text>}
              </TouchableOpacity>
            </Card>
          ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  body: { color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },
  btn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, alignSelf: "flex-start" },
  btnText: { fontWeight: "800", fontSize: 12, letterSpacing: 1.2 },
});
