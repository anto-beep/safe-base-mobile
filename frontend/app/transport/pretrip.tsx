// Transport — Pre-trip inspection. /api/transport/pretrip-inspections.
// Mirrors the canonical Load Restraint Guide / NHVR checklist. Server
// computes fit_to_drive from any false entries.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PreTripInspection, TransportApi } from "@/src/api/industry";
import { Card, EmptyState, Eyebrow, Input, MONO, Pill, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

// Backend canonical checklist — mirrors the NHVR Pre-Trip Inspection record
// in the web app. Keep in 1:1 parity; server records the same keys.
const CHECKLIST_GROUPS: { title: string; items: { key: string; label: string }[] }[] = [
  { title: "Tyres & wheels", items: [
    { key: "tyres_pressure", label: "Tyre pressure correct" },
    { key: "tyres_tread", label: "Tread depth >1.6mm, no cuts/bulges" },
    { key: "wheels_nuts", label: "Wheel nuts secure (no missing/loose)" },
  ]},
  { title: "Lights & signals", items: [
    { key: "head_lights", label: "Head lights, high beam, indicators" },
    { key: "brake_lights", label: "Brake lights & reverse lights" },
    { key: "trailer_lights", label: "Trailer marker lights & connector" },
  ]},
  { title: "Brakes", items: [
    { key: "service_brake", label: "Service brake test (firm, no pull)" },
    { key: "park_brake", label: "Park brake holds on incline" },
    { key: "trailer_brake", label: "Trailer brake / EBS dash indicator" },
  ]},
  { title: "Load restraint", items: [
    { key: "restraint_devices", label: "Chains / straps / tarps secured per LRG 3rd Ed" },
    { key: "load_distribution", label: "Load evenly distributed, no overhang" },
    { key: "placards", label: "Dangerous-goods placards if required" },
  ]},
  { title: "Fluids & under-bonnet", items: [
    { key: "engine_oil", label: "Engine oil level" },
    { key: "coolant", label: "Coolant level & no leaks" },
    { key: "adblue", label: "AdBlue / DEF level (if fitted)" },
  ]},
  { title: "Cabin & safety", items: [
    { key: "seatbelt", label: "Seat belt operates" },
    { key: "mirrors", label: "All mirrors clean & adjusted" },
    { key: "horn", label: "Horn works" },
    { key: "fire_extinguisher", label: "Extinguisher in date" },
  ]},
];

export default function PreTripScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<PreTripInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form
  const [showForm, setShowForm] = useState(false);
  const [rego, setRego] = useState("");
  const [driver, setDriver] = useState("");
  const [odo, setOdo] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    // Default everything to TRUE (pass) so the driver only has to tap items that failed.
    const init: Record<string, boolean> = {};
    for (const g of CHECKLIST_GROUPS) for (const it of g.items) init[it.key] = true;
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TransportApi.listPreTrip(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load pre-trips. Your account may not have transport enabled."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const defects = Object.entries(checklist).filter(([, v]) => !v).map(([k]) => k);
  const fitToDrive = defects.length === 0;

  const save = async () => {
    setFormError(null);
    if (!rego.trim()) { setFormError("Vehicle rego is required."); return; }
    if (!driver.trim()) { setFormError("Driver name is required."); return; }
    setBusy(true);
    try {
      const doc = await TransportApi.createPreTrip({
        vehicle_rego: rego.trim(),
        driver_name: driver.trim(),
        checklist,
        notes: notes.trim() || undefined,
        odometer_km: odo.trim() ? Number(odo) : undefined,
      });
      Alert.alert(
        doc.fit_to_drive ? "Pre-trip passed" : "Pre-trip FAILED • NOT fit to drive",
        doc.fit_to_drive ? `${doc.vehicle_rego} cleared by ${doc.driver_name}.` : `${doc.defects.length} defect(s): ${doc.defects.slice(0, 3).join(", ")}${doc.defects.length > 3 ? "…" : ""}. The vehicle must not depart until these are rectified.`,
        [{ text: "OK", onPress: () => { setShowForm(false); load(); } }],
      );
    } catch (e: any) {
      setFormError(e?.detail ?? e?.message ?? "Could not save the pre-trip.");
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="pretrip-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
          <ScreenHeader eyebrow="Transport" title="Pre-trip inspection" subtitle="NHVR pre-trip checklist. Any false item = defect; defects block departure." accent={accent} />

          <PrimaryButton testID="pretrip-toggle" label={showForm ? "Hide form" : "New pre-trip"} onPress={() => setShowForm((s) => !s)} accent={accent} iconName={showForm ? "chevron-up" : "add"} />

          {showForm ? (
            <Card>
              <Input testID="pretrip-rego" label="Vehicle rego (required)" value={rego} onChangeText={setRego} accent={accent} autoCapitalize="characters" placeholder="e.g. ABC123" />
              <Input testID="pretrip-driver" label="Driver name (required)" value={driver} onChangeText={setDriver} accent={accent} />
              <Input testID="pretrip-odo" label="Odometer (km)" value={odo} onChangeText={setOdo} accent={accent} keyboardType="number-pad" />
              {CHECKLIST_GROUPS.map((g) => (
                <View key={g.title} style={styles.group}>
                  <Eyebrow color={accent}>{g.title}</Eyebrow>
                  {g.items.map((it) => {
                    const passed = checklist[it.key];
                    return (
                      <View key={it.key} style={styles.checkRow}>
                        <Text style={styles.checkLabel}>{it.label}</Text>
                        <View style={styles.toggleRow}>
                          <TouchableOpacity testID={`${it.key}-pass`} onPress={() => setChecklist((c) => ({ ...c, [it.key]: true }))} style={[styles.toggleBtn, passed ? { backgroundColor: "#059669", borderColor: "#059669" } : { borderColor: TOKENS.border }]}>
                            <Text style={[styles.toggleText, { color: passed ? "#FFFFFF" : COLORS.textSecondary }]}>PASS</Text>
                          </TouchableOpacity>
                          <TouchableOpacity testID={`${it.key}-fail`} onPress={() => setChecklist((c) => ({ ...c, [it.key]: false }))} style={[styles.toggleBtn, !passed ? { backgroundColor: TOKENS.destructive, borderColor: TOKENS.destructive } : { borderColor: TOKENS.border }]}>
                            <Text style={[styles.toggleText, { color: !passed ? "#FFFFFF" : COLORS.textSecondary }]}>FAIL</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
              <Input testID="pretrip-notes" label="Notes" value={notes} onChangeText={setNotes} accent={accent} multiline style={{ minHeight: 70, textAlignVertical: "top" }} placeholder="Defect details, work-around taken, fleet manager notified…" />
              <View style={[styles.summary, fitToDrive ? styles.summaryOk : styles.summaryBad]}>
                <Ionicons name={fitToDrive ? "checkmark-circle" : "warning"} size={18} color={fitToDrive ? "#065F46" : "#FFFFFF"} />
                <Text style={[styles.summaryText, { color: fitToDrive ? "#065F46" : "#FFFFFF" }]}>{fitToDrive ? "Fit to drive — no defects" : `${defects.length} defect(s) — NOT fit to drive`}</Text>
              </View>
              {formError ? <Text style={styles.err}>{formError}</Text> : null}
              <PrimaryButton testID="pretrip-submit" label="Save pre-trip" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
            </Card>
          ) : null}

          <View style={{ height: 6 }} />
          <Eyebrow color={accent}>Recent inspections</Eyebrow>

          {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : rows.length === 0 ? (
            <EmptyState icon="car-outline" title="No inspections logged" body="Tap ‘New pre-trip’ to record a NHVR-compliant inspection." />
          ) : rows.map((r) => (
            <View key={r.inspection_id} testID={`pretrip-row-${r.inspection_id}`} style={[styles.row, !r.fit_to_drive ? styles.rowBreach : null]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{r.vehicle_rego} · {r.driver_name}</Text>
                <Text style={styles.meta}>{new Date(r.inspected_at).toLocaleString("en-AU")}{typeof r.odometer_km === "number" ? ` · ${r.odometer_km.toLocaleString()} km` : ""}</Text>
                {!r.fit_to_drive ? <Text style={styles.breachText} numberOfLines={2}>{r.defects.length} defect(s): {r.defects.join(", ")}</Text> : null}
              </View>
              <Pill label={r.fit_to_drive ? "PASS" : "FAIL"} color={r.fit_to_drive ? "#059669" : TOKENS.destructive} />
            </View>
          ))}
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
  group: { marginTop: 8, borderTopWidth: 1, borderTopColor: TOKENS.border, paddingTop: 8 },
  checkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  checkLabel: { flex: 1, color: COLORS.textPrimary, fontSize: 13, lineHeight: 18 },
  toggleRow: { flexDirection: "row" },
  toggleBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 6, minWidth: 56, alignItems: "center" },
  toggleText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, fontFamily: MONO },
  summary: { flexDirection: "row", alignItems: "center", padding: 10, marginTop: 10 },
  summaryOk: { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0" },
  summaryBad: { backgroundColor: TOKENS.destructive },
  summaryText: { marginLeft: 8, fontSize: 12, fontWeight: "800", flex: 1, letterSpacing: 0.4 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  rowBreach: { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 11, marginTop: 3, fontFamily: MONO, letterSpacing: 0.4 },
  breachText: { color: TOKENS.destructive, fontSize: 12, marginTop: 4, fontWeight: "700" },
  err: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
