// 6-step Incident Submission wizard — mirrors
// /tmp/safebase_ref/frontend/src/pages/incident/SubmitIncident.jsx.
// Posts to /api/incident-workflow with shape { title, incident_type, submission }.
// Field set kept in 1:1 parity with the web (involved_type, description, body_parts,
// injury_natures, treatments, ambulance/hospital, site/state/date/time, witnesses).
// Photos use expo-image-picker and are appended as base64 data URIs.

import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Incidents, IncidentSubmission, Workers, WorkerSummary } from "@/src/api/incidents";
import { ChipGroup } from "@/src/components/ChipGroup";
import { PhotoPicker } from "@/src/components/PhotoPicker";
import { Card, EmptyState, Eyebrow, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import {
  AU_STATES,
  BODY_AREAS,
  INCIDENT_CATEGORIES,
  INJURY_NATURES,
  INVOLVED_TYPES,
  TREATMENT_OPTIONS,
} from "@/src/constants/incident";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

const LOCATION_TYPES = [
  { value: "on_site", label: "On site" },
  { value: "off_site", label: "Off site" },
  { value: "home", label: "Home / remote" },
] as const;

export default function NewIncident() {
  const accent = useAccent();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [workers, setWorkers] = useState<WorkerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [sub, setSub] = useState<IncidentSubmission>({
    involved_type: "",
    involved_people: [],
    description: "",
    category: "",
    was_hurt: "",
    body_parts: [],
    injury_natures: [],
    treatment_given: "",
    treatments: [],
    ambulance: "",
    hospital: "",
    hospital_name: "",
    work_stopped: "",
    first_aider: "",
    treatment_notes: "",
    site: "",
    site_location: "",
    location_type: "on_site",
    state: "NSW",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    commuting: "no",
    witnessed: "",
    witnesses: [],
    other_info: "",
    photos: [],
  });

  useEffect(() => {
    Workers.list().then(setWorkers).catch(() => setWorkers([]));
  }, []);

  useEffect(() => {
    if (sub.involved_type === "me" && (sub.involved_people?.length ?? 0) === 0 && user) {
      setSub((s) => ({ ...s, involved_people: [{ name: user.name ?? user.email ?? "", role: user.role ?? "", source: "self" }] }));
    }
  }, [sub.involved_type, user]);

  const patch = <K extends keyof IncidentSubmission>(k: K, v: IncidentSubmission[K]) =>
    setSub((s) => ({ ...s, [k]: v }));

  const aiCategorise = async () => {
    if (!sub.description?.trim()) {
      Alert.alert("Add a description", "Describe what happened first so we can suggest a category.");
      return;
    }
    setAiBusy(true);
    try {
      const r = await Incidents.aiCategorise(sub.description.trim());
      patch("category", r.category || "");
    } catch (e: any) {
      Alert.alert("AI unavailable", e?.detail ?? "Couldn't reach the categoriser.");
    } finally {
      setAiBusy(false);
    }
  };

  const back = () => setStep((s) => Math.max(1, s - 1));
  const next = () => setStep((s) => Math.min(6, s + 1));

  const submit = async () => {
    setError(null);
    if (!sub.description?.trim()) {
      setError("A description is required.");
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const r = await Incidents.create({
        title: (sub.description || "").slice(0, 80) || "Incident",
        incident_type: sub.category || null,
        submission: sub,
      });
      Alert.alert(
        "Reported",
        `Reference ${r.reference}. The 24-hour triage clock has started.`,
        [{ text: "OK", onPress: () => router.replace({ pathname: "/incident/[id]", params: { id: r.incident_id } }) }],
      );
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="submit-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>

          <Eyebrow color={accent}>Report incident · Step {step} of 6</Eyebrow>
          <Text style={styles.h1}>Tell us what happened</Text>

          <View style={styles.progress}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <View key={n} style={[styles.progressDot, { backgroundColor: step >= n ? accent : TOKENS.border }]} />
            ))}
          </View>

          {step === 1 && (
            <Card>
              <Eyebrow color={accent}>Who was involved?</Eyebrow>
              {INVOLVED_TYPES.map((t) => {
                const active = sub.involved_type === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    testID={`involved-${t.key}`}
                    activeOpacity={0.85}
                    onPress={() => patch("involved_type", t.key as any)}
                    style={[styles.bigOption, { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : "transparent" }]}
                  >
                    <Ionicons name={t.icon as any} size={22} color={active ? accent : COLORS.textSecondary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.bigLabel}>{t.label}</Text>
                      <Text style={styles.bigDesc}>{t.desc}</Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={accent} /> : null}
                  </TouchableOpacity>
                );
              })}
              {sub.involved_type === "other" && workers.length > 0 ? (
                <View style={{ marginTop: 10 }}>
                  <Eyebrow color={COLORS.textSecondary}>Pick from your workers</Eyebrow>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {workers.map((w) => {
                      const selected = sub.involved_people?.some((p) => p.name === w.name);
                      return (
                        <TouchableOpacity
                          key={w.worker_id}
                          activeOpacity={0.85}
                          onPress={() => {
                            const next = selected
                              ? (sub.involved_people || []).filter((p) => p.name !== w.name)
                              : [...(sub.involved_people || []), { name: w.name, role: w.trade ?? "worker", source: "workers" }];
                            patch("involved_people", next);
                          }}
                          style={[styles.workerChip, { borderColor: selected ? accent : TOKENS.border, backgroundColor: selected ? `${accent}1A` : "transparent" }]}
                        >
                          <Text style={styles.workerChipLabel}>{w.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </Card>
          )}

          {step === 2 && (
            <Card>
              <Input
                testID="description"
                label="What happened?"
                value={sub.description ?? ""}
                onChangeText={(v) => patch("description", v)}
                accent={accent}
                multiline
                style={{ minHeight: 120, textAlignVertical: "top" }}
                placeholder="Describe the incident: who, what, when, where, and what was done immediately."
              />
              <View style={styles.aiRow}>
                <TouchableOpacity testID="ai-categorise" onPress={aiCategorise} disabled={aiBusy} style={[styles.aiBtn, { borderColor: accent }]}>
                  {aiBusy ? <ActivityIndicator color={accent} size="small" /> : <Ionicons name="sparkles" size={16} color={accent} />}
                  <Text style={[styles.aiBtnLabel, { color: accent }]}>Suggest category with AI</Text>
                </TouchableOpacity>
              </View>
              <ChipGroup
                label="Category"
                accent={accent}
                values={sub.category ? [sub.category] : []}
                onChange={(v) => patch("category", v[0] ?? "")}
                options={INCIDENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                singleSelect
                testIDPrefix="category"
              />
              <PhotoPicker accent={accent} label="Photos" values={sub.photos ?? []} onChange={(v) => patch("photos", v)} maxPhotos={8} />
            </Card>
          )}

          {step === 3 && (
            <Card>
              <ChipGroup
                label="Was anyone hurt?"
                accent={accent}
                values={sub.was_hurt ? [sub.was_hurt] : []}
                onChange={(v) => patch("was_hurt", (v[0] as any) ?? "")}
                options={YES_NO as any}
                singleSelect
                testIDPrefix="hurt"
              />
              {sub.was_hurt === "yes" ? (
                <>
                  <ChipGroup
                    label="Body parts affected"
                    accent={accent}
                    values={sub.body_parts ?? []}
                    onChange={(v) => patch("body_parts", v as string[])}
                    options={BODY_AREAS.map((a) => ({ value: a[0] as string, label: a[1] as string }))}
                    testIDPrefix="body"
                    helper="Tap all that apply"
                  />
                  <ChipGroup
                    label="Nature of injury"
                    accent={accent}
                    values={sub.injury_natures ?? []}
                    onChange={(v) => patch("injury_natures", v as string[])}
                    options={INJURY_NATURES.map((n) => ({ value: n, label: n }))}
                    testIDPrefix="nature"
                  />
                </>
              ) : null}
            </Card>
          )}

          {step === 4 && (
            <Card>
              <ChipGroup
                label="Was treatment given?"
                accent={accent}
                values={sub.treatment_given ? [sub.treatment_given] : []}
                onChange={(v) => patch("treatment_given", (v[0] as any) ?? "")}
                options={YES_NO as any}
                singleSelect
                testIDPrefix="treatment-given"
              />
              {sub.treatment_given === "yes" ? (
                <>
                  <ChipGroup
                    label="Treatment provided"
                    accent={accent}
                    values={sub.treatments ?? []}
                    onChange={(v) => patch("treatments", v as string[])}
                    options={TREATMENT_OPTIONS.map((t) => ({ value: t, label: t }))}
                    testIDPrefix="treatment"
                  />
                  <Input testID="first-aider" label="First aider name" value={sub.first_aider ?? ""} onChangeText={(v) => patch("first_aider", v)} accent={accent} />
                  <Input testID="treatment-notes" label="Treatment notes" value={sub.treatment_notes ?? ""} onChangeText={(v) => patch("treatment_notes", v)} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
                </>
              ) : null}
              <ChipGroup
                label="Ambulance called?"
                accent={accent}
                values={sub.ambulance ? [sub.ambulance] : []}
                onChange={(v) => patch("ambulance", (v[0] as any) ?? "")}
                options={YES_NO as any}
                singleSelect
                testIDPrefix="ambulance"
              />
              <ChipGroup
                label="Hospital attended?"
                accent={accent}
                values={sub.hospital ? [sub.hospital] : []}
                onChange={(v) => patch("hospital", (v[0] as any) ?? "")}
                options={YES_NO as any}
                singleSelect
                testIDPrefix="hospital"
              />
              {sub.hospital === "yes" ? (
                <Input testID="hospital-name" label="Hospital name" value={sub.hospital_name ?? ""} onChangeText={(v) => patch("hospital_name", v)} accent={accent} />
              ) : null}
              <ChipGroup
                label="Did work stop after this?"
                accent={accent}
                values={sub.work_stopped ? [sub.work_stopped] : []}
                onChange={(v) => patch("work_stopped", (v[0] as any) ?? "")}
                options={YES_NO as any}
                singleSelect
                testIDPrefix="work-stopped"
              />
            </Card>
          )}

          {step === 5 && (
            <Card>
              <Input testID="site" label="Site" value={sub.site ?? ""} onChangeText={(v) => patch("site", v)} accent={accent} placeholder="Project or site name" />
              <Input testID="site-location" label="Specific location" value={sub.site_location ?? ""} onChangeText={(v) => patch("site_location", v)} accent={accent} placeholder="Room, area, asset" />
              <ChipGroup
                label="Location type"
                accent={accent}
                values={sub.location_type ? [sub.location_type] : []}
                onChange={(v) => patch("location_type", (v[0] as any) ?? "on_site")}
                options={LOCATION_TYPES as any}
                singleSelect
                testIDPrefix="location-type"
              />
              <ChipGroup
                label="State"
                accent={accent}
                values={sub.state ? [sub.state] : ["NSW"]}
                onChange={(v) => patch("state", (v[0] as any) ?? "NSW")}
                options={AU_STATES.map((s) => ({ value: s, label: s })) as any}
                singleSelect
                testIDPrefix="state"
              />
              <Input testID="date" label="Date (YYYY-MM-DD)" value={sub.date ?? ""} onChangeText={(v) => patch("date", v)} accent={accent} placeholder="2026-05-25" autoCapitalize="none" />
              <Input testID="time" label="Time (HH:MM)" value={sub.time ?? ""} onChangeText={(v) => patch("time", v)} accent={accent} placeholder="14:30" autoCapitalize="none" />
              <ChipGroup
                label="Was this during commuting?"
                accent={accent}
                values={sub.commuting ? [sub.commuting] : ["no"]}
                onChange={(v) => patch("commuting", (v[0] as any) ?? "no")}
                options={YES_NO as any}
                singleSelect
                testIDPrefix="commuting"
              />
            </Card>
          )}

          {step === 6 && (
            <Card>
              <ChipGroup
                label="Were there witnesses?"
                accent={accent}
                values={sub.witnessed ? [sub.witnessed] : []}
                onChange={(v) => patch("witnessed", (v[0] as any) ?? "")}
                options={YES_NO as any}
                singleSelect
                testIDPrefix="witnessed"
              />
              {sub.witnessed === "yes" && workers.length > 0 ? (
                <ChipGroup
                  label="Pick witnesses from workers"
                  accent={accent}
                  values={(sub.witnesses ?? []).map((w) => w.name)}
                  onChange={(v) => patch("witnesses", (v as string[]).map((name) => ({ name })))}
                  options={workers.map((w) => ({ value: w.name, label: w.name }))}
                  testIDPrefix="witness"
                />
              ) : null}
              <Input
                testID="other-info"
                label="Anything else?"
                value={sub.other_info ?? ""}
                onChangeText={(v) => patch("other_info", v)}
                accent={accent}
                multiline
                style={{ minHeight: 100, textAlignVertical: "top" }}
                placeholder="Witnesses, regulators on site, equipment serial numbers, etc."
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Card>
          )}

          <View style={styles.navRow}>
            {step > 1 ? <SecondaryButton testID="step-back" label="Back" onPress={back} iconName="chevron-back" /> : <View style={{ flex: 1 }} />}
            <View style={{ width: 12 }} />
            {step < 6 ? (
              <View style={{ flex: 1 }}>
                <PrimaryButton testID="step-next" label="Next" onPress={next} accent={accent} iconName="chevron-forward" />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <PrimaryButton testID="submit-incident" label="Submit report" onPress={submit} accent={TOKENS.destructive} loading={submitting} iconName="checkmark" />
              </View>
            )}
          </View>

          <View style={{ height: 60 }} />
          {workers.length === 0 && sub.involved_type === "other" ? (
            <EmptyState
              icon="people-outline"
              title="No workers on file yet"
              body="Add workers in the Workers register on the SafeBase web to pick them as involved parties."
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
  h1: { color: TOKENS.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, marginTop: 4, marginBottom: 12 },
  progress: { flexDirection: "row", marginBottom: 16 },
  progressDot: { flex: 1, height: 4, marginRight: 4 },
  bigOption: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 14, marginBottom: 8 },
  bigLabel: { color: TOKENS.ink, fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  bigDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  workerChip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  workerChipLabel: { color: TOKENS.ink, fontSize: 12, fontWeight: "600" },
  aiRow: { flexDirection: "row", marginBottom: 10 },
  aiBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  aiBtnLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginLeft: 6, textTransform: "uppercase" },
  navRow: { flexDirection: "row", marginTop: 8 },
  error: { color: TOKENS.destructive, fontSize: 13, marginTop: 8 },
});
