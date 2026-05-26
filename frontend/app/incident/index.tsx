// Mobile Incident Register — 1:1 mirror of
// /tmp/safebase_ref/frontend/src/pages/incident/IncidentRegister.jsx.
// Same endpoints (/api/incident-workflow + /api/incident-workflow/stats),
// same stat tiles, same filters (search, stage, notifiable, severity).

import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Incident, Incidents, IncidentStats } from "@/src/api/incidents";
import { IncidentStageBar } from "@/src/components/IncidentStageBar";
import { SeverityBadge } from "@/src/components/SeverityBadge";
import { Card, EmptyState, Eyebrow, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { STAGES } from "@/src/constants/incident";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

type StageFilter = "__all__" | "reported" | "triage" | "investigation" | "actions" | "closed";
type NotifFilter = "__all__" | "only" | "no";

export default function IncidentRegisterScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [stage, setStage] = useState<StageFilter>("__all__");
  const [notif, setNotif] = useState<NotifFilter>("__all__");
  const [sev, setSev] = useState<string>("__all__");

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, s] = await Promise.all([Incidents.list(), Incidents.stats()]);
      setRows(r);
      setStats(s);
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Failed to load incidents.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (stage !== "__all__" && r.stage !== stage) return false;
      if (notif === "only" && !r.notifiable) return false;
      if (notif === "no" && r.notifiable) return false;
      if (sev !== "__all__" && String(r.severity ?? "") !== sev) return false;
      if (q) {
        const hay = `${r.title} ${r.reference} ${r.submission?.description ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, stage, notif, sev]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />}
      >
        <View style={styles.topRow}>
          <TouchableOpacity testID="incident-back" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        <ScreenHeader
          eyebrow="Safety"
          title="Incidents"
          subtitle="Five-stage workflow: Reported → Triage → Investigation → Actions → Closed."
          accent={accent}
        />

        <PrimaryButton
          testID="report-incident-btn"
          label="Report an incident"
          onPress={() => router.push("/incident/new")}
          accent={TOKENS.destructive}
          iconName="warning"
        />

        <View style={{ height: 16 }} />

        <View style={styles.statsGrid} testID="incident-stats">
          <Stat label="Total YTD" value={stats?.total_ytd ?? "—"} />
          <Stat label="Notifiable" value={stats?.notifiable ?? "—"} tint={(stats?.notifiable ?? 0) > 0 ? "#FEE2E2" : undefined} />
          <Stat label="Lost Time" value={stats?.lost_time ?? "—"} />
          <Stat label="Medical" value={stats?.medical_treatment ?? "—"} />
          <Stat label="Near Miss" value={stats?.near_miss ?? "—"} />
          <Stat label="First Aid" value={stats?.first_aid ?? "—"} />
          <Stat label="Avg days" value={stats?.avg_close_days ?? "—"} />
          <Stat label="Open > 30d" value={stats?.open_over_30 ?? "—"} tint={(stats?.open_over_30 ?? 0) > 0 ? "#FED7AA" : undefined} />
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            testID="incident-search"
            value={q}
            onChangeText={setQ}
            placeholder="Search by ref, title or description…"
            placeholderTextColor={COLORS.textMuted}
            style={styles.search}
          />
        </View>

        <View style={styles.filtersRow}>
          <FilterChip label="All stages" active={stage === "__all__"} onPress={() => setStage("__all__")} accent={accent} />
          {STAGES.map((s) => (
            <FilterChip
              key={s.key}
              label={s.label}
              active={stage === s.key}
              onPress={() => setStage(s.key as StageFilter)}
              accent={accent}
              testID={`filter-stage-${s.key}`}
            />
          ))}
        </View>
        <View style={styles.filtersRow}>
          <FilterChip label="Any" active={notif === "__all__"} onPress={() => setNotif("__all__")} accent={accent} />
          <FilterChip label="Notifiable" active={notif === "only"} onPress={() => setNotif("only")} accent={TOKENS.destructive} />
          <FilterChip label="Not notifiable" active={notif === "no"} onPress={() => setNotif("no")} accent={accent} />
        </View>
        <View style={styles.filtersRow}>
          <FilterChip label="Any sev" active={sev === "__all__"} onPress={() => setSev("__all__")} accent={accent} />
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <FilterChip key={n} label={`Sev ${n}`} active={sev === String(n)} onPress={() => setSev(String(n))} accent={accent} testID={`filter-sev-${n}`} />
          ))}
        </View>

        <View style={{ height: 12 }} />

        {loading ? (
          <View style={{ paddingVertical: 32 }}><ActivityIndicator color={accent} /></View>
        ) : error ? (
          <Card><Text style={styles.error}>{error}</Text></Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            testID="incident-empty"
            icon="shield-checkmark-outline"
            title="No incidents match"
            body="Refine your filters or tap ‘Report an incident’ to start the 5-stage workflow."
          />
        ) : (
          filtered.map((r) => <Row key={r.incident_id} row={r} accent={accent} onPress={() => router.push({ pathname: "/incident/[id]", params: { id: r.incident_id } })} />)
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, tint }: { label: string; value: number | string; tint?: string }) {
  return (
    <View style={[styles.statBox, tint ? { backgroundColor: tint } : null]} testID={`stat-${label}`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress, accent, testID }: { label: string; active: boolean; onPress: () => void; accent: string; testID?: string }) {
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.chip, { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : "transparent" }]}
    >
      <Text style={[styles.chipLabel, { color: active ? TOKENS.ink : COLORS.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({ row, accent, onPress }: { row: Incident; accent: string; onPress: () => void }) {
  const days = row.lifecycle?.total_days ?? 0;
  const overdue = row.lifecycle?.overdue;
  const dayColor = overdue ? TOKENS.destructive : days > 20 ? "#EA580C" : COLORS.textSecondary;
  return (
    <TouchableOpacity
      testID={`incident-row-${row.reference}`}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.row, row.urgent ? { backgroundColor: "#FEE2E2" } : null]}
    >
      <View style={styles.rowTop}>
        <Text style={styles.ref}>{row.reference}</Text>
        <SeverityBadge value={row.severity ?? null} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{row.title}</Text>
      <View style={styles.rowMeta}>
        <Text style={styles.meta}>{new Date(row.created_at).toLocaleDateString("en-AU")} · {row.site || "—"}</Text>
        {row.notifiable ? (
          <View style={styles.notifPill}><Ionicons name="warning" size={11} color="#FFFFFF" /><Text style={styles.notifText}>NOTIFIABLE</Text></View>
        ) : null}
      </View>
      <View style={styles.rowBottom}>
        <IncidentStageBar current={row.stage} stagesDone={row.stages_done ?? []} />
        <Text style={[styles.days, { color: dayColor }]}>{days}d{overdue ? " · overdue" : row.stage === "closed" ? " · closed" : ""}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  back: { padding: 4, minWidth: 32 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 16 },
  statBox: { width: "24%", marginHorizontal: "0.5%", marginBottom: 8, borderWidth: 1, borderColor: TOKENS.border, padding: 8 },
  statLabel: { fontFamily: MONO, color: COLORS.textMuted, fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase" },
  statValue: { color: TOKENS.ink, fontSize: 18, fontWeight: "900", marginTop: 4 },
  searchRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: TOKENS.border, paddingHorizontal: 12, marginBottom: 10 },
  search: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 14, color: COLORS.textPrimary },
  filtersRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  chip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6, minHeight: 32, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 12, fontWeight: "600" },
  row: { borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ref: { fontFamily: MONO, fontWeight: "800", fontSize: 12, color: TOKENS.ink },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700", marginTop: 6 },
  rowMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  meta: { color: COLORS.textSecondary, fontSize: 12 },
  notifPill: { flexDirection: "row", alignItems: "center", backgroundColor: TOKENS.destructive, paddingHorizontal: 6, paddingVertical: 2 },
  notifText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginLeft: 4 },
  rowBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  days: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  error: { color: TOKENS.destructive, fontSize: 14 },
});
