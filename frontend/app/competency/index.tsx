// Phase 1F · Competency Matrix — workers × mandatory credentials.
// Lightweight matrix view from /workers + /licences (the web shows a wider
// grid; mobile shows a compact per-worker list).
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { LicencesApi, WorkersApi, type Licence, type Worker } from "@/src/api/safebase";
import { Card, EmptyState, Eyebrow, MONO, Pill, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function CompetencyMatrixScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [licences, setLicences] = useState<Licence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [w, l] = await Promise.all([WorkersApi.list(), LicencesApi.list()]);
      setWorkers(w); setLicences(l);
    } catch (e: any) { setError(e?.detail ?? "Could not load competency data."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const licsByWorker = (workerId: string) => licences.filter(l => l.worker_id === workerId);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Workers" title="Competency matrix" subtitle="Each worker × their mandatory credentials. Tap a row to view their full record." accent={accent} />
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          workers.length === 0 ? <EmptyState icon="people-outline" title="No workers" body="Add workers first to build a competency matrix." /> :
          workers.map((w) => {
            const lics = licsByWorker(w.worker_id);
            const expired = lics.filter(l => l.status === "expired").length;
            const expiring = lics.filter(l => l.status === "expiring_soon").length;
            return (
              <TouchableOpacity key={w.worker_id} testID={`cm-${w.worker_id}`} onPress={() => router.push("/workers" as any)} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{w.name}</Text>
                  <Text style={[s.meta, { fontFamily: MONO }]}>{w.role}{w.trade ? ` · ${w.trade}` : ""} · {lics.length} credentials</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
                    {lics.slice(0, 6).map(l => (
                      <View key={l.licence_id} style={[s.tag, l.status === "expired" && { borderColor: TOKENS.destructive }, l.status === "expiring_soon" && { borderColor: TOKENS.warnInk }]}>
                        <Text style={[s.tagText, l.status === "expired" && { color: TOKENS.destructive }]}>{l.licence_type}</Text>
                      </View>
                    ))}
                    {lics.length > 6 ? <View style={s.tag}><Text style={s.tagText}>+{lics.length - 6}</Text></View> : null}
                  </View>
                </View>
                {expired > 0 ? <Pill label={`${expired} EXPIRED`} color={TOKENS.destructive} /> : expiring > 0 ? <Pill label={`${expiring} SOON`} color={TOKENS.warnInk} /> : <Pill label="CURRENT" color={TOKENS.success} />}
              </TouchableOpacity>
            );
          })}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  row: { flexDirection: "row", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  name: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  tag: { borderWidth: 1, borderColor: TOKENS.border, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 },
  tagText: { fontSize: 10, color: COLORS.textSecondary, fontFamily: MONO },
});
