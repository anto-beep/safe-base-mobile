import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { usePushRegistration } from "@/src/hooks/usePush";
import { accentFor, COLORS } from "@/src/theme/colors";

// Defined outside the screen so React keeps a stable component identity per tab.
const iconRenderer = (name: keyof typeof Ionicons.glyphMap) =>
  function TabIcon({ color, size }: { color: string; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };

const HomeIcon = iconRenderer("grid-outline");
const ModulesIcon = iconRenderer("apps-outline");
const CaptureIcon = iconRenderer("add-circle-outline");
const SettingsIcon = iconRenderer("settings-outline");

export default function TabsLayout() {
  const { user, ready } = useAuth();

  // Wire push notifications once the user is signed in.
  usePushRegistration(!!user);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={COLORS.warning} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  const accent = accentFor(user.industry);
  // Workers (any industry) get a simplified tab set — Modules is hidden
  // and Capture becomes the primary action surface. We read role_variant
  // (returned by /api/auth/register and /api/auth/login) because `role`
  // is the workspace permission role and is always "owner" for the user
  // who created the workspace.
  const variant = (user.role_variant ?? user.role ?? "").toString().toLowerCase();
  const isWorker = variant === "worker";

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
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: HomeIcon, tabBarTestID: "tab-home" }} />
      <Tabs.Screen
        name="modules"
        options={{
          title: "Modules",
          tabBarIcon: ModulesIcon,
          tabBarTestID: "tab-modules",
          // Workers don't see modules — empty/hidden tab.
          href: isWorker ? null : undefined,
        }}
      />
      <Tabs.Screen name="capture" options={{ title: "Capture", tabBarIcon: CaptureIcon, tabBarTestID: "tab-capture" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: SettingsIcon, tabBarTestID: "tab-settings" }} />
      {/* Profile is now nested under Settings — keep the route addressable from
          deeplinks/legacy code but hide the tab. */}
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.appBg },
});
