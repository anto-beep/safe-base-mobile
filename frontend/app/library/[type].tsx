// Phase 1H · Library viewer (Process / Activity / Task / Control).
// The backend exposes risk libraries via /risks/meta/* + safety registers;
// for now the mobile shows the type catalogue + a link to the web library
// (mobile read-only). The web edits these centrally.
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Eyebrow, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const META: Record<string, { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap; webPath: string }> = {
  process: { title: "Process library", sub: "Reusable processes (Plan-Do-Check-Act, JSA framework, etc.)", icon: "git-branch-outline", webPath: "/dashboard/library/processes" },
  activity: { title: "Activity library", sub: "Reusable activities you can drop into SWMS and risk assessments.", icon: "list-outline", webPath: "/dashboard/library/activities" },
  task: { title: "Task library", sub: "Reusable tasks under activities — used in SWMS task lists.", icon: "checkbox-outline", webPath: "/dashboard/library/tasks" },
  control: { title: "Control library", sub: "Reusable hazard controls (elimination → PPE hierarchy).", icon: "shield-checkmark-outline", webPath: "/dashboard/library/controls" },
};

export default function LibraryScreen() {
  const accent = useAccent();
  const router = useRouter();
  const { type: raw } = useLocalSearchParams<{ type: string }>();
  const m = META[raw as string] ?? META.process;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Library" title={m.title} subtitle={m.sub} accent={accent} />
        <Card>
          <Eyebrow color={accent}>Edit on web</Eyebrow>
          <Text style={s.body}>The {raw} library is edited centrally on SafeBase web so changes propagate to every workspace. Tap below to manage it on the web; everything saved there shows up in mobile SWMS/risk forms immediately.</Text>
          <PrimaryButton testID={`lib-${raw}-open`} label="Open on web" onPress={() => Linking.openURL(`https://safe-systems.preview.emergentagent.com${m.webPath}`).catch(() => {})} accent={accent} iconName="open-outline" />
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
