// Verified parity with BusinessProfileIn in /tmp/safebase-src/backend/server.py:649.
// Field order matches the web Settings → Business page.

import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { useAccent, TOKENS } from "@/src/theme/colors";

interface BusinessProfile {
  company_name?: string;
  abn?: string;
  trade_type?: string;
  primary_state?: string;
  worker_count_band?: string;
  logo_url?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  whs_rep_name?: string;
}

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const WORKER_BANDS = ["1-5", "6-20", "21-50", "51-200", "200+"];

export default function BusinessSettings() {
  const accent = useAccent();
  const [profile, setProfile] = useState<BusinessProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<BusinessProfile>("/settings/business");
      setProfile(data ?? {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = <K extends keyof BusinessProfile>(k: K, v: BusinessProfile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      const saved = await api.post("/settings/business", profile);
      Alert.alert("Saved", "Business profile updated.", [{ text: "OK", onPress: () => router.back() }]);
      setProfile(saved as BusinessProfile);
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="biz-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#525252" />
            <Text style={styles.backText}>Settings</Text>
          </TouchableOpacity>

          <Eyebrow color={accent}>Settings</Eyebrow>
          <Text style={styles.title}>Business profile</Text>
          <Text style={styles.subtitle}>Shared across SafeBase web and mobile. Used on regulator notifications and document headers.</Text>

          <View style={{ height: 18 }} />

          <Input testID="biz-company" label="Company name" value={profile.company_name ?? ""} onChangeText={(v) => setField("company_name", v)} accent={accent} placeholder="Acme Trades Pty Ltd" />
          <Input testID="biz-abn" label="ABN" value={profile.abn ?? ""} onChangeText={(v) => setField("abn", v)} accent={accent} placeholder="11 digit ABN" keyboardType="number-pad" />
          <Input testID="biz-trade" label="Trade type" value={profile.trade_type ?? ""} onChangeText={(v) => setField("trade_type", v)} accent={accent} placeholder="electrical, plumbing, carpentry…" />

          <Eyebrow color="#525252">Primary state</Eyebrow>
          <View style={styles.chipRow}>
            {STATES.map((s) => {
              const active = profile.primary_state === s;
              return (
                <TouchableOpacity key={s} testID={`biz-state-${s}`} activeOpacity={0.85} onPress={() => setField("primary_state", s)}
                  style={[styles.chip, { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : TOKENS.background }]}>
                  <Text style={[styles.chipText, { color: active ? TOKENS.ink : "#525252" }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Eyebrow color="#525252">Worker count band</Eyebrow>
          <View style={styles.chipRow}>
            {WORKER_BANDS.map((b) => {
              const active = profile.worker_count_band === b;
              return (
                <TouchableOpacity key={b} testID={`biz-band-${b}`} activeOpacity={0.85} onPress={() => setField("worker_count_band", b)}
                  style={[styles.chip, { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : TOKENS.background }]}>
                  <Text style={[styles.chipText, { color: active ? TOKENS.ink : "#525252" }]}>{b}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input testID="biz-logo" label="Logo URL" value={profile.logo_url ?? ""} onChangeText={(v) => setField("logo_url", v)} accent={accent} placeholder="https://…" autoCapitalize="none" />
          <Input testID="biz-contact-name" label="Primary contact name" value={profile.primary_contact_name ?? ""} onChangeText={(v) => setField("primary_contact_name", v)} accent={accent} />
          <Input testID="biz-contact-phone" label="Primary contact phone" value={profile.primary_contact_phone ?? ""} onChangeText={(v) => setField("primary_contact_phone", v)} accent={accent} keyboardType="phone-pad" />
          <Input testID="biz-address" label="Address" value={profile.address ?? ""} onChangeText={(v) => setField("address", v)} accent={accent} multiline style={{ minHeight: 70, textAlignVertical: "top" }} />
          <Input testID="biz-emerg-name" label="Emergency contact name" value={profile.emergency_contact_name ?? ""} onChangeText={(v) => setField("emergency_contact_name", v)} accent={accent} />
          <Input testID="biz-emerg-phone" label="Emergency contact phone" value={profile.emergency_contact_phone ?? ""} onChangeText={(v) => setField("emergency_contact_phone", v)} accent={accent} keyboardType="phone-pad" />
          <Input testID="biz-whs" label="WHS rep name" value={profile.whs_rep_name ?? ""} onChangeText={(v) => setField("whs_rep_name", v)} accent={accent} />

          <PrimaryButton testID="biz-submit" label="Save changes" onPress={submit} accent={accent} loading={saving} />
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  chip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginRight: 6, marginBottom: 6 },
  chipText: { fontSize: 13, fontWeight: "600" },
});
