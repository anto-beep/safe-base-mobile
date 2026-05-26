// New licence form — POST /api/licences (LicenceIn). Worker picker uses
// the live /api/workers list; type uses the standard credential set.
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LicencesApi, Worker, WorkersApi } from "@/src/api/safebase";
import { ChipGroup } from "@/src/components/ChipGroup";
import { Card, EmptyState, Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const LICENCE_TYPES = [
  { value: "white_card", label: "White Card" },
  { value: "first_aid", label: "First Aid" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "high_risk", label: "High Risk Work" },
  { value: "forklift", label: "Forklift" },
  { value: "working_at_heights", label: "Working at Heights" },
  { value: "confined_space", label: "Confined Space" },
  { value: "asbestos", label: "Asbestos" },
  { value: "rsa", label: "RSA" },
  { value: "rsg", label: "RSG" },
  { value: "food_safety_supervisor", label: "FSS" },
  { value: "hr_drivers_licence", label: "HR Drivers Licence" },
  { value: "mc_drivers_licence", label: "MC Drivers Licence" },
  { value: "ahpra", label: "AHPRA" },
  { value: "ndis_screening", label: "NDIS Worker Screening" },
  { value: "police_check", label: "Police Check" },
  { value: "other", label: "Other" },
] as const;

export default function NewLicence() {
  const accent = useAccent();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState<string>("");
  const [licenceType, setLicenceType] = useState<string>("white_card");
  const [number, setNumber] = useState("");
  const [authority, setAuthority] = useState("");
  const [issue, setIssue] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    WorkersApi.list().then(setWorkers).catch(() => setWorkers([]));
  }, []);

  const save = async () => {
    setError(null);
    if (!workerId) { setError("Pick a worker."); return; }
    if (!number.trim()) { setError("Licence number is required."); return; }
    if (!expiry.trim()) { setError("Expiry date is required (YYYY-MM-DD)."); return; }
    setBusy(true);
    try {
      await LicencesApi.create({ worker_id: workerId, licence_type: licenceType, licence_number: number.trim(), issuing_authority: authority.trim() || undefined, issue_date: issue.trim() || undefined, expiry_date: expiry.trim() });
      Alert.alert("Licence added", "The credential is on file.", [
        { text: "OK", onPress: () => router.replace("/licences") },
      ]);
    } catch (e: any) { setError(e?.detail ?? e?.message ?? "Could not save."); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="new-lic-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Licences</Text>
          </TouchableOpacity>
          <Eyebrow color={accent}>People</Eyebrow>
          <Text style={styles.h1}>Add licence</Text>
          <View style={{ height: 14 }} />
          {workers.length === 0 ? (
            <EmptyState icon="person-add-outline" title="No workers on file" body="Add a worker first, then attach licences." />
          ) : (
            <Card>
              <ChipGroup label="Worker (required)" accent={accent} values={workerId ? [workerId] : []} onChange={(v) => setWorkerId((v[0] as string) ?? "")} options={workers.map((w) => ({ value: w.worker_id, label: w.name }))} singleSelect testIDPrefix="worker" />
              <ChipGroup label="Type" accent={accent} values={[licenceType]} onChange={(v) => setLicenceType((v[0] as string) ?? "white_card")} options={LICENCE_TYPES as any} singleSelect testIDPrefix="type" />
              <Input testID="lic-number" label="Licence number (required)" value={number} onChangeText={setNumber} accent={accent} autoCapitalize="characters" />
              <Input testID="lic-authority" label="Issuing authority" value={authority} onChangeText={setAuthority} accent={accent} placeholder="e.g. WorkSafe NSW" />
              <Input testID="lic-issue" label="Issue date (YYYY-MM-DD)" value={issue} onChangeText={setIssue} accent={accent} placeholder="2024-03-15" autoCapitalize="none" />
              <Input testID="lic-expiry" label="Expiry date (required, YYYY-MM-DD)" value={expiry} onChangeText={setExpiry} accent={accent} placeholder="2028-03-15" autoCapitalize="none" />
            </Card>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {workers.length > 0 ? <PrimaryButton testID="lic-submit" label="Save licence" onPress={save} accent={accent} loading={busy} iconName="checkmark" /> : null}
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
  h1: { color: TOKENS.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  error: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
