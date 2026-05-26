// Licences register — /api/licences. Lists w/ status pills (active, expiring,
// expired), Iter57 remind action per row, filter by status, navigate to new.
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Licence, LicencesApi, Worker, WorkersApi } from "@/src/api/safebase";
import { Card, EmptyState, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const STATUS_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  active: { label: "ACTIVE", bg: "#ECFDF5", fg: "#059669" },
  expiring_soon: { label: "EXPIRING", bg: "#FEF3C7", fg: "#B45309" },
  expired: { label: "EXPIRED", bg: "#FEE2E2", fg: "#B91C1C" },
};
const STATUSES = ["all", "active", "expiring_soon", "expired"] as const;

export default function LicencesIndex() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<Licence[]>([]);
  const [workers, setWorkers] = useState<Record<string, Worker>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [reminding, setReminding] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [licList, workerList] = await Promise.all([LicencesApi.list(), WorkersApi.list()]);
      setRows(licList);
      setWorkers(Object.fromEntries(workerList.map((w) => [w.worker_id, w])));
    } catch (e: any) { setError(e?.detail ?? "Could not load licences."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const filtered = useMemo(() => rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    const w = workers[r.worker_id];
    if (q && !`${w?.name ?? ""} ${r.licence_type} ${r.licence_number}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, q, status, workers]);

  const remind = async (lic: Licence) => {
    setReminding(lic.licence_id);
    try {
      await LicencesApi.remind(lic.licence_id);
      Alert.alert("Reminder queued", `Renewal reminder queued for ${workers[lic.worker_id]?.name ?? "worker"}.`);
    } catch (e: any) { Alert.alert("Reminder failed", e?.detail ?? ""); }
    finally { setReminding(null); }
  };

  const remove = (id: string) => {
    Alert.alert("Delete licence?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await LicencesApi.remove(id); load(); } catch (e: any) { Alert.alert("Failed", e?.detail ?? ""); }
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />}>
        <TouchableOpacity testID="lic-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="People" title="Licences" subtitle={`${rows.length} credentials· expiry-aware`} accent={accent} />
        <PrimaryButton testID="add-licence-btn" label="Add licence" onPress={() => router.push("/licences/new")} accent={accent} iconName="add" />
        <View style={{ height: 14 }} />

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput testID="lic-search" value={q} onChangeText={setQ} placeholder="Search worker, type or number…" placeholderTextColor={COLORS.textMuted} style={styles.search} />
        </View>
        <View style={styles.filterRow}>
          {STATUSES.map((s) => {
            const active = status === s;
            const meta = s === "all" ? { fg: accent, bg: "transparent" } : STATUS_LABEL[s];
            return (
              <TouchableOpacity key={s} testID={`lic-filter-${s}`} activeOpacity={0.85} onPress={() => setStatus(s)} style={[styles.chip, { borderColor: active ? meta.fg : TOKENS.border, backgroundColor: active && s !== "all" ? meta.bg : active ? `${accent}1A` : "transparent" }]}>
                <Text style={[styles.chipLabel, { color: active ? meta.fg : COLORS.textSecondary }]}>{s.toUpperCase().replace("_", " ")}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 30 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : filtered.length === 0 ? (
          <EmptyState icon="card-outline" title="No licences match" body="Add a worker first, then attach licences." />
        ) : filtered.map((l) => {
          const w = workers[l.worker_id];
          const meta = STATUS_LABEL[l.status] ?? STATUS_LABEL.active;
          return (
            <View key={l.licence_id} testID={`licence-row-${l.licence_id}`} style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.title} numberOfLines={1}>{w?.name ?? "—"}</Text>
                <View style={[styles.statusPill, { backgroundColor: meta.bg, borderColor: meta.fg }]}><Text style={[styles.statusText, { color: meta.fg }]}>{meta.label}</Text></View>
              </View>
              <Text style={styles.meta}>{l.licence_type.replace(/_/g, " ").toUpperCase()} · {l.licence_number}</Text>
              <Text style={styles.metaSm}>Expires {l.expiry_date} {typeof l.days_until_expiry === "number" ? `· ${l.days_until_expiry < 0 ? `${-l.days_until_expiry}d ago` : `in ${l.days_until_expiry}d`}` : ""}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity testID={`lic-remind-${l.licence_id}`} disabled={!!reminding} activeOpacity={0.85} onPress={() => remind(l)} style={[styles.actionBtn, { borderColor: accent }]}>
                  {reminding === l.licence_id ? <ActivityIndicator size="small" color={accent} /> : <Ionicons name="notifications" size={16} color={accent} />}
                  <Text style={[styles.actionLabel, { color: accent }]}>Remind</Text>
                </TouchableOpacity>
                <TouchableOpacity testID={`lic-delete-${l.licence_id}`} activeOpacity={0.85} onPress={() => remove(l.licence_id)} style={[styles.actionBtn, { borderColor: TOKENS.border }]}>
                  <Ionicons name="trash-outline" size={16} color={TOKENS.destructive} />
                  <Text style={[styles.actionLabel, { color: TOKENS.destructive }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  searchRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: TOKENS.border, paddingHorizontal: 12, marginBottom: 10 },
  search: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 14, color: COLORS.textPrimary },
  filterRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  chip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  chipLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, fontFamily: MONO },
  row: { borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6, fontFamily: MONO, letterSpacing: 0.4 },
  metaSm: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statusPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  actionsRow: { flexDirection: "row", marginTop: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8 },
  actionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginLeft: 6, textTransform: "uppercase" },
  err: { color: TOKENS.destructive, fontSize: 14 },
});
