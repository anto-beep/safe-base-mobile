// Phase 1I · Partner branding — white-label DNS + email + colour.
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { PartnerApi, PartnerBranding } from "@/src/api/extras";
import { Card, Eyebrow, Input, MONO, Pill, PrimaryButton, ScreenHeader, SecondaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function BrandingScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [data, setData] = useState<PartnerBranding>({});
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { PartnerApi.getBranding().then(d => setData(d ?? {})).catch(() => {}); }, []);
  const f = (k: keyof PartnerBranding) => (v: string) => setData(d => ({ ...d, [k]: v }));

  const save = async () => {
    setBusy(true);
    try { await PartnerApi.putBranding(data); Alert.alert("Saved", "Branding updated."); }
    catch (e: any) { Alert.alert("Save failed", e?.detail ?? ""); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    setVerifying(true);
    try { const r = await PartnerApi.verifyDns(); Alert.alert(r.verified ? "DNS verified" : "DNS not verified", r.verified ? "Your custom domain is live." : "DNS records not detected yet. Check propagation."); setData(d => ({ ...d, dns_verified: r.verified })); }
    catch (e: any) { Alert.alert("Verify failed", e?.detail ?? ""); }
    finally { setVerifying(false); }
  };

  const testEmail = async () => {
    try { await PartnerApi.testEmail(); Alert.alert("Sent", "Test branded email dispatched."); }
    catch (e: any) { Alert.alert("Failed", e?.detail ?? ""); }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
          <ScreenHeader eyebrow="Add-on" title="Partner branding" subtitle="White-label SafeBase with your domain, logo and brand colour." accent={accent} />
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Eyebrow color={accent}>Brand identity</Eyebrow>
              <Pill label={data.dns_verified ? "DNS LIVE" : "DNS PENDING"} color={data.dns_verified ? TOKENS.success : TOKENS.warnInk} />
            </View>
            <Input label="Logo URL" value={data.logo_url ?? ""} onChangeText={f("logo_url")} accent={accent} autoCapitalize="none" />
            <Input label="Primary colour (hex)" value={data.primary_colour ?? ""} onChangeText={f("primary_colour")} accent={accent} placeholder="#003DA5" />
            <Input label="Custom subdomain" value={data.subdomain ?? ""} onChangeText={f("subdomain")} accent={accent} autoCapitalize="none" placeholder="e.g. compliance.yourbrand.com.au" />
            <Input label="From email" value={data.from_email ?? ""} onChangeText={f("from_email")} accent={accent} keyboardType="email-address" autoCapitalize="none" />
            <PrimaryButton label="Save branding" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
            <View style={{ height: 8 }} />
            <SecondaryButton label={verifying ? "Verifying..." : "Verify DNS"} onPress={verify} iconName="shield-checkmark-outline" disabled={verifying} />
            <View style={{ height: 8 }} />
            <SecondaryButton label="Send test email" onPress={testEmail} iconName="mail-outline" />
          </Card>
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
