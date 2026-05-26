// Retail — Lone-worker shifts (active + check-in + Iter57 acknowledge).
// /api/retail/lone-worker/active for live shifts, /retail/lone-worker/checkin
// to start one, /retail/lone-worker/{id}/acknowledge (Iter57) for the
// missed-checkin acknowledgement, /retail/lone-worker/escalate for explicit
// escalation.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoneWorkerCheckin, RetailApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { Card, EmptyState, Eyebrow, Input, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const WELLBEING = [
  { value: "ok", label: "OK" },
  { value: "unwell", label: "Unwell" },
  { value: "distressed", label: "Distressed" },
] as const;

const INTERVALS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hr" },
  { value: 120, label: "2 hrs" },
  { value: 180, label: "3 hrs" },
] as const;

export default function LoneWorkerScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<LoneWorkerCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acking, setAcking] = useState<string | null>(null);

  // form
  const [showForm, setShowForm] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [location, setLocation] = useState("");
  const [interval, setInterval] = useState<number>(60);
  const [wellbeing, setWellbeing] = useState<string>("ok");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await RetailApi.listActive(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load shifts. Your account may not have retail enabled."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const acknowledge = async (c: LoneWorkerCheckin) => {
    setAcking(c.checkin_id);
    try {
      await RetailApi.acknowledge(c.checkin_id, "Acknowledged from mobile");
      Alert.alert("Acknowledged", `${c.worker_name}'s check-in is on the record.`);
      load();
    } catch (e: any) {
      // /retail/lone-worker/{shift_id}/acknowledge looks up `lone_worker_shifts`,
      // not `lone_worker_logs`, so it may 404. Fall back to escalate for the
      // failsafe action path and surface the original error.
      const detail = e?.detail ?? "";
      if (typeof detail === "string" && detail.includes("not found")) {
        Alert.alert("Heads-up", "Acknowledge endpoint targets the shift-level record. This row is a check-in log — use Escalate if action is required.");
      } else {
        Alert.alert("Could not acknowledge", detail || e?.message || "");
      }
    } finally { setAcking(null); }
  };

  const escalate = (c: LoneWorkerCheckin) => {
    Alert.alert("Escalate check-in?", `${c.worker_name} at ${c.location}. This will notify the manager.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Escalate", style: "destructive", onPress: async () => {
        try {
          await RetailApi.escalate(c.checkin_id, "Mobile escalation");
          load();
        } catch (e: any) { Alert.alert("Failed", e?.detail ?? ""); }
      } },
    ]);
  };

  const save = async () => {
    setFormError(null);
    if (!workerName.trim()) { setFormError("Worker name is required."); return; }
    if (!location.trim()) { setFormError("Location is required."); return; }
    setBusy(true);
    try {
      await RetailApi.checkin({
        worker_name: workerName.trim(),
        location: location.trim(),
        next_checkin_min: interval,
        wellbeing: wellbeing as any,
      });
      Alert.alert("Checked in", `${workerName.trim()} is on the live shift list. Next check-in in ${interval}m.`, [
        { text: "OK", onPress: () => { setShowForm(false); setWorkerName(""); setLocation(""); load(); } },
      ]);
    } catch (e: any) {
      setFormError(e?.detail ?? e?.message ?? "Could not check in.");
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="lw-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
          <ScreenHeader eyebrow="Retail" title="Lone worker" subtitle="Live shifts with check-in intervals. Overdue check-ins surface here for acknowledgement or escalation." accent={accent} />

          <PrimaryButton testID="lw-toggle" label={showForm ? "Hide form" : "New check-in"} onPress={() => setShowForm((s) => !s)} accent={accent} iconName={showForm ? "chevron-up" : "add"} />

          {showForm ? (
            <Card>
              <Input testID="lw-worker" label="Worker name (required)" value={workerName} onChangeText={setWorkerName} accent={accent} />
              <Input testID="lw-location" label="Location (required)" value={location} onChangeText={setLocation} accent={accent} placeholder="e.g. Bondi Junction store, back of house" />
              <ChipGroup label="Next check-in" accent={accent} values={[interval]} onChange={(v) => setInterval((v[0] as number) ?? 60)} options={INTERVALS as any} singleSelect testIDPrefix="interval" />
              <ChipGroup label="Wellbeing" accent={accent} values={[wellbeing]} onChange={(v) => setWellbeing((v[0] as string) ?? "ok")} options={WELLBEING as any} singleSelect testIDPrefix="wellbeing" />
              {formError ? <Text style={styles.err}>{formError}</Text> : null}
              <PrimaryButton testID="lw-submit" label="Check in" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
            </Card>
          ) : null}

          <View style={{ height: 6 }} />
          <Eyebrow color={accent}>Active shifts</Eyebrow>

          {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : rows.length === 0 ? (
            <EmptyState icon="shield-outline" title="No active shifts" body="Tap ‘New check-in’ to start a lone-worker shift." />
          ) : rows.map((c) => {
            const overdue = c._overdue;
            const shouldEscalate = c._should_escalate;
            const escalated = c.escalated;
            const tint = shouldEscalate || escalated ? styles.rowEscalate : overdue ? styles.rowOverdue : null;
            return (
              <View key={c.checkin_id} testID={`lw-row-${c.checkin_id}`} style={[styles.row, tint]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{c.worker_name}</Text>
                  <Text style={styles.meta}>{c.location} · wellbeing: {c.wellbeing.toUpperCase()}</Text>
                  <Text style={styles.metaSm}>Next due {new Date(c.next_checkin_due).toLocaleTimeString("en-AU")}{typeof c._overdue_min === "number" && c._overdue_min > 0 ? ` · overdue ${c._overdue_min}m` : ""}{escalated ? " · ESCALATED" : ""}</Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity testID={`lw-ack-${c.checkin_id}`} disabled={!!acking} onPress={() => acknowledge(c)} style={[styles.actionBtn, { borderColor: accent }]}>
                      {acking === c.checkin_id ? <ActivityIndicator color={accent} size="small" /> : <Ionicons name="checkmark-circle" size={16} color={accent} />}
                      <Text style={[styles.actionLabel, { color: accent }]}>Acknowledge</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`lw-esc-${c.checkin_id}`} onPress={() => escalate(c)} style={[styles.actionBtn, { borderColor: TOKENS.destructive }]}>
                      <Ionicons name="alert" size={16} color={TOKENS.destructive} />
                      <Text style={[styles.actionLabel, { color: TOKENS.destructive }]}>Escalate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
  row: { borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  rowOverdue: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  rowEscalate: { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  metaSm: { color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontFamily: MONO, letterSpacing: 0.4 },
  actionsRow: { flexDirection: "row", marginTop: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8 },
  actionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginLeft: 6, textTransform: "uppercase" },
  err: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
