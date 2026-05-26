// Compliance Inbox — /api/notifications. Mark single + mark-all-read.
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Notification, NotificationsApi } from "@/src/api/safebase";
import { Card, EmptyState, MONO, ScreenHeader, SecondaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

function toneFor(n: Notification): { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap } {
  const t = n.tone || n.severity || n.tag || "info";
  if (t === "critical" || t === "error") return { bg: "#FEE2E2", fg: "#B91C1C", icon: "alert-circle" };
  if (t === "expiry" || t === "warning") return { bg: "#FEF3C7", fg: "#B45309", icon: "warning" };
  return { bg: "#EFF6FF", fg: "#1E40AF", icon: "information-circle" };
}

export default function NotificationsInbox() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setRows(await NotificationsApi.list()); }
    catch (e: any) { setError(e?.detail ?? "Could not load notifications."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const markAll = async () => {
    try { await NotificationsApi.markAllRead(); load(); }
    catch (e: any) { Alert.alert("Failed", e?.detail ?? ""); }
  };

  const open = async (n: Notification) => {
    if (n.notification_id && !n.read) {
      try { await NotificationsApi.markRead(n.notification_id); } catch { /* noop */ }
    }
    if (n.incident_id) router.push({ pathname: "/incident/[id]", params: { id: n.incident_id } });
    else if (n.link?.includes("licences")) router.push("/licences");
    else if (n.link?.includes("incidents")) router.push("/incident");
    else if (n.link?.includes("risks")) router.push("/risk");
    else load();
  };

  const unread = rows.filter((r) => !r.read).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />}>
        <TouchableOpacity testID="notif-back" style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Compliance" title="Inbox" subtitle={`${rows.length} total · ${unread} unread`} accent={accent} />
        {unread > 0 ? <SecondaryButton testID="notif-mark-all" label="Mark all read" onPress={markAll} iconName="checkmark-done" /> : null}
        <View style={{ height: 12 }} />

        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 30 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : rows.length === 0 ? (
          <EmptyState icon="mail-open-outline" title="Inbox empty" body="Compliance events will appear here as they happen." />
        ) : rows.map((n, i) => {
          const tone = toneFor(n);
          return (
            <TouchableOpacity key={n.notification_id ?? i} testID={`notif-row-${i}`} activeOpacity={0.85} onPress={() => open(n)} style={[styles.row, n.read ? { opacity: 0.7 } : null]}>
              <View style={[styles.icon, { backgroundColor: tone.bg }]}><Ionicons name={tone.icon} size={18} color={tone.fg} /></View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.title} numberOfLines={1}>{n.title}</Text>
                  {!n.read ? <View style={[styles.dot, { backgroundColor: accent }]} /> : null}
                </View>
                <Text style={styles.body} numberOfLines={2}>{n.body}</Text>
                <Text style={styles.meta}>{n.created_at ? new Date(n.created_at).toLocaleString("en-AU") : "—"} · {(n.tag || n.type || "info").toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  row: { flexDirection: "row", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10, backgroundColor: TOKENS.background },
  icon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: TOKENS.ink, fontSize: 14, fontWeight: "700", flex: 1, marginRight: 6 },
  body: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 },
  meta: { color: COLORS.textMuted, fontSize: 10, marginTop: 6, fontFamily: MONO, letterSpacing: 0.6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  err: { color: TOKENS.destructive, fontSize: 14 },
});
