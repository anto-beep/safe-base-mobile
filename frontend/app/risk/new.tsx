// Risk creator + editor. Uses /safety/risks endpoint with the EXACT
// backend field names: likelihood, consequence, residual_likelihood,
// residual_consequence. Backend auto-computes inherent_score/level +
// residual_score/level. Other fields per the SafeBase parity spec
// (category, activity, process, hazard, consequence_text, existing_controls,
// proposed_controls, responsible_person, due_date, review_frequency,
// hrcw_flags).

import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SafetyApi } from "@/src/api/safebase";
import { ChipGroup } from "@/src/components/ChipGroup";
import { RiskMatrix } from "@/src/components/RiskMatrix";
import { Card, Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const FREQS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "6-monthly", label: "6-monthly" },
  { value: "annually", label: "Annually" },
] as const;

const HRCW_FLAGS = [
  { value: "working_at_height", label: "Working at height >2m" },
  { value: "confined_space", label: "Confined space" },
  { value: "excavation", label: "Excavation/trench" },
  { value: "asbestos", label: "Asbestos handling" },
  { value: "demolition", label: "Demolition" },
  { value: "diving", label: "Diving work" },
  { value: "live_electrical", label: "Live electrical" },
  { value: "hot_work", label: "Hot work" },
  { value: "hazardous_substances", label: "Hazardous substances" },
  { value: "explosives", label: "Explosives" },
] as const;

export default function NewRiskScreen() {
  const accent = useAccent();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [activity, setActivity] = useState("");
  const [process, setProcess] = useState("");
  const [hazard, setHazard] = useState("");
  const [consequenceText, setConsequenceText] = useState("");
  const [existingControls, setExistingControls] = useState("");
  const [proposedControls, setProposedControls] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reviewFrequency, setReviewFrequency] = useState<string>("quarterly");
  const [hrcwFlags, setHrcwFlags] = useState<string[]>([]);
  const [likelihood, setLikelihood] = useState(3);
  const [consequence, setConsequence] = useState(3);
  const [residualL, setResidualL] = useState(2);
  const [residualC, setResidualC] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    try {
      await SafetyApi.create("risks", {
        title: title.trim(),
        category: category.trim() || undefined,
        activity: activity.trim() || undefined,
        process: process.trim() || undefined,
        hazard: hazard.trim() || undefined,
        consequence_text: consequenceText.trim() || undefined,
        existing_controls: existingControls.split("\n").map((s) => s.trim()).filter(Boolean),
        proposed_controls: proposedControls.split("\n").map((s) => s.trim()).filter(Boolean),
        responsible_person: responsiblePerson.trim() || undefined,
        due_date: dueDate.trim() || undefined,
        review_frequency: reviewFrequency,
        hrcw_flags: hrcwFlags,
        likelihood, consequence,
        residual_likelihood: residualL, residual_consequence: residualC,
      });
      Alert.alert("Risk added", "The risk register has been updated.", [
        { text: "OK", onPress: () => router.replace("/risk") },
      ]);
    } catch (e: any) { setError(e?.detail ?? e?.message ?? "Could not save the risk."); }
    finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="new-risk-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Risks</Text>
          </TouchableOpacity>
          <Eyebrow color={accent}>Risk register</Eyebrow>
          <Text style={styles.h1}>New risk</Text>
          <Text style={styles.sub}>Same 5×5 matrix and field set as the SafeBase web. Score = likelihood × consequence. Levels ≤4 low, ≤9 medium, ≤15 high, &gt;15 extreme.</Text>
          <View style={{ height: 14 }} />

          <Card>
            <Input testID="risk-title" label="Title (required)" value={title} onChangeText={setTitle} accent={accent} placeholder="Working at heights — roof access" />
            <Input testID="risk-category" label="Category" value={category} onChangeText={setCategory} accent={accent} placeholder="e.g. Working at heights" />
            <Input testID="risk-activity" label="Activity" value={activity} onChangeText={setActivity} accent={accent} placeholder="e.g. Roof tile replacement" />
            <Input testID="risk-process" label="Process" value={process} onChangeText={setProcess} accent={accent} placeholder="e.g. Pre-start, work, packdown" />
            <Input testID="risk-hazard" label="Hazard" value={hazard} onChangeText={setHazard} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} placeholder="Fall from height…" />
            <Input testID="risk-consequence" label="Consequence (if exposed)" value={consequenceText} onChangeText={setConsequenceText} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} placeholder="Serious injury or death…" />
          </Card>

          <Card>
            <Eyebrow color={accent}>Inherent risk (before controls)</Eyebrow>
            <RiskMatrix testIdPrefix="matrix-inherent" likelihood={likelihood} consequence={consequence} onChange={(l, c) => { setLikelihood(l); setConsequence(c); }} />
          </Card>

          <Card>
            <Input testID="risk-existing-controls" label="Existing controls (one per line)" value={existingControls} onChangeText={setExistingControls} accent={accent} multiline style={{ minHeight: 70, textAlignVertical: "top" }} placeholder="Edge protection\nHarness + lanyard\nDaily site brief" />
            <Input testID="risk-proposed-controls" label="Proposed additional controls (one per line)" value={proposedControls} onChangeText={setProposedControls} accent={accent} multiline style={{ minHeight: 70, textAlignVertical: "top" }} />
          </Card>

          <Card>
            <Eyebrow color={accent}>Residual risk (after controls)</Eyebrow>
            <RiskMatrix testIdPrefix="matrix-residual" likelihood={residualL} consequence={residualC} onChange={(l, c) => { setResidualL(l); setResidualC(c); }} />
          </Card>

          <Card>
            <Input testID="risk-owner" label="Responsible person" value={responsiblePerson} onChangeText={setResponsiblePerson} accent={accent} />
            <Input testID="risk-due" label="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} accent={accent} placeholder="2026-12-31" autoCapitalize="none" />
            <ChipGroup
              label="Review frequency"
              accent={accent}
              values={[reviewFrequency]}
              onChange={(v) => setReviewFrequency((v[0] as string) ?? "quarterly")}
              options={FREQS as any}
              singleSelect
              testIDPrefix="freq"
            />
            <ChipGroup
              label="High-Risk Construction Work flags"
              accent={accent}
              values={hrcwFlags}
              onChange={(v) => setHrcwFlags(v as string[])}
              options={HRCW_FLAGS as any}
              testIDPrefix="hrcw"
            />
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton testID="risk-submit" label="Save risk" onPress={submit} accent={accent} loading={submitting} iconName="checkmark" />
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 14, marginLeft: 4 },
  h1: { color: TOKENS.ink, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
  error: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
