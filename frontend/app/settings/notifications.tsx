// Verified parity with NotificationPrefsIn in /tmp/safebase-src/backend/server.py:741.
// Field defaults verbatim: credential_expiry_days [60, 30, 14, 7], threshold 70, weekly_summary true.

import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { Card, Eyebrow, PrimaryButton } from "@/src/components/ui";
import { useAccent, TOKENS } from "@/src/theme/colors";

type Delivery = "email" | "sms" | "both" | "inapp";
type Digest = "immediate" | "weekly" | "monthly";

interface Prefs {
  credential_expiry_days: number[];
  credential_delivery: Delivery;
  incident_score_threshold: number;
  weekly_summary: boolean;
  legislative_digest: Digest;
}

const DEFAULT: Prefs = {
  credential_expiry_days: [60, 30, 14, 7],
  credential_delivery: "both",
  incident_score_threshold: 70,
  weekly_summary: true,
  legislative_digest: "weekly",
};

const DAYS = [60, 30, 14, 7];
const DELIVERY: { value: Delivery; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "both", label: "Both" },
  { value: "inapp", label: "In-app" },
];
const DIGEST: { value: Digest; label: string }[] = [
  { value: "immediate", label: "Immediate" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function NotificationsSettings() {
  const accent = useAccent();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Prefs>("/settings/notifications");
      setPrefs({ ...DEFAULT, ...(data ?? {}) });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleDay = (d: number) => {
    setPrefs((p) => ({
      ...p,
      credential_expiry_days: p.credential_expiry_days.includes(d)
        ? p.credential_expiry_days.filter((x) => x !== d)
        : [...p.credential_expiry_days, d].sort((a, b) => b - a),
    }));
  };

  const submit = async () => {
    setSaving(true);
    try {
      await api.post("/settings/notifications", prefs);
      Alert.alert("Saved", "Notification preferences updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.detail ?? "Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity testID="notif-back" style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#525252" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>

        <Eyebrow color={accent}>Settings</Eyebrow>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Same preferences as the SafeBase web app — synced both ways.</Text>

        <View style={{ height: 18 }} />

        <Card>
          <Eyebrow color={accent}>Credential expiry alerts</Eyebrow>
          <Text style={styles.help}>Send a reminder this many days before expiry.</Text>
          <View style={styles.chipRow}>
            {DAYS.map((d) => {
              const active = prefs.credential_expiry_days.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  testID={`notif-day-${d}`}
                  activeOpacity={0.85}
                  onPress={() => toggleDay(d)}
                  style={[
                    styles.chip,
                    { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : TOKENS.background },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? TOKENS.ink : "#525252" }]}>{d}d</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card>
          <Eyebrow color={accent}>Delivery channel</Eyebrow>
          <View style={styles.chipRow}>
            {DELIVERY.map((d) => {
              const active = prefs.credential_delivery === d.value;
              return (
                <TouchableOpacity
                  key={d.value}
                  testID={`notif-delivery-${d.value}`}
                  activeOpacity={0.85}
                  onPress={() => setPrefs((p) => ({ ...p, credential_delivery: d.value }))}
                  style={[
                    styles.chip,
                    { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : TOKENS.background },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? TOKENS.ink : "#525252" }]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card>
          <Eyebrow color={accent}>Incident escalation threshold</Eyebrow>
          <Text style={styles.help}>Notify safety manager when incident severity score is ≥ this value.</Text>
          <View style={styles.thresholdRow}>
            <TouchableOpacity testID="notif-thresh-down" onPress={() => setPrefs((p) => ({ ...p, incident_score_threshold: Math.max(0, p.incident_score_threshold - 10) }))} style={styles.stepBtn}>
              <Ionicons name="remove" size={20} color={TOKENS.ink} />
            </TouchableOpacity>
            <Text style={styles.thresholdValue}>{prefs.incident_score_threshold}</Text>
            <TouchableOpacity testID="notif-thresh-up" onPress={() => setPrefs((p) => ({ ...p, incident_score_threshold: Math.min(100, p.incident_score_threshold + 10) }))} style={styles.stepBtn}>
              <Ionicons name="add" size={20} color={TOKENS.ink} />
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <TouchableOpacity testID="notif-weekly" activeOpacity={0.85} onPress={() => setPrefs((p) => ({ ...p, weekly_summary: !p.weekly_summary }))}
            style={[styles.toggleRow, { borderColor: prefs.weekly_summary ? accent : TOKENS.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Weekly summary</Text>
              <Text style={styles.toggleSub}>Email digest of compliance score, open incidents and expiring credentials.</Text>
            </View>
            <View style={[styles.track, { backgroundColor: prefs.weekly_summary ? accent : TOKENS.border }]}>
              <View style={[styles.thumb, { alignSelf: prefs.weekly_summary ? "flex-end" : "flex-start" }]} />
            </View>
          </TouchableOpacity>
        </Card>

        <Card>
          <Eyebrow color={accent}>Legislative digest</Eyebrow>
          <Text style={styles.help}>"What changed this week" feed cadence.</Text>
          <View style={styles.chipRow}>
            {DIGEST.map((d) => {
              const active = prefs.legislative_digest === d.value;
              return (
                <TouchableOpacity
                  key={d.value}
                  testID={`notif-digest-${d.value}`}
                  activeOpacity={0.85}
                  onPress={() => setPrefs((p) => ({ ...p, legislative_digest: d.value }))}
                  style={[
                    styles.chip,
                    { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : TOKENS.background },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? TOKENS.ink : "#525252" }]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <PrimaryButton testID="notif-submit" label="Save preferences" onPress={submit} accent={accent} loading={saving} />
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: "#525252", fontSize: 14 },
  title: { color: TOKENS.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  subtitle: { color: "#525252", fontSize: 14, lineHeight: 20, marginTop: 6 },
  help: { color: "#737373", fontSize: 12, marginTop: 6, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginRight: 6, marginBottom: 6 },
  chipText: { fontSize: 13, fontWeight: "700" },
  thresholdRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 },
  stepBtn: { width: 44, height: 44, borderWidth: 1, borderColor: TOKENS.border, alignItems: "center", justifyContent: "center" },
  thresholdValue: { color: TOKENS.ink, fontSize: 32, fontWeight: "800", marginHorizontal: 28, fontFamily: "monospace" },
  toggleRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 12, marginTop: 4 },
  toggleLabel: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  toggleSub: { color: "#737373", fontSize: 12, marginTop: 2 },
  track: { width: 44, height: 22, padding: 2, marginLeft: 12 },
  thumb: { width: 18, height: 18, backgroundColor: "#FFFFFF" },
});
