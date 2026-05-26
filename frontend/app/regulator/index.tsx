// Phase 1F · Regulator pipeline — pending cases + triage matrices.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { RegulatorApi, RegulatorCase } from "@/src/api/extras";
import { Card, EmptyState, Eyebrow, MONO, Pill, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function RegulatorPipelineScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [cases, setCases] = useState<RegulatorCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await RegulatorApi.pending(); setCases(r.cases ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load regulator pipeline."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const submitted = async (caseId: string) => {
    try { await RegulatorApi.markSubmitted(caseId); Alert.alert("Marked", "Case marked as submitted."); load(); }
    catch (e: any) { Alert.alert("Failed", e?.detail ?? "Could not mark submitted."); }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Compliance" title="Regulator cases" subtitle="WorkSafe / NHVR / ACQSC / NDIS / Food Authority pipeline." accent={accent} />
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          cases.length === 0 ? <EmptyState icon="scale-outline" title="No open cases" body="Regulator-bound items will appear here." /> :
          cases.map((c, i) => (
            <Card key={c.case_id ?? i} testID={`reg-${c.case_id ?? i}`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{c.regulator}{c.case_id ? ` · ${c.case_id}` : ""}</Text>
                  {c.summary ? <Text style={s.body}>{c.summary}</Text> : null}
                  <Text style={[s.meta, { fontFamily: MONO }]}>{c.due_at ? `Due ${new Date(c.due_at).toLocaleString("en-AU")}` : ""}{c.created_at ? ` · created ${new Date(c.created_at).toLocaleDateString("en-AU")}` : ""}</Text>
                </View>
                <Pill label={(c.status ?? "PENDING").toUpperCase()} color={c.status === "submitted" ? TOKENS.success : TOKENS.warnInk} />
              </View>
              {c.case_id && c.status !== "submitted" ? (
                <View style={{ marginTop: 10 }}>
                  <PrimaryButton testID={`reg-mark-${c.case_id}`} label="Mark submitted" onPress={() => submitted(c.case_id!)} accent={accent} iconName="checkmark" />
                </View>
              ) : null}
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
  body: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  meta: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
});
