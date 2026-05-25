// Shared scaffold for every admin tab. Pulls a list endpoint and renders rows.

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/src/components/Logo";
import { EmptyState, Eyebrow } from "@/src/components/ui";
import { adminApiGet, useAdminAuth } from "@/src/context/AdminAuthContext";
import { COLORS } from "@/src/theme/colors";

interface Props {
  title: string;
  eyebrow: string;
  endpoint: string;
  primary: (x: any) => string;
  sub: (x: any) => string;
  tail?: (x: any) => string | null;
  testIdBase: string;
}

export function AdminListScreen({ title, eyebrow, endpoint, primary, sub, tail, testIdBase }: Props) {
  const { logout, admin } = useAdminAuth();
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const resp = await adminApiGet<any>(endpoint);
      const list = Array.isArray(resp)
        ? resp
        : (resp?.items ?? resp?.results ?? resp?.data ?? Object.values(resp ?? {}).find((v: any) => Array.isArray(v)) ?? []);
      setData(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.detail ?? "Couldn't load.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const onLogout = () => {
    Alert.alert("Sign out admin", "Sign out of the SafeBase admin?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out", style: "destructive", onPress: async () => {
          await logout();
          router.replace("/admin-login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Logo size={20} showWordmark={false} />
            <Eyebrow color={COLORS.warning}>  {eyebrow}</Eyebrow>
          </View>
          <Text style={styles.title}>{title}</Text>
          {admin?.email ? <Text style={styles.sub}>{admin.email} · {admin.rank ?? "viewer"}</Text> : null}
        </View>
        <TouchableOpacity testID={`${testIdBase}-logout`} onPress={onLogout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.warning} /></View>
      ) : (
        <FlatList
          testID={`${testIdBase}-list`}
          data={data ?? []}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={COLORS.warning} />}
          ListEmptyComponent={
            error ? <EmptyState icon="cloud-offline-outline" title="Couldn't load" body={error} /> : <EmptyState icon="checkmark-circle-outline" title="No records" />
          }
          renderItem={({ item, index }) => (
            <View testID={`${testIdBase}-row-${index}`} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowPrimary} numberOfLines={1}>{primary(item)}</Text>
                {sub(item) ? <Text style={styles.rowSub} numberOfLines={2}>{sub(item)}</Text> : null}
              </View>
              {tail?.(item) ? (
                <View style={styles.tail}>
                  <Text style={styles.tailText}>{tail(item)}</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  header: { flexDirection: "row", alignItems: "flex-start", padding: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: "800" },
  sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2, fontFamily: "monospace" },
  logout: { width: 40, height: 40, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  rowPrimary: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  tail: { borderWidth: 1, borderColor: COLORS.warning, paddingHorizontal: 8, paddingVertical: 4 },
  tailText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, color: COLORS.warning },
});
