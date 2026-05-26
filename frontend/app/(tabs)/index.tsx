import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { Incidents, Incident } from "@/src/api/incidents";
import { ComplianceApi, NotificationsApi, SafetyApi, WorkflowsApi, WorkflowSummary } from "@/src/api/safebase";
import { IndustryAlertTile } from "@/src/components/IndustryAlertTile";
import { IndustrySwitcher } from "@/src/components/IndustrySwitcher";
import { Logo } from "@/src/components/Logo";
import { SeverityBadge } from "@/src/components/SeverityBadge";
import { Card, EmptyState, Eyebrow, MONO, Pill } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useNotificationPolling } from "@/src/hooks/useNotificationPolling";
import { accentFor, COLORS, INDUSTRY_LABEL, INDUSTRY_TAGLINE, Industry, TOKENS } from "@/src/theme/colors";

// Compliance score sub-score returned by /api/compliance/score.
interface SubScore { key: string; label: string; weight: number; value: number }
interface ScorePayload {
  score?: number;
  band?: string;
  open_actions?: number;
  expiring_credentials?: number;
  sub_scores?: SubScore[];
  industry?: string;
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const industry = (user?.industry as Industry | undefined) ?? "trades";
  const accent = accentFor(industry);
  const isWorker = (user?.role ?? "").toLowerCase() === "worker";

  const { unreadCount } = useNotificationPolling(!!user);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Slim header bar — industry switcher + notifications bell. The
          SAFEBASE wordmark used to live here but was removed per design:
          the logged-in surface is industry-led, not brand-led. */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <IndustrySwitcher />
        </View>
        <TouchableOpacity
          testID="home-notifications-shortcut"
          style={[styles.bellWrap, { borderColor: COLORS.border }]}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          {unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: accent }]} testID="home-unread-badge">
              <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : String(unreadCount)}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {isWorker ? <WorkerHome accent={accent} /> : <OwnerHome accent={accent} industry={industry} />}
    </SafeAreaView>
  );
}

function OwnerHome({ industry, accent }: { industry: Industry; accent: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState<ScorePayload | null>(null);
  const [openIncidents, setOpenIncidents] = useState<Incident[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowSummary>({});
  const [safety, setSafety] = useState<Record<string, number>>({});
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    // Resolve every dashboard data source in parallel. Each one is wrapped
    // in its own try so one degraded endpoint doesn't blank the home tab.
    const safeRun = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);
    const [s, inc, wf, ss, notifs] = await Promise.all([
      safeRun(ComplianceApi.score(), null as any),
      safeRun(Incidents.list(), [] as Incident[]),
      safeRun(WorkflowsApi.summary(), {} as WorkflowSummary),
      safeRun(SafetyApi.summary(), {} as Record<string, number>),
      safeRun(NotificationsApi.list(), [] as any[]),
    ]);
    setScore(s);
    setOpenIncidents((inc as Incident[]).filter((x) => x.stage !== "closed").slice(0, 5));
    setWorkflows(wf);
    setSafety(ss);
    setUnread((notifs as any[]).filter((n: any) => !n.read).length);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const firstName = (user?.name ?? "").split(" ")[0] || "there";

  // Sum workflow KPIs across the catalog into one "in progress" stat.
  const workflowInProgress = Object.values(workflows).reduce((acc, v) => acc + (v?.in_progress ?? 0), 0);
  const workflowComplete = Object.values(workflows).reduce((acc, v) => acc + (v?.complete ?? 0), 0);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); }} tintColor={accent} />}
      testID="home-scroll"
    >
      <Eyebrow color={accent}>{INDUSTRY_LABEL[industry]}</Eyebrow>
      <Text style={styles.greeting}>G&apos;day, {firstName}.</Text>
      <Text style={styles.tagline}>{INDUSTRY_TAGLINE[industry]}</Text>

      <View style={{ height: 18 }} />

      {/* Block 1 — Industry Alert Tile (top, the actionable Iter57 signal) */}
      <IndustryAlertTile industry={industry} accent={accent} />

      {/* Block 2 — Stat KPI row */}
      <View style={styles.kpiRow} testID="home-kpis">
        <KpiTile testID="kpi-open-incidents" label="Open incidents" value={openIncidents.length} accent={accent} onPress={() => router.push("/incident")} />
        <KpiTile testID="kpi-workflows" label="Workflows live" value={workflowInProgress} accent={accent} onPress={() => router.push("/workflows")} />
        <KpiTile testID="kpi-credentials" label="Expiring soon" value={score?.expiring_credentials ?? 0} accent={accent} onPress={() => router.push("/licences")} />
        <KpiTile testID="kpi-unread" label="Inbox unread" value={unread} accent={accent} onPress={() => router.push("/notifications")} />
      </View>

      {/* Block 3 — Compliance score (large number + per-pillar breakdown) */}
      <Card testID="home-score-card">
        <View style={styles.scoreHeader}>
          <Eyebrow color={accent}>Compliance score</Eyebrow>
          {score?.band ? <Pill label={score.band.toUpperCase()} color={accent} /> : null}
        </View>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreNum, { color: accent }]}>
            {typeof score?.score === "number" ? Math.round(score.score) : loading ? "…" : "—"}
          </Text>
          <View style={styles.scoreMeta}>
            <Text style={styles.scoreLine}>
              {(score?.open_actions ?? 0)} open actions · {(score?.expiring_credentials ?? 0)} credentials expiring
            </Text>
            <Text style={styles.scoreLineSm}>{workflowComplete} workflows closed YTD · {safety.risks ?? 0} risks on register</Text>
          </View>
        </View>
        {(score?.sub_scores ?? []).length > 0 ? (
          <View style={styles.subScoreRow}>
            {(score?.sub_scores ?? []).map((p) => (
              <View key={p.key} style={styles.subScore} testID={`sub-${p.key}`}>
                <Text style={styles.subScoreLabel}>{p.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { backgroundColor: accent, width: `${Math.max(0, Math.min(100, p.value))}%` }]} />
                </View>
                <Text style={styles.subScoreValue}>{Math.round(p.value)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {/* Block 4 — Open this week (top 5 open incidents) */}
      <Card testID="home-open-incidents">
        <View style={styles.scoreHeader}>
          <Eyebrow color={accent}>Open this week</Eyebrow>
          <TouchableOpacity testID="home-incidents-all" onPress={() => router.push("/incident")}>
            <Text style={[styles.viewAll, { color: accent }]}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={accent} style={{ marginVertical: 16 }} />
        ) : openIncidents.length === 0 ? (
          <EmptyState icon="shield-checkmark-outline" title="Nothing open" body="Every incident is closed. Keep it that way." />
        ) : (
          openIncidents.map((i) => (
            <TouchableOpacity
              key={i.incident_id}
              testID={`home-incident-${i.reference}`}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/incident/[id]", params: { id: i.incident_id } })}
              style={styles.incidentRow}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.incidentRef}>{i.reference}</Text>
                <Text style={styles.incidentTitle} numberOfLines={1}>{i.title}</Text>
                <Text style={styles.incidentMeta}>{i.stage.toUpperCase()} · {i.lifecycle?.total_days ?? 0}d open</Text>
              </View>
              <SeverityBadge value={i.severity ?? null} />
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Block 5 — Quick capture row */}
      <Eyebrow color={COLORS.textSecondary}>Quick capture</Eyebrow>
      <View style={styles.grid}>
        {QUICK_ACTIONS[industry].map((q) => (
          <TouchableOpacity
            key={q.href}
            testID={`home-quick-${q.id}`}
            style={[styles.quickCard, { borderColor: COLORS.border }]}
            onPress={() => router.push(q.href as any)}
            activeOpacity={0.85}
          >
            <Ionicons name={q.icon as any} size={22} color={accent} />
            <Text style={styles.quickTitle}>{q.title}</Text>
            <Text style={styles.quickSub}>{q.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

function KpiTile({ testID, label, value, accent, onPress }: { testID: string; label: string; value: number; accent: string; onPress: () => void }) {
  return (
    <TouchableOpacity testID={testID} activeOpacity={0.85} onPress={onPress} style={styles.kpiTile}>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function WorkerHome({ accent }: { accent: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await api.get<any>("/worker/my-summary");
      setSummary(s);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const expiring: any[] = summary?.expiring_credentials ?? summary?.licences ?? [];
  const checkins: any[] = summary?.recent_checkins ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={accent} />}
      testID="worker-home-scroll"
    >
      <Eyebrow color={accent}>Worker</Eyebrow>
      <Text style={styles.greeting}>G&apos;day, {(user?.name ?? "").split(" ")[0] || "team"}.</Text>
      <Text style={styles.tagline}>Your shift in one glance.</Text>

      <View style={{ height: 18 }} />

      <Card testID="worker-credentials-card">
        <Eyebrow color={accent}>My credentials</Eyebrow>
        {expiring.length === 0 ? (
          <View style={styles.iconRow}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            <Text style={[styles.body, { marginLeft: 10 }]}>All current. Nothing expiring soon.</Text>
          </View>
        ) : (
          expiring.slice(0, 4).map((c: any, idx: number) => (
            <View key={idx} style={styles.workerRow}>
              <Text style={styles.workerLabel}>{c.licence_type ?? c.label ?? c.name ?? "Credential"}</Text>
              <Text style={[styles.workerSub, { color: COLORS.warning }]}>
                {c.expiry_date ? `Expires ${c.expiry_date}` : "Expiring soon"}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card testID="worker-checkins-card">
        <Eyebrow color={accent}>Recent check-ins</Eyebrow>
        {checkins.length === 0 ? (
          <Text style={styles.body}>No check-ins yet today.</Text>
        ) : (
          checkins.slice(0, 4).map((c: any, idx: number) => (
            <View key={idx} style={styles.workerRow}>
              <Text style={styles.workerLabel}>{c.location ?? c.type ?? "Check-in"}</Text>
              <Text style={styles.workerSub}>{c.created_at ?? c.timestamp ?? ""}</Text>
            </View>
          ))
        )}
      </Card>

      <Eyebrow color={COLORS.textSecondary}>Capture</Eyebrow>
      <View style={styles.grid}>
        <QuickTile id="incident" title="Incident" sub="Report now" icon="warning-outline" accent={accent} onPress={() => router.push("/capture/incident-report")} />
        <QuickTile id="checkin" title="My check-in" sub="Worker check-in" icon="checkmark-circle-outline" accent={accent} onPress={() => router.push("/capture/lone-worker-checkin")} />
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

function QuickTile({ id, title, sub, icon, accent, onPress }: { id: string; title: string; sub: string; icon: any; accent: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      testID={`worker-quick-${id}`}
      style={[styles.quickCard, { borderColor: COLORS.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={22} color={accent} />
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const QUICK_ACTIONS: Record<Industry, { id: string; title: string; sub: string; icon: string; href: string }[]> = {
  trades: [
    { id: "incident", title: "Incident", sub: "WorkSafe-ready", icon: "warning-outline", href: "/capture/incident-report" },
    { id: "swms", title: "SWMS sign-on", sub: "Pre-start", icon: "document-text-outline", href: "/capture/swms-signon" },
  ],
  hospitality: [
    { id: "temp", title: "Temp log", sub: "Fridge / hot-hold", icon: "thermometer-outline", href: "/capture/temperature-log" },
    { id: "incident", title: "Incident", sub: "Food/customer", icon: "warning-outline", href: "/capture/incident-report" },
  ],
  transport: [
    { id: "pretrip", title: "Pre-trip", sub: "HV inspection", icon: "construct-outline", href: "/capture/pretrip-inspection" },
    { id: "fitness", title: "Fitness for duty", sub: "Pre-shift", icon: "fitness-outline", href: "/capture/fitness-for-duty" },
  ],
  healthcare: [
    { id: "incident", title: "SIRS / NDIS", sub: "Report incident", icon: "medkit-outline", href: "/capture/incident-report" },
    { id: "temp", title: "Med fridge", sub: "Temperature log", icon: "thermometer-outline", href: "/capture/temperature-log" },
  ],
  retail: [
    { id: "lone", title: "Lone-worker", sub: "Check-in", icon: "shield-checkmark-outline", href: "/capture/lone-worker-checkin" },
    { id: "incident", title: "Store incident", sub: "Slip / customer", icon: "warning-outline", href: "/capture/incident-report" },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  headerBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.background },
  content: { padding: 20 },
  greeting: { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, marginTop: 6 },
  tagline: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  bellWrap: { width: 40, height: 40, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", position: "relative" },
  badge: { position: "absolute", top: -6, right: -6, minWidth: 20, paddingHorizontal: 4, paddingVertical: 2, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  kpiRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 12 },
  kpiTile: { flex: 1, marginHorizontal: 4, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center" },
  kpiValue: { fontSize: 22, fontWeight: "800", fontFamily: MONO },
  kpiLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "center" },
  scoreHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  scoreNum: { fontSize: 56, fontWeight: "800", letterSpacing: -2, fontFamily: MONO },
  scoreMeta: { flex: 1, marginLeft: 18 },
  scoreLine: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  scoreLineSm: { color: COLORS.textMuted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  subScoreRow: { marginTop: 14 },
  subScore: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderTopWidth: 1, borderTopColor: COLORS.border },
  subScoreLabel: { width: 110, color: COLORS.textSecondary, fontSize: 12 },
  barTrack: { flex: 1, height: 6, backgroundColor: COLORS.border, marginHorizontal: 8 },
  barFill: { height: 6 },
  subScoreValue: { color: COLORS.textPrimary, fontSize: 12, fontWeight: "700", width: 32, textAlign: "right", fontFamily: MONO },
  viewAll: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, fontFamily: MONO },
  incidentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  incidentRef: { color: COLORS.textMuted, fontSize: 10, fontFamily: MONO, letterSpacing: 0.8 },
  incidentTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700", marginTop: 2 },
  incidentMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 3, fontFamily: MONO, letterSpacing: 0.4 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, marginTop: 8 },
  quickCard: { width: "50%", paddingHorizontal: 6, marginBottom: 12 },
  quickTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 10 },
  quickSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  iconRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  body: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  workerRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  workerLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600" },
  workerSub: { color: COLORS.textMuted, fontSize: 12 },
});
