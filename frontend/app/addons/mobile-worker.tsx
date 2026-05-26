// Phase 1I · Mobile worker view — crew-facing dashboard.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkerSelfApi, WorkerSummary } from "@/src/api/extras";
import { Card, Eyebrow, MONO, Pill, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function MobileWorkerScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [data, setData] = useState<WorkerSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const d = await WorkerSelfApi.summary(); setData(d ?? {}); }
    catch (e: any) { setError(e?.detail ?? "Could not load worker view."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Add-on" title="Mobile worker" subtitle="Crew-facing view: upcoming shifts, expiring credentials, assigned SWMS." accent={accent} />
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          <>
            <Card>
              <Eyebrow color={accent}>Expiring credentials</Eyebrow>
              {(data.expiring_credentials ?? []).length === 0 ? <Text style={s.body}>Nothing expiring soon.</Text> :
                (data.expiring_credentials ?? []).map((c: any, i: number) => (
                  <View key={i} style={s.row}>
                    <Text style={s.line}>{c.licence_type ?? c.title ?? "Credential"}</Text>
                    <Pill label={c.days_until_expiry !== undefined ? `${c.days_until_expiry}D` : "SOON"} color={TOKENS.warnInk} />
                  </View>
                ))}
            </Card>
            <Card>
              <Eyebrow color={accent}>Upcoming shifts</Eyebrow>
              {(data.upcoming_shifts ?? []).length === 0 ? <Text style={s.body}>No shifts scheduled.</Text> :
                (data.upcoming_shifts ?? []).map((sh: any, i: number) => (
                  <View key={i} style={s.row}>
                    <Text style={s.line}>{sh.site ?? sh.location ?? "Site"}</Text>
                    <Text style={[s.line, { fontFamily: MONO, color: COLORS.textMuted }]}>{sh.start_at ? new Date(sh.start_at).toLocaleString("en-AU") : ""}</Text>
                  </View>
                ))}
            </Card>
            <Card>
              <Eyebrow color={accent}>Assigned SWMS</Eyebrow>
              {(data.assigned_swms ?? []).length === 0 ? <Text style={s.body}>No SWMS assigned.</Text> :
                (data.assigned_swms ?? []).map((d: any, i: number) => (
                  <View key={i} style={s.row}>
                    <Text style={s.line}>{d.title ?? "SWMS"}</Text>
                    <Pill label={d.signed ? "SIGNED" : "SIGN NEEDED"} color={d.signed ? TOKENS.success : TOKENS.destructive} />
                  </View>
                ))}
            </Card>
            <Card>
              <Eyebrow color={accent}>Recent check-ins</Eyebrow>
              {(data.recent_checkins ?? []).length === 0 ? <Text style={s.body}>No check-ins yet.</Text> :
                (data.recent_checkins ?? []).slice(0, 5).map((c: any, i: number) => (
                  <View key={i} style={s.row}>
                    <Text style={s.line}>{c.site ?? "Site"}</Text>
                    <Text style={[s.line, { fontFamily: MONO, color: COLORS.textMuted }]}>{c.checked_in_at ? new Date(c.checked_in_at).toLocaleString("en-AU") : ""}</Text>
                  </View>
                ))}
            </Card>
          </>}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: TOKENS.border },
  line: { color: COLORS.textPrimary, fontSize: 13 },
  body: { color: COLORS.textMuted, fontSize: 13, marginTop: 6 },
});
