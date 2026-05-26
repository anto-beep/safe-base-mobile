// Healthcare — AHPRA register. /api/healthcare/ahpra-register list+create
// + Iter57 inline remind action POST /healthcare/ahpra-register/{id}/remind.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AhpraRecord, HealthcareApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { Card, EmptyState, Eyebrow, Input, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const PROFESSIONS = [
  { value: "RN", label: "Registered Nurse" },
  { value: "EN", label: "Enrolled Nurse" },
  { value: "NP", label: "Nurse Practitioner" },
  { value: "MED", label: "Medical" },
  { value: "PHY", label: "Physiotherapist" },
  { value: "OT", label: "Occupational Therapist" },
  { value: "PSY", label: "Psychologist" },
  { value: "DEN", label: "Dental" },
  { value: "PHA", label: "Pharmacist" },
  { value: "OTHER", label: "Other" },
] as const;

const REG_TYPES = [
  { value: "General", label: "General" },
  { value: "Specialist", label: "Specialist" },
  { value: "Limited", label: "Limited" },
  { value: "Provisional", label: "Provisional" },
  { value: "Non-practising", label: "Non-practising" },
] as const;

export default function AhpraScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<AhpraRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminding, setReminding] = useState<string | null>(null);

  // form
  const [showForm, setShowForm] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [profession, setProfession] = useState<string>("RN");
  const [regNumber, setRegNumber] = useState("");
  const [regType, setRegType] = useState<string>("General");
  const [issued, setIssued] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HealthcareApi.listAhpra(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load the AHPRA register. Your account may not have healthcare enabled."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const remind = async (r: AhpraRecord) => {
    setReminding(r.reg_id);
    try {
      await HealthcareApi.remindAhpra(r.reg_id);
      Alert.alert("Reminder queued", `Renewal reminder queued for ${r.worker_name}.`);
    } catch (e: any) {
      Alert.alert("Reminder failed", e?.detail ?? "Could not queue the reminder.");
    } finally { setReminding(null); }
  };

  const save = async () => {
    setFormError(null);
    if (!workerName.trim()) { setFormError("Worker name is required."); return; }
    if (!regNumber.trim()) { setFormError("Registration number is required."); return; }
    setBusy(true);
    try {
      await HealthcareApi.createAhpra({
        worker_name: workerName.trim(),
        profession,
        registration_number: regNumber.trim(),
        registration_type: regType,
        issued_at: issued.trim() || undefined,
        expires_at: expires.trim() || undefined,
      });
      Alert.alert("AHPRA registration added", `${workerName.trim()} on the register.`, [
        { text: "OK", onPress: () => { setShowForm(false); setWorkerName(""); setRegNumber(""); setIssued(""); setExpires(""); load(); } },
      ]);
    } catch (e: any) {
      setFormError(e?.detail ?? e?.message ?? "Could not save.");
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="ahpra-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
          <ScreenHeader eyebrow="Healthcare" title="AHPRA register" subtitle="Clinician registrations with expiry tracking + renewal reminders." accent={accent} />

          <PrimaryButton testID="ahpra-toggle" label={showForm ? "Hide form" : "Add registration"} onPress={() => setShowForm((s) => !s)} accent={accent} iconName={showForm ? "chevron-up" : "add"} />

          {showForm ? (
            <Card>
              <Input testID="ahpra-name" label="Worker name (required)" value={workerName} onChangeText={setWorkerName} accent={accent} />
              <ChipGroup label="Profession" accent={accent} values={[profession]} onChange={(v) => setProfession((v[0] as string) ?? "RN")} options={PROFESSIONS as any} singleSelect testIDPrefix="prof" />
              <Input testID="ahpra-num" label="Registration number (required)" value={regNumber} onChangeText={setRegNumber} accent={accent} autoCapitalize="characters" placeholder="e.g. NMW0001234567" />
              <ChipGroup label="Registration type" accent={accent} values={[regType]} onChange={(v) => setRegType((v[0] as string) ?? "General")} options={REG_TYPES as any} singleSelect testIDPrefix="reg-type" />
              <Input testID="ahpra-issued" label="Issued (YYYY-MM-DD)" value={issued} onChangeText={setIssued} accent={accent} placeholder="2024-09-15" autoCapitalize="none" />
              <Input testID="ahpra-expires" label="Expires (YYYY-MM-DD)" value={expires} onChangeText={setExpires} accent={accent} placeholder="2026-09-15" autoCapitalize="none" />
              {formError ? <Text style={styles.err}>{formError}</Text> : null}
              <PrimaryButton testID="ahpra-submit" label="Save registration" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
            </Card>
          ) : null}

          <View style={{ height: 6 }} />
          <Eyebrow color={accent}>Registrations</Eyebrow>

          {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : rows.length === 0 ? (
            <EmptyState icon="medical-outline" title="No registrations on file" body="Add a clinician's AHPRA record to start expiry tracking." />
          ) : rows.map((r) => {
            const expired = r._expired || (typeof r._days_to_expiry === "number" && r._days_to_expiry < 0);
            const expiring = r._expiring_soon && !expired;
            return (
              <View key={r.reg_id} testID={`ahpra-row-${r.reg_id}`} style={[styles.row, expired ? styles.rowExpired : null, expiring ? styles.rowExpiring : null]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{r.worker_name}</Text>
                  <Text style={styles.meta}>{(r.profession || "—").toUpperCase()} · {r.registration_type || "General"} · {r.registration_number}</Text>
                  <Text style={styles.metaSm}>Expires {r.expires_at ?? "—"}{typeof r._days_to_expiry === "number" ? ` · ${r._days_to_expiry < 0 ? `${-r._days_to_expiry}d ago` : `in ${r._days_to_expiry}d`}` : ""}</Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity testID={`ahpra-remind-${r.reg_id}`} disabled={!!reminding} onPress={() => remind(r)} style={[styles.actionBtn, { borderColor: accent }]}>
                      {reminding === r.reg_id ? <ActivityIndicator color={accent} size="small" /> : <Ionicons name="notifications" size={16} color={accent} />}
                      <Text style={[styles.actionLabel, { color: accent }]}>Remind</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {expired ? <View style={[styles.statusPill, { backgroundColor: TOKENS.destructive }]}><Text style={styles.statusText}>EXPIRED</Text></View> : expiring ? <View style={[styles.statusPill, { backgroundColor: "#F59E0B" }]}><Text style={styles.statusText}>EXPIRING</Text></View> : <View style={[styles.statusPill, { backgroundColor: "#059669" }]}><Text style={styles.statusText}>ACTIVE</Text></View>}
              </View>
            );
          })}
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  rowExpired: { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" },
  rowExpiring: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, fontFamily: MONO, letterSpacing: 0.4 },
  metaSm: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  statusText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, fontFamily: MONO },
  actionsRow: { flexDirection: "row", marginTop: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  actionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginLeft: 6, textTransform: "uppercase" },
  err: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
