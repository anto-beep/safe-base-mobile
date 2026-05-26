// Phase 1F · Settings: Onboarding wizard. /onboarding.
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingApi, Onboarding } from "@/src/api/extras";
import { Card, Eyebrow, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const STEPS = [
  { key: "business_profile", label: "Business profile complete" },
  { key: "first_worker", label: "At least one worker added" },
  { key: "first_swms", label: "First SWMS / policy generated" },
  { key: "first_incident", label: "Incident flow tested" },
  { key: "first_risk", label: "At least one risk on register" },
  { key: "notifications", label: "Notification preferences set" },
];

export default function OnboardingScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [data, setData] = useState<Onboarding>({ steps: {} });
  const [busy, setBusy] = useState(false);

  useEffect(() => { OnboardingApi.get().then(d => setData(d ?? { steps: {} })).catch(() => {}); }, []);

  const toggle = (k: string) => setData(d => ({ ...d, steps: { ...(d.steps ?? {}), [k]: !(d.steps?.[k]) } }));
  const completed = STEPS.filter(s => data.steps?.[s.key]).length;

  const save = async () => {
    setBusy(true);
    try { await OnboardingApi.put({ ...data, complete: completed === STEPS.length }); Alert.alert("Saved", "Onboarding state updated."); }
    catch (e: any) { Alert.alert("Save failed", e?.detail ?? "Could not save."); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Settings" title="Onboarding" subtitle={`${completed} / ${STEPS.length} steps complete.`} accent={accent} />
        <Card>
          {STEPS.map(step => (
            <TouchableOpacity key={step.key} testID={`onb-${step.key}`} onPress={() => toggle(step.key)} style={s.step}>
              <Ionicons name={data.steps?.[step.key] ? "checkmark-circle" : "ellipse-outline"} size={22} color={data.steps?.[step.key] ? TOKENS.success : COLORS.textMuted} />
              <Text style={[s.label, data.steps?.[step.key] && { color: COLORS.textSecondary, textDecorationLine: "line-through" }]}>{step.label}</Text>
            </TouchableOpacity>
          ))}
          <PrimaryButton testID="onb-save" label="Save progress" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
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
  step: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: TOKENS.border },
  label: { color: COLORS.textPrimary, fontSize: 14, marginLeft: 10, flex: 1 },
});
