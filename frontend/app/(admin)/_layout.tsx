import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAdminAuth } from "@/src/context/AdminAuthContext";
import { COLORS } from "@/src/theme/colors";

const iconRenderer = (name: keyof typeof Ionicons.glyphMap) =>
  function AdminTabIcon({ color, size }: { color: string; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };

const Kpi = iconRenderer("speedometer-outline");
const Accts = iconRenderer("business-outline");
const Subs = iconRenderer("card-outline");
const Flags = iconRenderer("flag-outline");
const Audit = iconRenderer("file-tray-full-outline");

export default function AdminLayout() {
  const { admin, ready } = useAdminAuth();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={COLORS.warning} size="large" />
      </View>
    );
  }

  if (!admin) return <Redirect href="/admin-login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.appBg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.warning,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "KPI", tabBarIcon: Kpi, tabBarTestID: "admin-tab-kpi" }} />
      <Tabs.Screen name="accounts" options={{ title: "Accounts", tabBarIcon: Accts, tabBarTestID: "admin-tab-accounts" }} />
      <Tabs.Screen name="subscriptions" options={{ title: "Subs", tabBarIcon: Subs, tabBarTestID: "admin-tab-subs" }} />
      <Tabs.Screen name="feature-flags" options={{ title: "Flags", tabBarIcon: Flags, tabBarTestID: "admin-tab-flags" }} />
      <Tabs.Screen name="audit-logs" options={{ title: "Audit", tabBarIcon: Audit, tabBarTestID: "admin-tab-audit" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.appBg },
});
