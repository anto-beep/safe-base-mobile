import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { IndustryAlertTile } from "@/src/components/IndustryAlertTile";
import { IndustrySwitcher } from "@/src/components/IndustrySwitcher";
import { Logo } from "@/src/components/Logo";
import { Card, Eyebrow, MONO, Pill } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useNotificationPolling } from "@/src/hooks/useNotificationPolling";
import { accentFor, COLORS, INDUSTRY_LABEL, INDUSTRY_TAGLINE, Industry, TOKENS } from "@/src/theme/colors";

interface ScorePayload {
  score?: number;
  band?: string;
  open_actions?: number;
  expiring_credentials?: number;
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
      <View style={[styles.headerBar, { backgroundColor: TOKENS.ink, borderBottomColor: TOKENS.ink }]}>
        <Logo size={26} showWordmark invert testID="home-logo" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <IndustrySwitcher />
          <TouchableOpacity
            testID="home-notifications-shortcut"
            style={[styles.bellWrap, { borderColor: "#FFFFFF22" }]}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: accent }]} testID="home-unread-badge">
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : String(unreadCount)}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {isWorker ? <WorkerHome accent={accent} /> : <OwnerHome accent={accent} industry={industry} />}
    </SafeAreaView>
  );
}

function OwnerHome({ industry, accent }: { industry: Industry; accent: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState<ScorePayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await api.get<ScorePayload>("/compliance/score");
      setScore(s);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const firstName = (user?.name ?? "").split(" ")[0] || "there";

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={accent} />}
      testID="home-scroll"
    >
      <Eyebrow color={accent}>{INDUSTRY_LABEL[industry]}</Eyebrow>
      <Text style={styles.greeting}>G&apos;day, {firstName}.</Text>
      <Text style={styles.tagline}>{INDUSTRY_TAGLINE[industry]}</Text>

      <View style={{ height: 18 }} />

      <Card testID="home-score-card">
        <Eyebrow color={accent}>Compliance score</Eyebrow>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreNum, { color: accent }]}>
            {typeof score?.score === "number" ? Math.round(score.score) : "—"}
          </Text>
          <View style={styles.scoreMeta}>
            <Pill label={score?.band ?? "Live"} color={accent} />
            <View style={{ height: 8 }} />
            <Text style={styles.scoreLine}>
              {(score?.open_actions ?? 0)} open actions · {(score?.expiring_credentials ?? 0)} credentials expiring
            </Text>
          </View>
        </View>
      </Card>

      <IndustryAlertTile industry={industry} accent={accent} />

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
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  content: { padding: 20 },
  greeting: { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, marginTop: 6 },
  tagline: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  bellWrap: { width: 40, height: 40, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", position: "relative" },
  badge: { position: "absolute", top: -6, right: -6, minWidth: 20, paddingHorizontal: 4, paddingVertical: 2, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  scoreRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  scoreNum: { fontSize: 64, fontWeight: "800", letterSpacing: -2, fontFamily: MONO },
  scoreMeta: { flex: 1, marginLeft: 18 },
  scoreLine: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
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
