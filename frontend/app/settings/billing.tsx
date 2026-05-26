// Phase 1F · Settings: Billing & plan. The web app handles Stripe checkout;
// mobile is read-only — shows current plan summary + opens web for changes.
import React from "react";
import { useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Eyebrow, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function BillingScreen() {
  const accent = useAccent();
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Settings" title="Billing & plan" subtitle="Plan changes and invoices are handled in the SafeBase web app via Stripe." accent={accent} />
        <Card>
          <Eyebrow color={accent}>Manage subscription</Eyebrow>
          <Text style={s.body}>To upgrade, downgrade, view invoices or update payment details, open SafeBase on the web. The customer portal will sign you straight in via the Stripe billing portal.</Text>
          <PrimaryButton testID="bill-web" label="Open SafeBase web" onPress={() => Linking.openURL("https://safe-systems.preview.emergentagent.com/dashboard/settings/billing").catch(() => {})} accent={accent} iconName="open-outline" />
        </Card>
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  body: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginVertical: 12 },
});
