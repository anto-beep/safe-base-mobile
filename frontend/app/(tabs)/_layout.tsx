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
const CaptureIcon = iconRenderer("add-circle-outline");
const InboxIcon = iconRenderer("notifications-outline");
const ChatIcon = iconRenderer("chatbubble-ellipses-outline");
const ProfileIcon = iconRenderer("person-circle-outline");

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
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: HomeIcon, tabBarTestID: "tab-home" }} />
      <Tabs.Screen name="capture" options={{ title: "Capture", tabBarIcon: CaptureIcon, tabBarTestID: "tab-capture" }} />
      <Tabs.Screen name="notifications" options={{ title: "Inbox", tabBarIcon: InboxIcon, tabBarTestID: "tab-notifications" }} />
      <Tabs.Screen name="chat" options={{ title: "Concierge", tabBarIcon: ChatIcon, tabBarTestID: "tab-chat" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ProfileIcon, tabBarTestID: "tab-profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.appBg },
});
