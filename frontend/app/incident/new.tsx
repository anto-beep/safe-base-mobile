// Verified parity with IncidentIn in /tmp/safebase-src/backend/server.py:103.
// Fields: title, description, severity (literal: near_miss/minor/moderate/serious/critical),
// incident_type (injury/near_miss/property_damage/environmental), location, site, occurred_at,
// photos (list), workers_involved (list), corrective_actions.
// Auto-stamped server-side: incident_id, status (open/investigating/closed), notify_regulator.

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

import { Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { enqueueCapture } from "@/src/lib/offline-queue";
import { useAccent, TOKENS } from "@/src/theme/colors";

type Severity = "near_miss" | "minor" | "moderate" | "serious" | "critical";
type IncidentType = "injury" | "near_miss" | "property_damage" | "environmental";

const SEVERITY: { value: Severity; label: string; tint: string; ink: string }[] = [
  { value: "near_miss", label: "Near miss", tint: "#ECFDF5", ink: "#065F46" },
  { value: "minor", label: "Minor", tint: "#ECFDF5", ink: "#065F46" },
  { value: "moderate", label: "Moderate", tint: "#FEF3C7", ink: "#92400E" },
  { value: "serious", label: "Serious", tint: "#FEE2E2", ink: "#991B1B" },
  { value: "critical", label: "Critical", tint: "#FEE2E2", ink: "#991B1B" },
];

const TYPES: { value: IncidentType; label: string }[] = [
  { value: "injury", label: "Injury" },
  { value: "near_miss", label: "Near miss" },
  { value: "property_damage", label: "Property damage" },
  { value: "environmental", label: "Environmental" },
];

export default function NewIncident() {
  const accent = useAccent();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("minor");
  const [incidentType, setIncidentType] = useState<IncidentType>("injury");
  const [location, setLocation] = useState("");
  const [site, setSite] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await enqueueCapture("/incidents", {
        title: title.trim(),
        description: description.trim(),
        severity,
        incident_type: incidentType,
        location: location.trim() || undefined,
        site: site.trim() || undefined,
        occurred_at: new Date().toISOString(),
        photos: [],
        workers_involved: [],
        corrective_actions: correctiveActions.trim() || undefined,
      });
      const willNotify = severity === "serious" || severity === "critical";
      Alert.alert(
        result.syncedOnline ? "Incident logged" : "Saved offline",
        result.syncedOnline
          ? willNotify
            ? "Severity is serious/critical — SafeBase has auto-flagged this for regulator notification."
            : "Owner has been notified."
          : "We'll sync this to SafeBase the moment connectivity is back.",
        [{ text: "OK", onPress: () => router.back() }],
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
          <TouchableOpacity testID="incident-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#525252" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Eyebrow color={accent}>Incident report</Eyebrow>
          <Text style={styles.title}>Report an incident</Text>
          <Text style={styles.subtitle}>Same form as the SafeBase web app. Serious / critical incidents auto-trigger the regulator-notification workflow.</Text>

          <View style={{ height: 18 }} />

          <Input testID="incident-title" label="Title" value={title} onChangeText={setTitle} accent={accent} placeholder="Short title (e.g. Slip in kitchen)" />
          <Input testID="incident-description" label="Description" value={description} onChangeText={setDescription} accent={accent} multiline style={{ minHeight: 100, textAlignVertical: "top" }} placeholder="What happened, who was involved, and immediate actions taken." />

          <Eyebrow color={accent}>Severity</Eyebrow>
          <View style={styles.chipRow}>
            {SEVERITY.map((s) => {
              const active = severity === s.value;
              return (
                <TouchableOpacity
                  key={s.value}
                  testID={`incident-severity-${s.value}`}
                  activeOpacity={0.85}
                  onPress={() => setSeverity(s.value)}
                  style={[styles.chip, { borderColor: active ? s.ink : TOKENS.border, backgroundColor: active ? s.tint : TOKENS.background }]}
                >
                  <Text style={[styles.chipText, { color: active ? s.ink : "#525252" }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(severity === "serious" || severity === "critical") ? (
            <View style={styles.regBanner} testID="incident-regulator-banner">
              <Ionicons name="alert-circle" size={18} color="#991B1B" />
              <Text style={styles.regText}>This severity will auto-create a regulator-notification workflow.</Text>
            </View>
          ) : null}

          <Eyebrow color={accent}>Type</Eyebrow>
          <View style={styles.chipRow}>
            {TYPES.map((t) => {
              const active = incidentType === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  testID={`incident-type-${t.value}`}
                  activeOpacity={0.85}
                  onPress={() => setIncidentType(t.value)}
                  style={[styles.chip, { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : TOKENS.background }]}
                >
                  <Text style={[styles.chipText, { color: active ? TOKENS.ink : "#525252" }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input testID="incident-location" label="Location" value={location} onChangeText={setLocation} accent={accent} placeholder="Room / area / asset" />
          <Input testID="incident-site" label="Site" value={site} onChangeText={setSite} accent={accent} placeholder="Project / job site" />
          <Input testID="incident-corrective" label="Corrective actions (optional)" value={correctiveActions} onChangeText={setCorrectiveActions} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} placeholder="Immediate steps taken to control the hazard." />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton testID="incident-submit" label="Submit incident" onPress={submit} accent={accent} loading={submitting} />
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  chip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginRight: 6, marginBottom: 6 },
  chipText: { fontSize: 13, fontWeight: "600" },
  regBanner: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#991B1B", marginBottom: 14 },
  regText: { color: "#991B1B", fontSize: 13, fontWeight: "600", marginLeft: 8, flex: 1 },
  error: { color: TOKENS.destructive, fontSize: 14, marginBottom: 10 },
});
