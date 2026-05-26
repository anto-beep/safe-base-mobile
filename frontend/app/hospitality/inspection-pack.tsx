// Hospitality — Council Inspection Pack generator. Backend POST returns
// an evidence manifest (counts per source). No file download here — the
// renderer lives on the web; this screen bundles the evidence on demand.

import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HospitalityApi, InspectionPack } from "@/src/api/industry";
import { Card, EmptyState, Eyebrow, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const LABELS: Record<string, string> = {
  temperature_logs: "Temperature logs",
  fss_register: "FSS register",
  haccp_ccp: "HACCP CCP entries",
  allergens: "Allergen items",
  cleaning_tasks: "Cleaning tasks",
  suppliers: "Approved suppliers",
  liquor_certs: "RSA / Liquor certs",
};

export default function InspectionPackScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pack, setPack] = useState<InspectionPack | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setBusy(true); setError(null);
    try { const p = await HospitalityApi.generateInspectionPack(30); setPack(p); }
    catch (e: any) { setError(e?.detail ?? "Could not generate inspection pack."); }
    finally { setBusy(false); }
  }, []);

  useFocusEffect(useCallback(() => { /* don't auto-generate; let user trigger */ }, []));

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginBottom: 6 }}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <ScreenHeader eyebrow="Hospitality" title="Council inspection pack" subtitle="Bundle 30 days of food-safety evidence into an inspection-ready manifest. EHO walks in — you tap and present." accent={accent} />

        <Card>
          <Eyebrow color={accent}>What's included</Eyebrow>
          <Text style={s.note}>Temperature logs · FSS register · HACCP CCP entries · Allergen register · Cleaning sign-offs · Approved suppliers · RSA / Liquor certs.</Text>
          <PrimaryButton testID="pack-generate" label={pack ? "Re-generate pack (30d)" : "Generate pack (last 30 days)"} onPress={generate} accent={accent} loading={busy} iconName="folder-open" />
        </Card>

        {error ? <Card><Text style={s.err}>{error}</Text></Card> : null}

        {pack ? (
          <Card testID="pack-card">
            <Eyebrow color={accent}>Manifest · {pack.pack_id}</Eyebrow>
            <Text style={s.metaLine}>Generated {new Date(pack.generated_at).toLocaleString("en-AU")} · covers {pack.covers_period_days} days</Text>
            <View style={{ marginTop: 10 }}>
              {Object.entries(pack.manifest).map(([k, v]) => (
                <View key={k} style={s.manifestRow}>
                  <Text style={s.mLabel}>{LABELS[k] ?? k.replace(/_/g, " ")}</Text>
                  <Text style={s.mValue}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={[s.note, { marginTop: 12 }]}>To download the formatted PDF version of this pack, open SafeBase on the web. The PDF renderer is server-side.</Text>
          </Card>
        ) : null}

        {!pack && !error && !busy ? (
          <EmptyState icon="folder-outline" title="No pack generated" body="Tap the button above to bundle the last 30 days of food-safety evidence." />
        ) : null}
        <View style={{ height: 60 }} />
      </ScrollView>
      {busy && !pack ? <View style={s.overlay}><ActivityIndicator size="large" color={accent} /></View> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  note: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginVertical: 10 },
  err: { color: TOKENS.destructive, fontSize: 13 },
  metaLine: { color: COLORS.textMuted, fontSize: 11, fontFamily: MONO, marginTop: 4 },
  manifestRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: TOKENS.border },
  mLabel: { color: COLORS.textPrimary, fontSize: 14 },
  mValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "800", fontFamily: MONO },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF80" },
});
