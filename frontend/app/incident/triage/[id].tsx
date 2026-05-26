// Stage 2 — Triage. Mirrors backend body in
// /tmp/safebase_ref/backend/incident_workflow.py:313. Fields: severity (1-6),
// incident_type, resulted_in_death, serious_injury_items[], dangerous_occurrence_items[],
// notifiable_category, notes, signed_off_by, signed_off_at, draft.
//
// Saving with signed_off_by + draft=false advances stage to Investigation.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Incident, Incidents } from "@/src/api/incidents";
import { ChipGroup } from "@/src/components/ChipGroup";
import { Card, Eyebrow, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { DANGEROUS_OCCURRENCE_ITEMS, INCIDENT_TYPES, SERIOUS_INJURY_ITEMS, SEVERITIES } from "@/src/constants/incident";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

export default function TriageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const router = useRouter();
  const { user } = useAuth();
  const [doc, setDoc] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [severity, setSeverity] = useState<number | null>(null);
  const [incidentType, setIncidentType] = useState<string>("");
  const [resultedInDeath, setResultedInDeath] = useState(false);
  const [seriousItems, setSeriousItems] = useState<string[]>([]);
  const [dangerousItems, setDangerousItems] = useState<string[]>([]);
  const [notifiableCategory, setNotifiableCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [signedBy, setSignedBy] = useState(user?.name ?? user?.email ?? "");

  useEffect(() => {
    if (!id) return;
    Incidents.get(id).then((d) => {
      setDoc(d);
      const t = d.triage || {};
      setSeverity(t.severity ?? d.severity ?? null);
      setIncidentType(t.incident_type ?? d.incident_type ?? "");
      setResultedInDeath(!!t.resulted_in_death);
      setSeriousItems(t.serious_injury_items ?? []);
      setDangerousItems(t.dangerous_occurrence_items ?? []);
      setNotifiableCategory(t.notifiable_category ?? d.notifiable_category ?? "");
      setNotes(t.notes ?? "");
      setSignedBy(t.signed_off_by ?? user?.name ?? user?.email ?? "");
    }).catch((e) => setError(e?.detail ?? "Could not load incident."))
      .finally(() => setLoading(false));
  }, [id]);

  const notifiable = resultedInDeath || seriousItems.length > 0 || dangerousItems.length > 0;

  const save = async (draft: boolean) => {
    setError(null);
    if (!severity) { setError("Pick a severity."); return; }
    if (!draft && !signedBy.trim()) { setError("Sign off the triage to advance the workflow."); return; }
    setSaving(draft ? "draft" : "submit");
    try {
      const body: any = {
        severity,
        incident_type: incidentType || null,
        resulted_in_death: resultedInDeath,
        serious_injury_items: seriousItems,
        dangerous_occurrence_items: dangerousItems,
        notifiable_category: notifiableCategory || null,
        notes: notes.trim(),
        signed_off_by: draft ? null : signedBy.trim(),
        signed_off_at: draft ? null : new Date().toISOString(),
        draft,
      };
      await Incidents.patchTriage(id!, body);
      Alert.alert(draft ? "Draft saved" : "Triage complete", draft ? "You can continue triage later." : "Investigation stage unlocked.", [
        { text: "OK", onPress: () => router.replace({ pathname: "/incident/[id]", params: { id: id! } }) },
      ]);
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Could not save triage.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <Loading accent={accent} />;
  if (!doc) return <Loading accent={accent} />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="triage-back" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Eyebrow color={accent}>Stage 2 · {doc.reference}</Eyebrow>
          <Text style={styles.h1}>Triage</Text>
          <Text style={styles.sub}>Confirm severity, notifiability and assign for investigation. Notifiability matrix is per Australian WHS Act 2011 s.35–37.</Text>
          <View style={{ height: 14 }} />

          <Card>
            <ChipGroup
              label="Severity"
              accent={accent}
              values={severity ? [severity] : []}
              onChange={(v) => setSeverity((v[0] as number) ?? null)}
              options={SEVERITIES.map((s) => ({ value: s.v, label: `Sev ${s.v} · ${s.label}` }))}
              singleSelect
              testIDPrefix="sev"
              helper={severity ? SEVERITIES.find((s) => s.v === severity)?.help : undefined}
            />
            <ChipGroup
              label="Incident type"
              accent={accent}
              values={incidentType ? [incidentType] : []}
              onChange={(v) => setIncidentType((v[0] as string) ?? "")}
              options={INCIDENT_TYPES.map((t) => ({ value: t.key, label: t.label }))}
              singleSelect
              testIDPrefix="itype"
            />
          </Card>

          <Card>
            <Eyebrow color={accent}>Notifiability test</Eyebrow>
            <ChipGroup
              accent={accent}
              values={resultedInDeath ? ["yes"] : []}
              onChange={(v) => setResultedInDeath((v[0] as any) === "yes")}
              options={[{ value: "yes", label: "Resulted in death" }] as any}
              testIDPrefix="death"
            />
            <ChipGroup
              label="Serious injury — in-patient items"
              accent={accent}
              values={seriousItems}
              onChange={(v) => setSeriousItems(v as string[])}
              options={SERIOUS_INJURY_ITEMS.map((s) => ({ value: s, label: s }))}
              testIDPrefix="si"
            />
            <ChipGroup
              label="Dangerous occurrence"
              accent={accent}
              values={dangerousItems}
              onChange={(v) => setDangerousItems(v as string[])}
              options={DANGEROUS_OCCURRENCE_ITEMS.map((s) => ({ value: s, label: s }))}
              testIDPrefix="do"
            />
            <View style={[styles.banner, notifiable ? styles.bannerDanger : styles.bannerOk]}>
              <Ionicons name={notifiable ? "warning" : "checkmark-circle"} size={16} color={notifiable ? "#FFFFFF" : "#065F46"} />
              <Text style={[styles.bannerText, notifiable ? { color: "#FFFFFF" } : { color: "#065F46" }]}>
                {notifiable ? "This incident IS notifiable. Contact regulator within 24h." : "This incident is not notifiable based on selections."}
              </Text>
            </View>
            {notifiable ? (
              <Input
                testID="notif-cat"
                label="Notifiable category override (optional)"
                value={notifiableCategory}
                onChangeText={setNotifiableCategory}
                accent={accent}
                placeholder="e.g. death / serious_injury / dangerous_incident"
              />
            ) : null}
          </Card>

          <Card>
            <Input
              testID="triage-notes"
              label="Triage notes"
              value={notes}
              onChangeText={setNotes}
              accent={accent}
              multiline
              style={{ minHeight: 100, textAlignVertical: "top" }}
              placeholder="Immediate hazards controlled, evidence preserved, witnesses contacted…"
            />
            <Input testID="triage-sign" label="Signed off by" value={signedBy} onChangeText={setSignedBy} accent={accent} placeholder="Your name" />
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <SecondaryButton testID="triage-draft" label="Save draft" onPress={() => save(true)} iconName="save-outline" disabled={saving === "draft"} />
          <View style={{ height: 12 }} />
          <PrimaryButton testID="triage-submit" label="Sign off & advance" onPress={() => save(false)} accent={accent} loading={saving === "submit"} iconName="arrow-forward" />
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Loading({ accent }: { accent: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={accent} /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 4 },
  h1: { color: TOKENS.ink, fontSize: 24, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
  banner: { flexDirection: "row", alignItems: "center", padding: 10, marginTop: 10 },
  bannerDanger: { backgroundColor: TOKENS.destructive },
  bannerOk: { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0" },
  bannerText: { marginLeft: 8, fontSize: 12, fontWeight: "700", flex: 1 },
  error: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
