// Stage 3 — Investigation. Mirrors backend body in
// /tmp/safebase_ref/backend/incident_workflow.py:384. Fields: root_cause,
// contributing_factors[], investigator, completed, draft.
//
// Submitting with completed=true + draft=false advances to Actions.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Incident, Incidents } from "@/src/api/incidents";
import { ChipGroup } from "@/src/components/ChipGroup";
import { Card, Eyebrow, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { CONTRIBUTING_FACTORS } from "@/src/constants/incident";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

export default function InvestigationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const router = useRouter();
  const { user } = useAuth();
  const [doc, setDoc] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rootCause, setRootCause] = useState("");
  const [factors, setFactors] = useState<string[]>([]);
  const [investigator, setInvestigator] = useState(user?.name ?? user?.email ?? "");
  const [evidence, setEvidence] = useState("");

  useEffect(() => {
    if (!id) return;
    Incidents.get(id).then((d) => {
      setDoc(d);
      const v = d.investigation || {};
      setRootCause(v.root_cause ?? "");
      setFactors(v.contributing_factors ?? []);
      setInvestigator(v.investigator ?? user?.name ?? user?.email ?? "");
      setEvidence(v.evidence_summary ?? "");
    }).catch((e) => setError(e?.detail ?? "Could not load incident."))
      .finally(() => setLoading(false));
  }, [id]);

  const aiRoot = async () => {
    if (!doc?.submission?.description) { Alert.alert("No description", "Add a description on the report first."); return; }
    setAiBusy(true);
    try {
      const r = await Incidents.aiRootCause({
        description: doc.submission.description,
        category: doc.submission.category,
        contributing_factors: factors,
      });
      setRootCause(r.root_cause || rootCause);
    } catch (e: any) {
      Alert.alert("AI unavailable", e?.detail ?? "Try again later.");
    } finally {
      setAiBusy(false);
    }
  };

  const save = async (draft: boolean) => {
    setError(null);
    if (!draft && !rootCause.trim()) { setError("Root cause is required to complete the investigation."); return; }
    setSaving(draft ? "draft" : "submit");
    try {
      const body: any = {
        root_cause: rootCause.trim(),
        contributing_factors: factors,
        investigator: investigator.trim(),
        evidence_summary: evidence.trim(),
        completed: !draft,
        draft,
      };
      await Incidents.patchInvestigation(id!, body);
      Alert.alert(draft ? "Draft saved" : "Investigation complete", draft ? "You can continue later." : "Actions stage unlocked.", [
        { text: "OK", onPress: () => router.replace({ pathname: "/incident/[id]", params: { id: id! } }) },
      ]);
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Could not save.");
    } finally {
      setSaving(null);
    }
  };

  if (loading || !doc) return (
    <SafeAreaView style={styles.safe}><Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={accent} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="inv-back" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Eyebrow color={accent}>Stage 3 · {doc.reference}</Eyebrow>
          <Text style={styles.h1}>Investigation</Text>
          <Text style={styles.sub}>Identify the contributing factors and the root cause. Evidence should be preserved before this stage.</Text>
          <View style={{ height: 14 }} />

          <Card>
            {CONTRIBUTING_FACTORS.map((g) => (
              <ChipGroup
                key={g.cat}
                label={g.cat}
                accent={accent}
                values={factors}
                onChange={(v) => setFactors(v as string[])}
                options={g.items.map((it) => ({ value: it, label: it }))}
                testIDPrefix={`cf-${g.cat.toLowerCase()}`}
              />
            ))}
          </Card>

          <Card>
            <View style={styles.aiRow}>
              <TouchableOpacity testID="ai-root" onPress={aiRoot} disabled={aiBusy} style={[styles.aiBtn, { borderColor: accent }]}>
                {aiBusy ? <ActivityIndicator color={accent} size="small" /> : <Ionicons name="sparkles" size={16} color={accent} />}
                <Text style={[styles.aiBtnLabel, { color: accent }]}>Suggest root cause</Text>
              </TouchableOpacity>
            </View>
            <Input
              testID="root-cause"
              label="Root cause"
              value={rootCause}
              onChangeText={setRootCause}
              accent={accent}
              multiline
              style={{ minHeight: 110, textAlignVertical: "top" }}
              placeholder="Explain the underlying systemic cause (the 5-whys answer)."
            />
            <Input
              testID="evidence"
              label="Evidence summary"
              value={evidence}
              onChangeText={setEvidence}
              accent={accent}
              multiline
              style={{ minHeight: 80, textAlignVertical: "top" }}
              placeholder="Photos referenced, statements collected, equipment logs reviewed…"
            />
            <Input testID="investigator" label="Investigator" value={investigator} onChangeText={setInvestigator} accent={accent} />
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <SecondaryButton testID="inv-draft" label="Save draft" onPress={() => save(true)} iconName="save-outline" disabled={saving === "draft"} />
          <View style={{ height: 12 }} />
          <PrimaryButton testID="inv-submit" label="Complete investigation" onPress={() => save(false)} accent={accent} loading={saving === "submit"} iconName="arrow-forward" />
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 4 },
  h1: { color: TOKENS.ink, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
  aiRow: { flexDirection: "row", marginBottom: 8 },
  aiBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  aiBtnLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginLeft: 6, textTransform: "uppercase" },
  error: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
