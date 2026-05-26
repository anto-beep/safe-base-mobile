// Settings tab — single landing for Profile, Business, Team, Billing,
// Notifications, Onboarding, Security & Sign-out. Replaces the old Profile
// tab (per user B2 choice: 4 tabs total).

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/src/components/Logo";
import { Card, Eyebrow, ScreenHeader, SecondaryButton, Pill } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useBilling, ALL_INDUSTRIES } from "@/src/context/BillingContext";
import { disableBiometric } from "@/src/hooks/useBiometric";
import { deregisterPush } from "@/src/hooks/usePush";
import { accentFor, COLORS, INDUSTRY_LABEL, TOKENS } from "@/src/theme/colors";

interface Row {
  id: string;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}

const ACCOUNT: Row[] = [
  { id: "profile", label: "Profile", sub: "Your account, security & industry switcher", icon: "person-outline", href: "/profile" },
  { id: "business", label: "Business profile", sub: "ABN, address, ANZSIC", icon: "business-outline", href: "/settings/business" },
  { id: "team", label: "Team & invites", sub: "Roles + access", icon: "people-outline", href: "/settings/team" },
  { id: "onboarding", label: "Onboarding checklist", sub: "Finish setup", icon: "checkmark-circle-outline", href: "/settings/onboarding" },
];

const PLAN: Row[] = [
  { id: "billing", label: "Billing & plan", sub: "Trials, subscriptions, invoices", icon: "card-outline", href: "/billing" },
  { id: "notifs", label: "Notification preferences", sub: "Channels, schedules, digests", icon: "notifications-outline", href: "/settings/notifications" },
];

export default function SettingsTab() {
  const { user, logout } = useAuth();
  const { subscriptions, earliestExpiringTrial, statusFor } = useBilling();
  const router = useRouter();
  const accent = accentFor(user?.industry);

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await deregisterPush();
          await disableBiometric();
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  // Plan summary: number of active/trial industries
  const activeCount = ALL_INDUSTRIES.filter((i) => statusFor(i).unlocked).length;
  const trialCount = ALL_INDUSTRIES.filter((i) => statusFor(i).kind === "trial").length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identityRow}>
          <Logo size={40} showWordmark={false} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Eyebrow color={accent}>Settings</Eyebrow>
            <Text style={styles.name} numberOfLines={1}>{user?.name ?? user?.email ?? "Account"}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        {/* Plan summary card */}
        <Card>
          <View style={styles.cardHeader}>
            <Eyebrow color={accent}>Your plan</Eyebrow>
            <TouchableOpacity testID="settings-manage-billing" onPress={() => router.push("/billing" as any)}>
              <Text style={[styles.linkText, { color: accent }]}>Manage ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryRow}>
            <SummaryStat label="Unlocked" value={`${activeCount}/${ALL_INDUSTRIES.length}`} hint="industries" />
            <SummaryStat label="In trial" value={`${trialCount}`} hint="industries" />
            <SummaryStat label="Paid" value={`${subscriptions.filter((s) => (s.status ?? "").toLowerCase() === "active").length}`} hint="plans" />
          </View>
          {earliestExpiringTrial ? (
            <View style={styles.bannerInline}>
              <Ionicons name="gift-outline" size={14} color={TOKENS.authority} />
              <Text style={styles.bannerInlineText}>
                {earliestExpiringTrial.daysLeft} day{earliestExpiringTrial.daysLeft === 1 ? "" : "s"} left in your {INDUSTRY_LABEL[earliestExpiringTrial.industry]} trial
              </Text>
            </View>
          ) : null}
        </Card>

        <SectionList label="Account" accent={accent} rows={ACCOUNT} onOpen={(r) => router.push(r.href as any)} />
        <SectionList label="Plan & notifications" accent={accent} rows={PLAN} onOpen={(r) => router.push(r.href as any)} />

        <View style={{ height: 18 }} />
        <SecondaryButton
          testID="settings-help"
          label="Talk to support"
          onPress={() => router.push("/chat" as any)}
          iconName="chatbubble-ellipses-outline"
        />
        <View style={{ height: 12 }} />
        <TouchableOpacity
          testID="settings-logout"
          onPress={handleLogout}
          activeOpacity={0.85}
          style={[styles.logoutBtn, { borderColor: COLORS.error }]}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: COLORS.error }]}>Sign out</Text>
        </TouchableOpacity>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

function SectionList({
  label,
  accent,
  rows,
  onOpen,
}: {
  label: string;
  accent: string;
  rows: Row[];
  onOpen: (r: Row) => void;
}) {
  return (
    <View style={{ marginTop: 18 }}>
      <Eyebrow color={accent}>{label}</Eyebrow>
      <View style={{ marginTop: 6 }}>
        {rows.map((r) => (
          <TouchableOpacity
            key={r.id}
            testID={`settings-${r.id}`}
            onPress={() => onOpen(r)}
            activeOpacity={0.85}
            style={styles.row}
          >
            <View style={[styles.iconBox, { borderColor: accent }]}>
              <Ionicons name={r.icon} size={20} color={accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.rowTitle}>{r.label}</Text>
              <Text style={styles.rowSub}>{r.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  identityRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 2 },
  email: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  linkText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  statCol: { flex: 1, alignItems: "center" },
  statVal: { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800" },
  statLabel: { color: COLORS.textPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 2 },
  statHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  bannerInline: { flexDirection: "row", alignItems: "center", marginTop: 12, padding: 10, backgroundColor: `${TOKENS.authority}14`, borderWidth: 1, borderColor: TOKENS.authority },
  bannerInlineText: { color: TOKENS.authority, fontSize: 12, fontWeight: "700", marginLeft: 8, flexShrink: 1 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderWidth: 1 },
  logoutText: { fontSize: 14, fontWeight: "800", letterSpacing: 1 },
});
