// Workers register — /api/workers. List + create + delete.
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Worker, WorkersApi } from "@/src/api/safebase";
import { Card, EmptyState, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

export default function WorkersIndex() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try { setRows(await WorkersApi.list()); }
    catch (e: any) { setError(e?.detail ?? "Could not load workers."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const filtered = useMemo(() => rows.filter((r) => !q || `${r.name} ${r.trade ?? ""} ${r.role ?? ""}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  const remove = (id: string, name: string) => {
    Alert.alert("Remove worker?", `Delete ${name} from the register?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await WorkersApi.remove(id); load(); } catch (e: any) { Alert.alert("Failed", e?.detail ?? ""); }
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />}>
        <TouchableOpacity testID="workers-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="People" title="Workers" subtitle={`${rows.length} on register`} accent={accent} />
        <PrimaryButton testID="add-worker-btn" label="Add worker" onPress={() => router.push("/workers/new")} accent={accent} iconName="person-add" />
        <View style={{ height: 14 }} />

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput testID="workers-search" value={q} onChangeText={setQ} placeholder="Search name, trade, role…" placeholderTextColor={COLORS.textMuted} style={styles.search} />
        </View>

        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 30 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : filtered.length === 0 ? (
          <EmptyState icon="people-outline" title="No workers yet" body="Tap ‘Add worker’ to start the register." />
        ) : filtered.map((w) => (
          <View key={w.worker_id} testID={`worker-row-${w.worker_id}`} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{w.name}</Text>
              <Text style={styles.meta}>{(w.role || "worker")} · {w.trade || "—"}</Text>
              {w.email || w.phone ? <Text style={styles.metaSm}>{[w.email, w.phone].filter(Boolean).join(" · ")}</Text> : null}
            </View>
            <TouchableOpacity testID={`worker-delete-${w.worker_id}`} onPress={() => remove(w.worker_id, w.name)} style={styles.deleteBtn}><Ionicons name="trash-outline" size={18} color={TOKENS.destructive} /></TouchableOpacity>
          </View>
        ))}
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
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  name: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 0.6 },
  metaSm: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  deleteBtn: { padding: 8 },
  err: { color: TOKENS.destructive, fontSize: 14 },
});
