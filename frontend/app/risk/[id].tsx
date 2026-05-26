// Risk detail — view + edit a single risk via /safety/risks/{id}.
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SafetyApi, SafetyItem } from "@/src/api/safebase";
import { LEVEL_COLOR, LEVEL_TINT, Level, RiskMatrix } from "@/src/components/RiskMatrix";
import { Card, EmptyState, Eyebrow, MONO, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

export default function RiskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const router = useRouter();
  const [doc, setDoc] = useState<SafetyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const all = await SafetyApi.list("risks");
      setDoc(all.find((r) => r.item_id === id) ?? null);
    } catch (e: any) { setError(e?.detail ?? "Could not load risk."); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const remove = () => {
    Alert.alert("Delete risk?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await SafetyApi.remove("risks", id!); router.replace("/risk"); } catch (e: any) { Alert.alert("Failed", e?.detail ?? ""); }
      } },
    ]);
  };

  if (loading) return <SafeAreaView style={styles.safe}><Stack.Screen options={{ headerShown: false }} /><ActivityIndicator color={accent} style={{ marginTop: 40 }} /></SafeAreaView>;
  if (error || !doc) return <SafeAreaView style={styles.safe}><Stack.Screen options={{ headerShown: false }} /><EmptyState icon="alert-circle-outline" title="Risk not found" body={error ?? "It may have been deleted."} /><View style={{ paddingHorizontal: 20 }}><SecondaryButton label="Back to register" onPress={() => router.replace("/risk")} /></View></SafeAreaView>;

  const il = doc.inherent_level as Level | undefined;
  const rl = doc.residual_level as Level | undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity testID="risk-detail-back" style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Risks</Text>
        </TouchableOpacity>
        <Eyebrow color={accent}>Risk register</Eyebrow>
        <Text style={styles.h1}>{doc.title || "Untitled risk"}</Text>
        <Text style={styles.sub}>{doc.hazard || doc.category || "—"}</Text>

        <View style={styles.levelsRow}>
          {il ? <View style={[styles.lvPill, { backgroundColor: LEVEL_TINT[il], borderColor: LEVEL_COLOR[il] }]}><Text style={[styles.lvText, { color: LEVEL_COLOR[il] }]}>INHERENT · {il.toUpperCase()} · {doc.inherent_score}</Text></View> : null}
          {rl ? <View style={[styles.lvPill, { backgroundColor: LEVEL_TINT[rl], borderColor: LEVEL_COLOR[rl] }]}><Text style={[styles.lvText, { color: LEVEL_COLOR[rl] }]}>RESIDUAL · {rl.toUpperCase()} · {doc.residual_score}</Text></View> : null}
        </View>

        <Card>
          <Eyebrow color={accent}>Inherent matrix</Eyebrow>
          <RiskMatrix testIdPrefix="detail-inh" likelihood={doc.likelihood || 0} consequence={doc.consequence || 0} compact />
        </Card>
        <Card>
          <Eyebrow color={accent}>Residual matrix</Eyebrow>
          <RiskMatrix testIdPrefix="detail-res" likelihood={doc.residual_likelihood || 0} consequence={doc.residual_consequence || 0} compact />
        </Card>

        <Card>
          <KV label="Category" value={doc.category} />
          <KV label="Activity" value={doc.activity} />
          <KV label="Process" value={doc.process} />
          <KV label="Consequence" value={doc.consequence_text} multiline />
          <KV label="Existing controls" value={(doc.existing_controls ?? []).join(", ")} multiline />
          <KV label="Proposed controls" value={(doc.proposed_controls ?? []).join(", ")} multiline />
          <KV label="Responsible person" value={doc.responsible_person} />
          <KV label="Due date" value={doc.due_date} />
          <KV label="Review frequency" value={doc.review_frequency} />
          <KV label="HRCW flags" value={(doc.hrcw_flags ?? []).join(", ")} />
          <KV label="Created" value={doc.created_at ? new Date(doc.created_at).toLocaleString("en-AU") : "—"} />
          <KV label="Updated" value={doc.updated_at ? new Date(doc.updated_at).toLocaleString("en-AU") : "—"} />
        </Card>

        <PrimaryButton testID="risk-delete" label="Delete risk" onPress={remove} accent={TOKENS.destructive} iconName="trash" />
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function KV({ label, value, multiline }: { label: string; value?: string; multiline?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue} numberOfLines={multiline ? undefined : 1}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 14, marginLeft: 4 },
  h1: { color: TOKENS.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  levelsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, marginBottom: 12 },
  lvPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8, marginBottom: 6 },
  lvText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, fontFamily: MONO },
  kv: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: TOKENS.border, flexDirection: "row", alignItems: "flex-start" },
  kvLabel: { color: COLORS.textMuted, fontSize: 12, width: 140, flexShrink: 0 },
  kvValue: { flex: 1, color: TOKENS.ink, fontSize: 13, fontWeight: "500" },
});
