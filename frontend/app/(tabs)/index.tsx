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
import { Card, Eyebrow, MONO, Pill } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS, INDUSTRY_LABEL, INDUSTRY_TAGLINE, Industry } from "@/src/theme/colors";

interface ScorePayload {
  score?: number;
  band?: string;
  open_actions?: number;
  expiring_credentials?: number;
}

interface NotificationItem {
  id?: string;
  notification_id?: string;
  title?: string;
  body?: string;
  message?: string;
  unread?: boolean;
  read?: boolean;
  cta_path?: string;
  created_at?: string;
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState<ScorePayload | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const industry = (user?.industry as Industry | undefined) ?? "trades";
  const accent = accentFor(industry);

  const load = useCallback(async () => {
    const [s, n] = await Promise.allSettled([
      api.get<ScorePayload>("/compliance/score"),
      api.get<{ items?: NotificationItem[]; notifications?: NotificationItem[] }>("/notifications"),
    ]);
    if (s.status === "fulfilled") setScore(s.value);
    if (n.status === "fulfilled") {
      const list = (n.value as any)?.items ?? (n.value as any)?.notifications ?? [];
      setUnreadCount(list.filter((x: NotificationItem) => x.unread || !x.read).length);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = (user?.name ?? "").split(" ")[0] || "there";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
        testID="home-scroll"
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Eyebrow color={accent}>{INDUSTRY_LABEL[industry]}</Eyebrow>
            <Text style={styles.greeting}>G&apos;day, {firstName}.</Text>
            <Text style={styles.tagline}>{INDUSTRY_TAGLINE[industry]}</Text>
          </View>
          <TouchableOpacity
            testID="home-notifications-shortcut"
            style={styles.bellWrap}
            onPress={() => router.push("/(tabs)/notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: accent }]} testID="home-unread-badge">
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : String(unreadCount)}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Compliance score */}
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

        {/* Industry alert tile */}
        <IndustryAlertTile industry={industry} accent={accent} />

        {/* Quick actions */}
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

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  greeting: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  tagline: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  bellWrap: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: COLORS.appBg, fontSize: 10, fontWeight: "800" },
  scoreRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  scoreNum: { fontSize: 64, fontWeight: "800", letterSpacing: -2, fontFamily: MONO },
  scoreMeta: { flex: 1, marginLeft: 18 },
  scoreLine: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, marginTop: 8 },
  quickCard: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  quickTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  quickSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
