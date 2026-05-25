import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { EmptyState, Eyebrow, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS } from "@/src/theme/colors";

interface NotificationItem {
  id?: string;
  notification_id?: string;
  title?: string;
  body?: string;
  message?: string;
  unread?: boolean;
  read?: boolean;
  read_at?: string | null;
  cta_path?: string;
  created_at?: string;
  category?: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const accent = accentFor(user?.industry);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const resp = await api.get<any>("/notifications");
      const list: NotificationItem[] = resp?.items ?? resp?.notifications ?? resp ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.detail ?? "Unable to load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const markRead = async (n: NotificationItem) => {
    const id = n.notification_id ?? n.id;
    if (!id) return;
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((x) => ((x.notification_id ?? x.id) === id ? { ...x, read: true, unread: false } : x)),
      );
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setItems((prev) => prev.map((x) => ({ ...x, read: true, unread: false })));
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerPad}>
        <TouchableOpacity testID="notif-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <ScreenHeader
          eyebrow="Inbox"
          title="Notifications"
          subtitle="Industry alerts, regulator deadlines and team activity."
          accent={accent}
          right={
            items.some((x) => x.unread || !x.read) ? (
              <TouchableOpacity testID="notif-mark-all" onPress={markAllRead} style={styles.readAllBtn}>
                <Text style={[styles.readAllText, { color: accent }]}>READ ALL</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={accent} />
        </View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={items}
          keyExtractor={(item, idx) => String(item.notification_id ?? item.id ?? idx)}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }} tintColor={accent} />
          }
          ListEmptyComponent={
            error ? (
              <EmptyState
                testID="notif-error"
                icon="cloud-offline-outline"
                title="Couldn't load inbox"
                body={error}
              />
            ) : (
              <EmptyState
                testID="notif-empty"
                icon="checkmark-done-circle-outline"
                title="You're all clear"
                body="No notifications yet. We'll ping you here when SafeBase needs your attention."
              />
            )
          }
          renderItem={({ item, index }) => {
            const unread = item.unread || !item.read;
            return (
              <TouchableOpacity
                testID={`notif-row-${index}`}
                style={[styles.row, unread && { borderLeftColor: accent, borderLeftWidth: 4 }]}
                activeOpacity={0.85}
                onPress={() => {
                  markRead(item);
                  if (item.cta_path) router.push(item.cta_path as any);
                }}
              >
                <Ionicons
                  name={unread ? "notifications" : "notifications-outline"}
                  size={20}
                  color={unread ? accent : COLORS.textMuted}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title ?? "SafeBase update"}
                  </Text>
                  <Text style={styles.body} numberOfLines={3}>
                    {item.body ?? item.message ?? ""}
                  </Text>
                  {item.category ? <Eyebrow color={COLORS.textMuted}>{item.category}</Eyebrow> : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  headerPad: { padding: 20, paddingBottom: 0 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  readAllBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 6 },
  readAllText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  title: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  body: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
});
