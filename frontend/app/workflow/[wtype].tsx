// Phase 1H · Generic Workflow landing per wtype.
// Backed by /workflows/{wtype} (list) + /workflows/catalog (steps).
import React, { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkflowsApi, type WorkflowInstance, type WorkflowType } from "@/src/api/safebase";
import { Card, EmptyState, Eyebrow, MONO, Pill, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const LABELS: Record<string, { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }> = {
  new_employee: { title: "New employee", sub: "Onboarding stepper — paperwork, induction, PPE, first SWMS.", icon: "person-add-outline" },
  incident_resolution: { title: "Incident resolution", sub: "Triage → investigate → actions → close-out.", icon: "warning-outline" },
  swms_job_start: { title: "SWMS to job start", sub: "Sign-on workflow before crew starts work.", icon: "document-text-outline" },
  annual_review: { title: "Annual WHS review", sub: "Governance cycle — policies, registers, training.", icon: "calendar-outline" },
  subcontractor: { title: "Subcontractor", sub: "Sub-onboarding — ABN, insurance, SWMS, induction.", icon: "people-circle-outline" },
};

export default function WorkflowScreen() {
  const accent = useAccent();
  const router = useRouter();
  const { wtype: raw } = useLocalSearchParams<{ wtype: string }>();
  const wtype = (raw ?? "new_employee") as WorkflowType;
  const meta = LABELS[wtype as string] ?? { title: wtype, sub: "Workflow", icon: "git-network-outline" };

  const [rows, setRows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await WorkflowsApi.list(wtype); setRows(Array.isArray(r) ? r : []); }
    catch (e: any) { setError(e?.detail ?? "Could not load workflow instances."); }
    finally { setLoading(false); }
  }, [wtype]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Workflow" title={meta.title} subtitle={meta.sub} accent={accent} />
        <PrimaryButton testID={`wf-${wtype}-start`} label={`Start new ${meta.title.toLowerCase()}`} onPress={() => router.push(`/workflows?wtype=${wtype}` as any)} accent={accent} iconName="add-circle" />
        <View style={{ height: 6 }} />
        <Eyebrow color={accent}>Active instances</Eyebrow>
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          rows.length === 0 ? <EmptyState icon={meta.icon} title="No active runs" body="Tap Start to kick off the workflow." /> :
          rows.map((r: any) => (
            <Card key={r.instance_id ?? r.id} testID={`wf-${r.instance_id ?? r.id}`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{r.title ?? r.subject ?? r.instance_id ?? "—"}</Text>
                  <Text style={[s.meta, { fontFamily: MONO }]}>{(r.status ?? "in_progress").toUpperCase()}{r.current_step ? ` · step ${r.current_step}` : ""}</Text>
                  {r.created_at ? <Text style={s.meta}>Started {new Date(r.created_at).toLocaleDateString("en-AU")}</Text> : null}
                </View>
                <Pill label={(r.status ?? "OPEN").toUpperCase()} color={r.status === "completed" ? TOKENS.success : r.status === "blocked" ? TOKENS.destructive : TOKENS.warnInk} />
              </View>
            </Card>
          ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
});
