// Phase 1F · Settings: Business profile. GET/PUT /settings/business.
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsApi, type BusinessProfile } from "@/src/api/safebase";
import { Card, Eyebrow, Input, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function BusinessSettingsScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [data, setData] = useState<BusinessProfile | any>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SettingsApi.getBusiness()
      .then(d => setData(d ?? {}))
      .catch(e => setError(e?.detail ?? "Could not load business profile."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setBusy(true);
    try { await SettingsApi.putBusiness(data); Alert.alert("Saved", "Business profile updated."); }
    catch (e: any) { Alert.alert("Save failed", e?.detail ?? "Could not save."); }
    finally { setBusy(false); }
  };
  const f = (k: string) => (v: string) => setData((d: any) => ({ ...d, [k]: v }));

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
          <ScreenHeader eyebrow="Settings" title="Business profile" subtitle="Identity used on documents, regulator reports and invoices." accent={accent} />
          {error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> : null}
          {!loading ? (
            <Card>
              <Eyebrow color={accent}>Identity</Eyebrow>
              <Input label="Business name" value={data.business_name ?? ""} onChangeText={f("business_name")} accent={accent} />
              <Input label="ABN" value={data.abn ?? ""} onChangeText={f("abn")} accent={accent} keyboardType="numbers-and-punctuation" />
              <Input label="ANZSIC" value={data.anzsic ?? ""} onChangeText={f("anzsic")} accent={accent} />
              <Input label="Address" value={data.address ?? ""} onChangeText={f("address")} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
              <Input label="Phone" value={data.phone ?? ""} onChangeText={f("phone")} accent={accent} keyboardType="phone-pad" />
              <Input label="Email" value={data.email ?? ""} onChangeText={f("email")} accent={accent} keyboardType="email-address" autoCapitalize="none" />
              <Input label="Website" value={data.website ?? ""} onChangeText={f("website")} accent={accent} autoCapitalize="none" />
              <PrimaryButton testID="biz-save" label="Save profile" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
            </Card>
          ) : null}
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
});
