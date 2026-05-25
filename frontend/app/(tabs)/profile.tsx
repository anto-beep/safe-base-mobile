import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/src/components/Logo";
import { Card, Eyebrow, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import {
  biometricCapability,
  disableBiometric,
  enableBiometric,
  isBiometricEnabled,
} from "@/src/hooks/useBiometric";
import { deregisterPush } from "@/src/hooks/usePush";
import { accentFor, COLORS, INDUSTRY_ACCENT, INDUSTRY_LABEL, Industry } from "@/src/theme/colors";
import { useEffect } from "react";

export default function Profile() {
  const { user, logout, setActiveIndustry } = useAuth();
  const router = useRouter();
  const accent = accentFor(user?.industry);

  const activeIndustry = (user?.industry as Industry | undefined) ?? "trades";
  const availableIndustries: Industry[] =
    (user?.industries as Industry[] | undefined) && user!.industries!.length
      ? (user!.industries as Industry[])
      : [activeIndustry];
  const canSwitch = availableIndustries.length > 1;

  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioType, setBioType] = useState("biometric");

  useEffect(() => {
    (async () => {
      const cap = await biometricCapability();
      setBioAvailable(cap.available && cap.enrolled);
      setBioType(cap.type === "face" ? "Face ID" : cap.type === "fingerprint" ? "fingerprint" : "biometric");
      setBioEnabled(await isBiometricEnabled());
    })();
  }, []);

  const toggleBiometric = async () => {
    if (bioEnabled) {
      await disableBiometric();
      setBioEnabled(false);
      return;
    }
    const r = await enableBiometric();
    if (r.ok) {
      setBioEnabled(true);
      Alert.alert("Enabled", `${bioType} sign-in is now active. We'll auto-prompt next time you launch SafeBase.`);
    } else if (r.reason) {
      Alert.alert("Couldn't enable", r.reason);
    }
  };

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

  const handleSwitch = async (i: Industry) => {
    if (i === activeIndustry) return;
    await setActiveIndustry(i);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identityRow}>
          <Logo size={48} showWordmark={false} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Eyebrow color={accent}>Profile</Eyebrow>
            <Text style={styles.name} numberOfLines={1}>{user?.name ?? user?.email ?? "Account"}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        <Card>
          <Eyebrow color={COLORS.textSecondary}>Workspace</Eyebrow>
          <KV label="Company" value={user?.company_name ?? "—"} />
          <KV label="Role" value={(user?.role ?? "owner").toUpperCase()} />
          <KV label="Industry" value={INDUSTRY_LABEL[activeIndustry]} />
          <KV label="Subscription" value={(user?.subscription_status ?? "trial").toUpperCase()} />
        </Card>

        {canSwitch ? (
          <Card>
            <Eyebrow color={COLORS.textSecondary}>Switch active industry</Eyebrow>
            {availableIndustries.map((i) => {
              const a = INDUSTRY_ACCENT[i];
              const active = i === activeIndustry;
              return (
                <TouchableOpacity
                  key={i}
                  testID={`profile-switch-${i}`}
                  onPress={() => handleSwitch(i)}
                  activeOpacity={0.85}
                  style={[
                    styles.switchRow,
                    { borderColor: active ? a : COLORS.border, backgroundColor: active ? `${a}1A` : "transparent" },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: a }]} />
                  <Text style={[styles.switchLabel, { color: active ? COLORS.textPrimary : COLORS.textSecondary }]}>
                    {INDUSTRY_LABEL[i]}
                  </Text>
                  {active ? <Ionicons name="checkmark" size={18} color={a} /> : null}
                </TouchableOpacity>
              );
            })}
          </Card>
        ) : null}

        <Card>
          <Eyebrow color={COLORS.textSecondary}>Security</Eyebrow>
          {bioAvailable ? (
            <TouchableOpacity
              testID="profile-biometric-toggle"
              onPress={toggleBiometric}
              activeOpacity={0.85}
              style={[styles.toggleRow, { borderColor: bioEnabled ? accent : COLORS.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Unlock with {bioType}</Text>
                <Text style={styles.toggleSub}>
                  {bioEnabled ? "Active — we'll auto-prompt on launch." : "Skip the password next time."}
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: bioEnabled ? accent : COLORS.border }]}>
                <View
                  style={[styles.thumb, { backgroundColor: COLORS.appBg, alignSelf: bioEnabled ? "flex-end" : "flex-start" }]}
                />
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.note}>Device biometrics aren&apos;t set up — enable them in iOS / Android settings to use Face ID or fingerprint sign-in here.</Text>
          )}
        </Card>

        <Card>
          <Eyebrow color={COLORS.textSecondary}>Notifications</Eyebrow>
          <Text style={styles.note}>
            Push tokens are registered automatically after sign-in. We&apos;ll alert you about regulator deadlines,
            missed check-ins and team activity.
          </Text>
        </Card>

        <Card>
          <Eyebrow color={COLORS.textSecondary}>About</Eyebrow>
          <KV label="Build" value="SafeBase Mobile · 1.1" />
          <KV label="API" value={(process.env.EXPO_PUBLIC_SAFEBASE_API ?? "").replace(/^https?:\/\//, "") || "—"} />
        </Card>

        <View style={{ height: 18 }} />
        <SecondaryButton
          testID="profile-help-button"
          label="Talk to support"
          onPress={() => router.push("/chat")}
          iconName="chatbubble-ellipses-outline"
        />
        <View style={{ height: 12 }} />
        <PrimaryButton
          testID="profile-logout-button"
          label="Sign out"
          onPress={handleLogout}
          accent={COLORS.error}
        />
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  identityRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 2 },
  email: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  kvRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  kvLabel: { color: COLORS.textMuted, fontSize: 13 },
  kvValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  switchRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, marginTop: 8 },
  dot: { width: 10, height: 10, marginRight: 12 },
  switchLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  note: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  toggleRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, marginTop: 8 },
  toggleLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  toggleSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  track: { width: 44, height: 22, padding: 2, marginLeft: 12 },
  thumb: { width: 18, height: 18 },
});
