// Admin KPI — pulls /internal-admin/dashboard/kpi and shows headline numbers + the activity feed.

import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/src/components/Logo";
import { Card, Eyebrow, MONO } from "@/src/components/ui";
import { adminApiGet, useAdminAuth } from "@/src/context/AdminAuthContext";
import { COLORS } from "@/src/theme/colors";

interface KPI {
  total_accounts?: number;
  active_trials?: number;
  mrr_aud?: number;
  signups_this_week?: number;
  open_demos?: number;
  active_subscriptions?: number;
  [k: string]: any;
}

export default function AdminKpi() {
  const { admin } = useAdminAuth();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [k, f] = await Promise.allSettled([
        adminApiGet<KPI>("/internal-admin/dashboard/kpi"),
        adminApiGet<any>("/internal-admin/dashboard/activity-feed"),
      ]);
      if (k.status === "fulfilled") setKpi(k.value);
      if (f.status === "fulfilled") {
        const items = (f.value as any)?.items ?? (f.value as any)?.feed ?? f.value ?? [];
        setFeed(Array.isArray(items) ? items.slice(0, 8) : []);
      }
    } catch (e: any) {
      setError(e?.detail ?? "Couldn't load KPIs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><ActivityIndicator color={COLORS.warning} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={COLORS.warning} />}
        testID="admin-kpi-scroll"
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Logo size={22} showWordmark />
        </View>
        <Eyebrow color={COLORS.warning}>Internal admin</Eyebrow>
        <Text style={styles.title}>SafeBase HQ.</Text>
        {admin ? <Text style={styles.sub}>{admin.name ?? admin.email} · {admin.rank ?? "viewer"}</Text> : null}

        <View style={{ height: 18 }} />

        <View style={styles.kpiGrid}>
          <KpiTile label="Total accounts" value={kpi?.total_accounts ?? 0} />
          <KpiTile label="Active trials" value={kpi?.active_trials ?? 0} />
          <KpiTile label="MRR (A$)" value={kpi?.mrr_aud ?? 0} prefix="$" />
          <KpiTile label="Signups / wk" value={kpi?.signups_this_week ?? 0} />
          <KpiTile label="Open demos" value={kpi?.open_demos ?? 0} />
          <KpiTile label="Active subs" value={kpi?.active_subscriptions ?? 0} />
        </View>

        <Card>
          <Eyebrow color={COLORS.textSecondary}>Recent activity</Eyebrow>
          {feed.length === 0 ? (
            <Text style={styles.body}>{error ?? "No activity yet."}</Text>
          ) : (
            feed.map((f: any, idx: number) => (
              <View key={idx} style={styles.feedRow}>
                <Text style={styles.feedTitle} numberOfLines={1}>{f.title ?? f.event ?? f.action ?? "Event"}</Text>
                <Text style={styles.feedSub} numberOfLines={1}>{f.actor ?? f.email ?? ""} · {f.created_at ?? ""}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiTile({ label, value, prefix }: { label: string; value: number; prefix?: string }) {
  return (
    <View style={styles.kpiTile} testID={`admin-kpi-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{prefix ?? ""}{typeof value === "number" ? value.toLocaleString() : value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "800", letterSpacing: -0.4, marginTop: 6 },
  sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2, fontFamily: MONO },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, marginBottom: 6 },
  kpiTile: { width: "50%", paddingHorizontal: 6, marginBottom: 12 },
  kpiLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", fontFamily: MONO },
  kpiValue: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "800", marginTop: 4, fontFamily: MONO },
  body: { color: COLORS.textSecondary, fontSize: 14, marginTop: 6 },
  feedRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  feedTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600" },
  feedSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontFamily: MONO },
});
