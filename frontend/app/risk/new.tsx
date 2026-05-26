// Risk creator with the verified 5×5 matrix.
// Backend reference: /tmp/safebase-src/backend/risk_module.py (POST /risks).
// We render the minimum required fields for v1 — title, primary_hazard,
// hazard_description, risk_owner, inherent l/c, residual l/c, review_frequency.
// (The full schema has 30+ fields; this matches the brief's stated subset and
// is forward-compatible — extra fields are passed through untouched if present.)

import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { RiskMatrix } from "@/src/components/RiskMatrix";
import { Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { useAccent, TOKENS } from "@/src/theme/colors";

const FREQS: { value: string; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "6-monthly", label: "6-monthly" },
  { value: "annually", label: "Annually" },
];

export default function NewRisk() {
  const accent = useAccent();
  const [title, setTitle] = useState("");
  const [primaryHazard, setPrimaryHazard] = useState("");
  const [hazardDescription, setHazardDescription] = useState("");
  const [riskOwner, setRiskOwner] = useState("");
  const [inherentL, setInherentL] = useState(3);
  const [inherentC, setInherentC] = useState(3);
  const [residualL, setResidualL] = useState(2);
  const [residualC, setResidualC] = useState(2);
  const [reviewFrequency, setReviewFrequency] = useState("quarterly");
  const [controls, setControls] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    try {
      // Field names match risk_module.py POST /risks body exactly.
      await api.post("/risks", {
        title: title.trim(),
        primary_hazard: primaryHazard.trim() || undefined,
        hazard_description: hazardDescription.trim() || undefined,
        risk_owner: riskOwner.trim() || undefined,
        inherent_likelihood: inherentL,
        inherent_consequence: inherentC,
        residual_likelihood: residualL,
        residual_consequence: residualC,
        review_frequency: reviewFrequency,
        controls: controls
          .split("\n")
          .map((c) => c.trim())
          .filter(Boolean)
          .map((label) => ({ label, type: "administrative" })),
        status: "active",
      });
      Alert.alert("Risk created", "Added to the risk register.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Failed to create risk.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="risk-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#525252" />
            <Text style={styles.backText}>Risks</Text>
          </TouchableOpacity>

          <Eyebrow color={accent}>Risk register</Eyebrow>
          <Text style={styles.title}>New risk</Text>
          <Text style={styles.subtitle}>Same 5×5 matrix as the SafeBase web app. Score = likelihood × consequence. Levels: ≤5 low, ≤11 medium, ≤19 high, &gt;19 extreme.</Text>

          <View style={{ height: 18 }} />

          <Input testID="risk-title" label="Risk title" value={title} onChangeText={setTitle} accent={accent} placeholder="e.g. Working at heights — roof access" />
          <Input testID="risk-primary-hazard" label="Primary hazard" value={primaryHazard} onChangeText={setPrimaryHazard} accent={accent} placeholder="e.g. Fall from height" />
          <Input testID="risk-hazard-desc" label="Hazard description" value={hazardDescription} onChangeText={setHazardDescription} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
          <Input testID="risk-owner" label="Risk owner" value={riskOwner} onChangeText={setRiskOwner} accent={accent} placeholder="Name of accountable person" />

          <View style={styles.matrixWrap}>
            <RiskMatrix
              testIdPrefix="risk-matrix-inherent"
              title="Inherent (before controls)"
              likelihood={inherentL}
              consequence={inherentC}
              onChange={(l, c) => { setInherentL(l); setInherentC(c); }}
            />
          </View>

          <Input testID="risk-controls" label="Controls (one per line)" value={controls} onChangeText={setControls} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} placeholder={"Edge protection installed\nHarness + lanyard\nDaily site brief"} />

          <View style={styles.matrixWrap}>
            <RiskMatrix
              testIdPrefix="risk-matrix-residual"
              title="Residual (after controls)"
              likelihood={residualL}
              consequence={residualC}
              onChange={(l, c) => { setResidualL(l); setResidualC(c); }}
            />
          </View>

          <Eyebrow color={accent}>Review frequency</Eyebrow>
          <View style={styles.chipRow}>
            {FREQS.map((f) => {
              const active = reviewFrequency === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  testID={`risk-freq-${f.value}`}
                  activeOpacity={0.85}
                  onPress={() => setReviewFrequency(f.value)}
                  style={[styles.chip, { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : TOKENS.background }]}
                >
                  <Text style={[styles.chipText, { color: active ? TOKENS.ink : "#525252" }]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton testID="risk-submit" label="Save risk" onPress={submit} accent={accent} loading={submitting} />
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: "#525252", fontSize: 14 },
  title: { color: TOKENS.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  subtitle: { color: "#525252", fontSize: 14, lineHeight: 20, marginTop: 6 },
  matrixWrap: { backgroundColor: TOKENS.background, borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginRight: 6, marginBottom: 6 },
  chipText: { fontSize: 13, fontWeight: "600" },
  error: { color: TOKENS.destructive, fontSize: 14, marginBottom: 10 },
});
