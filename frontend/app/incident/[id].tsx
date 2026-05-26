// Incident Detail — mirrors /tmp/safebase_ref/frontend/src/pages/incident/IncidentDetail.jsx.
// Shows reference, lifecycle stages, severity, notifiable, submission, triage,
// investigation, actions, close-out, audit log + a button to advance each stage.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Incident, Incidents } from "@/src/api/incidents";
import { IncidentStageBar } from "@/src/components/IncidentStageBar";
import { SeverityBadge } from "@/src/components/SeverityBadge";
import { Card, EmptyState, Eyebrow, MONO, Pill, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { STAGES } from "@/src/constants/incident";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

export default function IncidentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const router = useRouter();
  const [doc, setDoc] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const r = await Incidents.get(id);
      setDoc(r);
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Failed to load incident.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const reopen = () => {
    Alert.alert("Re-open incident?", "Provide a brief reason.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Re-open",
        style: "destructive",
        onPress: async () => {
          try {
            await Incidents.reopen(id!, { reason: "Re-opened from mobile" });
            load();
          } catch (e: any) { Alert.alert("Failed", e?.detail ?? "Could not re-open"); }
        },
      },
    ]);
  };

  if (loading && !doc) {
    return (
      <SafeAreaView style={styles.safe}><Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={accent} /></View>
      </SafeAreaView>
    );
  }
  if (error || !doc) {
    return (
      <SafeAreaView style={styles.safe}><Stack.Screen options={{ headerShown: false }} />
        <EmptyState icon="alert-circle-outline" title="Couldn't load incident" body={error ?? "Unknown error."} />
        <View style={{ paddingHorizontal: 20 }}><SecondaryButton label="Back to list" onPress={() => router.replace("/incident")} /></View>
      </SafeAreaView>
    );
  }

  const sub = doc.submission || {};
  const tri = doc.triage || {};
  const inv = doc.investigation || {};
  const act = doc.actions || {};
  const co = doc.close_out || {};

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />}>
        <TouchableOpacity testID="detail-back" style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Back to incidents</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ref}>{doc.reference}</Text>
            <Text style={styles.title}>{doc.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{new Date(doc.created_at).toLocaleString("en-AU")}</Text>
              {doc.urgent ? <Pill label="URGENT" color={TOKENS.destructive} /> : null}
            </View>
          </View>
          <SeverityBadge value={doc.severity ?? null} />
        </View>

        <Card>
          <Eyebrow color={accent}>Lifecycle</Eyebrow>
          <View style={styles.lifecycle}>
            {STAGES.map((s) => {
              const ts = doc.stage_timestamps?.[s.key];
              const isDone = (doc.stages_done ?? []).includes(s.key) && s.key !== doc.stage;
              const isCurrent = s.key === doc.stage;
              return (
                <View key={s.key} style={styles.lifecycleRow}>
                  <View style={[styles.lcDot, isCurrent ? { backgroundColor: TOKENS.ink, borderColor: TOKENS.ink } : isDone ? { backgroundColor: "#059669", borderColor: "#059669" } : { backgroundColor: TOKENS.background, borderColor: TOKENS.border }]} />
                  <Text style={[styles.lcLabel, (isCurrent || isDone) ? { color: TOKENS.ink, fontWeight: "800" } : null]}>{s.label}</Text>
                  <Text style={styles.lcTs}>{ts ? new Date(ts).toLocaleDateString("en-AU") : "—"}</Text>
                </View>
              );
            })}
          </View>
          {doc.lifecycle?.overdue ? <Text style={styles.overdue}>This stage is overdue against its SLA.</Text> : null}
          <Text style={styles.totalDays}>Total open: {doc.lifecycle?.total_days ?? "—"} days</Text>
        </Card>

        <Card>
          <Eyebrow color={accent}>Submission</Eyebrow>
          <KV label="Description" value={sub.description || "—"} multiline />
          <KV label="Category" value={sub.category || "—"} />
          <KV label="Site" value={sub.site || "—"} />
          <KV label="Location" value={sub.site_location || "—"} />
          <KV label="State" value={sub.state || "—"} />
          <KV label="Date / Time" value={`${sub.date || "—"} ${sub.time || ""}`} />
          <KV label="Body parts" value={(sub.body_parts ?? []).join(", ") || "—"} />
          <KV label="Injury nature" value={(sub.injury_natures ?? []).join(", ") || "—"} />
          <KV label="Treatments" value={(sub.treatments ?? []).join(", ") || "—"} />
          <KV label="Witnessed?" value={sub.witnessed || "—"} />
          {(sub.photos ?? []).length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
              {(sub.photos ?? []).map((p, i) => (<Image key={i} source={{ uri: p }} style={styles.photo} />))}
            </ScrollView>
          ) : null}
        </Card>

        <StageCard
          title="Triage"
          accent={accent}
          completed={doc.stages_done?.includes("triage") || doc.stage !== "reported"}
          isCurrent={doc.stage === "triage"}
          ctaLabel={doc.stage === "reported" ? "Start triage" : "Edit triage"}
          onCta={() => router.push({ pathname: "/incident/triage/[id]", params: { id: doc.incident_id } })}
        >
          <KV label="Severity" value={tri.severity ? `Sev ${tri.severity}` : "—"} />
          <KV label="Notifiable" value={doc.notifiable ? "YES" : "no"} />
          <KV label="Category" value={doc.notifiable_category || "—"} />
          <KV label="Signed off by" value={tri.signed_off_by || "—"} />
          <KV label="Notes" value={tri.notes || "—"} multiline />
        </StageCard>

        <StageCard
          title="Investigation"
          accent={accent}
          completed={doc.stages_done?.includes("investigation")}
          isCurrent={doc.stage === "investigation"}
          ctaLabel={doc.stage === "investigation" ? "Continue investigation" : "Open investigation"}
          onCta={() => router.push({ pathname: "/incident/investigation/[id]", params: { id: doc.incident_id } })}
          disabled={!doc.stages_done?.includes("triage") && doc.stage !== "investigation"}
        >
          <KV label="Root cause" value={inv.root_cause || "—"} multiline />
          <KV label="Contributing factors" value={(inv.contributing_factors ?? []).join(", ") || "—"} />
          <KV label="Investigator" value={inv.investigator || "—"} />
        </StageCard>

        <StageCard
          title="Corrective actions"
          accent={accent}
          completed={doc.stages_done?.includes("actions")}
          isCurrent={doc.stage === "actions"}
          ctaLabel={doc.stage === "actions" ? "Continue actions" : "Open actions"}
          onCta={() => router.push({ pathname: "/incident/actions/[id]", params: { id: doc.incident_id } })}
          disabled={!doc.stages_done?.includes("investigation") && doc.stage !== "actions"}
        >
          <KV label="Short term" value={(act.short_term ?? []).map((a: any) => a.action || a).join("; ") || "—"} multiline />
          <KV label="Long term" value={(act.long_term ?? []).map((a: any) => a.action || a).join("; ") || "—"} multiline />
          <KV label="Linked risk" value={doc.linked_risk_id || "—"} />
          <KV label="Worker comms" value={act.worker_communication || "—"} multiline />
        </StageCard>

        <StageCard
          title="Close-out"
          accent={accent}
          completed={doc.stage === "closed"}
          isCurrent={false}
          ctaLabel={doc.stage === "closed" ? "Re-open" : "Close out"}
          onCta={doc.stage === "closed" ? reopen : () => router.push({ pathname: "/incident/close-out/[id]", params: { id: doc.incident_id } })}
          disabled={doc.stage !== "actions" && doc.stage !== "closed"}
        >
          <KV label="Lessons learned" value={co.lessons_learned || "—"} multiline />
          <KV label="Signed off by" value={co.signed_off_by || "—"} />
          <KV label="Signed off at" value={co.signed_off_at ? new Date(co.signed_off_at).toLocaleString("en-AU") : "—"} />
        </StageCard>

        <Card>
          <Eyebrow color={accent}>Audit log</Eyebrow>
          {(doc.audit_log ?? []).length === 0 ? <Text style={styles.empty}>No audit entries yet.</Text> : null}
          {(doc.audit_log ?? []).slice().reverse().map((a, i) => (
            <View key={i} style={styles.auditRow}>
              <Text style={styles.auditAt}>{new Date(a.at).toLocaleString("en-AU")}</Text>
              <Text style={styles.auditWho}>{a.user_name || a.user_id}</Text>
              <Text style={styles.auditWhat}>{a.field} {a.new !== undefined ? `→ ${typeof a.new === "string" ? a.new : JSON.stringify(a.new)}` : ""}</Text>
            </View>
          ))}
        </Card>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function KV({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue} numberOfLines={multiline ? undefined : 1}>{value || "—"}</Text>
    </View>
  );
}

function StageCard({ title, accent, completed, isCurrent, ctaLabel, onCta, disabled, children }: { title: string; accent: string; completed?: boolean; isCurrent?: boolean; ctaLabel: string; onCta: () => void; disabled?: boolean; children: React.ReactNode; }) {
  return (
    <Card>
      <View style={styles.stageHeader}>
        <Eyebrow color={accent}>{title}</Eyebrow>
        {completed ? <Pill label="DONE" color="#059669" /> : isCurrent ? <Pill label="CURRENT" color={TOKENS.ink} /> : null}
      </View>
      {children}
      <View style={{ height: 10 }} />
      {disabled ? (
        <Text style={styles.gated}>Complete the previous stage to unlock.</Text>
      ) : (
        <PrimaryButton testID={`stage-cta-${title.toLowerCase().replace(/[^a-z]/g, "-")}`} label={ctaLabel} onPress={onCta} accent={accent} iconName="arrow-forward" />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 4 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  ref: { fontFamily: MONO, fontWeight: "800", fontSize: 12, color: TOKENS.ink, letterSpacing: 1.2 },
  title: { color: TOKENS.ink, fontSize: 22, fontWeight: "800", marginTop: 4, marginRight: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8, flexWrap: "wrap" as any },
  meta: { color: COLORS.textSecondary, fontSize: 12 },
  lifecycle: { marginTop: 6 },
  lifecycleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: TOKENS.border },
  lcDot: { width: 12, height: 12, borderWidth: 1, marginRight: 12 },
  lcLabel: { flex: 1, color: COLORS.textSecondary, fontSize: 13 },
  lcTs: { color: COLORS.textMuted, fontSize: 11 },
  overdue: { color: TOKENS.destructive, fontSize: 12, marginTop: 8, fontWeight: "700" },
  totalDays: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
  kv: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: TOKENS.border, flexDirection: "row", alignItems: "flex-start" },
  kvLabel: { color: COLORS.textMuted, fontSize: 12, width: 130, flexShrink: 0 },
  kvValue: { flex: 1, color: TOKENS.ink, fontSize: 13, fontWeight: "500" },
  photo: { width: 84, height: 84, borderWidth: 1, borderColor: TOKENS.border },
  stageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  gated: { color: COLORS.textMuted, fontSize: 12, fontStyle: "italic", textAlign: "center" },
  auditRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: TOKENS.border },
  auditAt: { color: COLORS.textMuted, fontSize: 10, fontFamily: MONO },
  auditWho: { color: TOKENS.ink, fontSize: 12, fontWeight: "700", marginTop: 2 },
  auditWhat: { color: COLORS.textSecondary, fontSize: 12, marginTop: 1 },
  empty: { color: COLORS.textMuted, fontSize: 12, paddingVertical: 4 },
});
