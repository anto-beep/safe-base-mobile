// Hospitality — Temperature Logs. Mirrors web Temperature Logs page +
// /api/hospitality/temperature-logs (FSANZ Std 3.2.2 automated rule:
// cold ≤ 5°C, frozen ≤ -15°C, hot hold ≥ 60°C — the backend computes
// in_range and out_of_range_reason on POST). Owner role only — permissions
// enforced server-side via require_feature; we surface the friendly 403.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EquipmentType, HospitalityApi, TempStats, TemperatureLog } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { Card, EmptyState, Eyebrow, Input, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const EQUIP_TYPES: { value: EquipmentType; label: string; hint: string }[] = [
  { value: "fridge", label: "Fridge", hint: "≤5°C" },
  { value: "coolroom", label: "Cool-room", hint: "≤5°C" },
  { value: "cold_display", label: "Cold display", hint: "≤5°C" },
  { value: "freezer", label: "Freezer", hint: "≤-15°C" },
  { value: "bain_marie", label: "Bain marie", hint: "≥60°C" },
  { value: "hot_display", label: "Hot display", hint: "≥60°C" },
  { value: "hot_holding", label: "Hot hold", hint: "≥60°C" },
  { value: "dishwasher", label: "Dishwasher", hint: "sanitise" },
];

export default function TemperatureLogsScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<TemperatureLog[]>([]);
  const [stats, setStats] = useState<TempStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [equipment, setEquipment] = useState("");
  const [equipType, setEquipType] = useState<EquipmentType>("fridge");
  const [tempC, setTempC] = useState("");
  const [takenBy, setTakenBy] = useState("");
  const [corrective, setCorrective] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, s] = await Promise.all([HospitalityApi.listTemps(), HospitalityApi.tempStats().catch(() => null)]);
      setRows(r.rows ?? []);
      setStats(s);
    } catch (e: any) {
      setError(e?.detail ?? "Could not load temperature logs. Your account may not have hospitality enabled.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  // Local preview of FSANZ rule — server is authoritative.
  const predicted = useMemo(() => {
    const t = parseFloat(tempC);
    if (Number.isNaN(t)) return null;
    if (["fridge", "coolroom", "cold_display"].includes(equipType)) return { in_range: t <= 5, reason: "Cold storage must be ≤5°C (FSANZ Std 3.2.2)" };
    if (equipType === "freezer") return { in_range: t <= -15, reason: "Frozen storage must be ≤−15°C" };
    if (["bain_marie", "hot_display", "hot_holding"].includes(equipType)) return { in_range: t >= 60, reason: "Hot holding must be ≥60°C (FSANZ Std 3.2.2)" };
    return { in_range: true, reason: "" };
  }, [tempC, equipType]);

  const save = async () => {
    setFormError(null);
    if (!equipment.trim()) { setFormError("Equipment name is required."); return; }
    const t = parseFloat(tempC);
    if (Number.isNaN(t)) { setFormError("Temperature must be a number (e.g. 3.5)."); return; }
    if (predicted && !predicted.in_range && !corrective.trim()) {
      setFormError("Out of range — record the corrective action you took.");
      return;
    }
    setBusy(true);
    try {
      const doc = await HospitalityApi.createTemp({
        equipment: equipment.trim(),
        equipment_type: equipType,
        temp_c: t,
        taken_by: takenBy.trim() || undefined,
        corrective_action: corrective.trim() || undefined,
      });
      Alert.alert(
        doc.in_range ? "Log saved • in range" : "Log saved • BREACH",
        doc.in_range ? `${doc.equipment} at ${doc.temp_c}°C is within FSANZ limits.` : `${doc.equipment} at ${doc.temp_c}°C breached — ${doc.out_of_range_reason ?? "out of range"}.`,
        [{ text: "OK", onPress: () => { setShowForm(false); setEquipment(""); setTempC(""); setCorrective(""); load(); } }],
      );
    } catch (e: any) {
      setFormError(e?.detail ?? e?.message ?? "Could not save the log.");
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="temp-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
          <ScreenHeader eyebrow="Hospitality" title="Temperature logs" subtitle="FSANZ Std 3.2.2 automated 4-hour rule. Cold ≤5°C · Frozen ≤-15°C · Hot ≥60°C." accent={accent} />

          {stats ? (
            <View style={styles.statRow} testID="temp-stats">
              <Stat label="30d logs" value={stats.total_30d} />
              <Stat label="Breaches" value={stats.breaches_30d} tint={stats.breaches_30d > 0 ? "#FEE2E2" : undefined} />
              <Stat label="Rate %" value={`${stats.breach_rate_pct}`} tint={stats.breach_rate_pct > 0 ? "#FED7AA" : undefined} />
            </View>
          ) : null}

          <PrimaryButton testID="temp-toggle" label={showForm ? "Hide form" : "Record temperature"} onPress={() => setShowForm((s) => !s)} accent={accent} iconName={showForm ? "chevron-up" : "thermometer"} />

          {showForm ? (
            <Card>
              <Input testID="temp-equipment" label="Equipment (required)" value={equipment} onChangeText={setEquipment} accent={accent} placeholder="e.g. Walk-in fridge #1" />
              <ChipGroup label="Equipment type" accent={accent} values={[equipType]} onChange={(v) => setEquipType((v[0] as EquipmentType) ?? "fridge")} options={EQUIP_TYPES.map((e) => ({ value: e.value, label: `${e.label} (${e.hint})` }))} singleSelect testIDPrefix="etype" />
              <Input testID="temp-c" label="Temperature (°C)" value={tempC} onChangeText={setTempC} accent={accent} keyboardType="numbers-and-punctuation" placeholder="e.g. 3.5" />
              {predicted ? (
                <View style={[styles.predict, predicted.in_range ? styles.predictOk : styles.predictBad]}>
                  <Ionicons name={predicted.in_range ? "checkmark-circle" : "warning"} size={16} color={predicted.in_range ? "#065F46" : "#FFFFFF"} />
                  <Text style={[styles.predictText, { color: predicted.in_range ? "#065F46" : "#FFFFFF" }]}>{predicted.in_range ? "In range" : predicted.reason}</Text>
                </View>
              ) : null}
              <Input testID="temp-by" label="Taken by" value={takenBy} onChangeText={setTakenBy} accent={accent} placeholder="Your name (optional)" />
              {predicted && !predicted.in_range ? (
                <Input testID="temp-correct" label="Corrective action (required for breach)" value={corrective} onChangeText={setCorrective} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} placeholder="e.g. Moved stock to alt fridge, called fridge tech, discarded affected products" />
              ) : null}
              {formError ? <Text style={styles.err}>{formError}</Text> : null}
              <PrimaryButton testID="temp-submit" label="Save log" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
            </Card>
          ) : null}

          <View style={{ height: 6 }} />
          <Eyebrow color={accent}>Recent logs</Eyebrow>

          {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : rows.length === 0 ? (
            <EmptyState icon="thermometer-outline" title="No logs yet" body="Tap ‘Record temperature’ to start the 4-hour audit trail." />
          ) : rows.map((r) => (
            <View key={r.log_id} testID={`temp-row-${r.log_id}`} style={[styles.row, !r.in_range ? styles.rowBreach : null]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{r.equipment}</Text>
                <Text style={styles.meta}>{r.equipment_type.replace(/_/g, " ").toUpperCase()} · {new Date(r.taken_at).toLocaleString("en-AU")}</Text>
                {!r.in_range ? <Text style={styles.breachText}>{r.out_of_range_reason ?? "out of range"}</Text> : null}
                {r.corrective_action ? <Text style={styles.corrective} numberOfLines={2}>Action: {r.corrective_action}</Text> : null}
              </View>
              <View style={[styles.tempBadge, { backgroundColor: r.in_range ? "#059669" : TOKENS.destructive }]}><Text style={styles.tempBadgeText}>{r.temp_c}°C</Text></View>
            </View>
          ))}
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stat({ label, value, tint }: { label: string; value: number | string; tint?: string }) {
  return (
    <View style={[styles.statBox, tint ? { backgroundColor: tint } : null]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  statRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 12 },
  statBox: { flex: 1, marginHorizontal: 4, borderWidth: 1, borderColor: TOKENS.border, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center" },
  statLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: MONO },
  statValue: { color: TOKENS.ink, fontSize: 20, fontWeight: "800", marginTop: 4 },
  predict: { flexDirection: "row", alignItems: "center", padding: 10, marginVertical: 8 },
  predictOk: { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0" },
  predictBad: { backgroundColor: TOKENS.destructive },
  predictText: { marginLeft: 8, fontSize: 12, fontWeight: "700", flex: 1 },
  row: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  rowBreach: { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4, fontFamily: MONO, letterSpacing: 0.4 },
  breachText: { color: TOKENS.destructive, fontSize: 12, marginTop: 4, fontWeight: "700" },
  corrective: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontStyle: "italic" },
  tempBadge: { paddingHorizontal: 10, paddingVertical: 6 },
  tempBadgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13, fontFamily: MONO },
  err: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
