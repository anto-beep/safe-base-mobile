// Industry-specific resources screen — shows ONLY the signed-in user's
// industry resources, per the user's spec: "a trades user signed up/in
// will only see trades resources". Mirrors the per-industry resource
// hubs on SafeBase web.

import { Ionicons } from "@expo/vector-icons";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Card, Eyebrow, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { resourcesFor, ResourceItem } from "@/src/data/resourcesByIndustry";
import { accentFor, COLORS, INDUSTRY_LABEL, TOKENS } from "@/src/theme/colors";
import type { IndustryKey } from "@/src/data/rolesByIndustry";

const KIND_LABEL: Record<ResourceItem["kind"], string> = {
  template: "Template",
  guide: "Guide",
  regulator: "Regulator",
  register: "Register",
};
const KIND_ICON: Record<ResourceItem["kind"], keyof typeof import("@expo/vector-icons").Ionicons.glyphMap> = {
  template: "document-text-outline",
  guide: "book-outline",
  regulator: "shield-checkmark-outline",
  register: "clipboard-outline",
};
const KIND_COLOR: Record<ResourceItem["kind"], string> = {
  template: TOKENS.authority,
  guide: TOKENS.success,
  regulator: TOKENS.destructive,
  register: TOKENS.warning,
};

export default function ResourcesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const industry = (user?.industry as IndustryKey | undefined) ?? "trades";
  const accent = accentFor(industry);
  const items = resourcesFor(industry);

  const open = (r: ResourceItem) => {
    if (r.external) {
      Linking.openURL(r.href).catch(() => null);
      return;
    }
    router.push(r.href as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="resources-back">
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <ScreenHeader
          eyebrow={INDUSTRY_LABEL[industry]}
          title="Resources"
          subtitle={`Curated templates, registers and regulator references for ${INDUSTRY_LABEL[industry]}.`}
          accent={accent}
        />

        {items.length === 0 ? (
          <Card>
            <Text style={styles.empty}>
              No resources for this industry yet. Pull-to-refresh once new resources are added.
            </Text>
          </Card>
        ) : (
          items.map((r) => (
            <TouchableOpacity
              key={r.id}
              testID={`resource-${r.id}`}
              onPress={() => open(r)}
              activeOpacity={0.85}
              style={styles.row}
            >
              <View style={[styles.iconBox, { borderColor: KIND_COLOR[r.kind] }]}>
                <Ionicons name={KIND_ICON[r.kind]} size={20} color={KIND_COLOR[r.kind]} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.title}>{r.title}</Text>
                <Text style={styles.sub} numberOfLines={2}>{r.sub}</Text>
                <View style={styles.kindRow}>
                  <View style={[styles.kindPill, { borderColor: KIND_COLOR[r.kind] }]}>
                    <Text style={[styles.kindPillText, { color: KIND_COLOR[r.kind] }]}>{KIND_LABEL[r.kind].toUpperCase()}</Text>
                  </View>
                  {r.external ? (
                    <Text style={styles.externalText}>· OPENS IN BROWSER</Text>
                  ) : null}
                </View>
              </View>
              <Ionicons name={r.external ? "open-outline" : "chevron-forward"} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  empty: { color: COLORS.textMuted, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  kindRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  kindPill: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
  kindPillText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  externalText: { color: COLORS.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 1, marginLeft: 6 },
});
