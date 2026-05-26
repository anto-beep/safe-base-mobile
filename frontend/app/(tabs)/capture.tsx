// Industry-specific Capture tab. Each industry sees ONLY its own capture tiles
// (matches the web app where Capture is gated by the user's industry +
// feature flags). No cross-industry leakage. Backend enforces with
// require_feature; client just hides what the user can't see.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Eyebrow, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS, INDUSTRY_LABEL, Industry, TOKENS } from "@/src/theme/colors";

interface CaptureItem {
  id: string;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}

// Per-industry capture tile sets. Mirror of the web app Capture menu.
const CAPTURES_BY_INDUSTRY: Record<Industry, CaptureItem[]> = {
  trades: [
    { id: "incident", title: "Incident / hazard report", sub: "Injury, near-miss, hazard", icon: "warning-outline", href: "/incident/new" },
    { id: "swms-signon", title: "SWMS sign-on", sub: "Pre-start safe work method", icon: "document-text-outline", href: "/capture/swms-signon" },
    { id: "toolbox", title: "Toolbox talk sign-on", sub: "Toolbox attendance record", icon: "chatbubbles-outline", href: "/module/safety-toolbox_talks" },
    { id: "plant", title: "Plant inspection", sub: "Pre-use plant / equipment check", icon: "construct-outline", href: "/module/safety-plant" },
    { id: "worker-checkin", title: "Worker check-in", sub: "Site presence + induction", icon: "qr-code-outline", href: "/capture/lone-worker-checkin" },
    { id: "ppe", title: "PPE issue", sub: "Record PPE supplied", icon: "shield-outline", href: "/module/safety-ppe" },
  ],
  hospitality: [
    { id: "temp", title: "Temperature log", sub: "Fridge / freezer / hot-hold (FSANZ 3.2.2)", icon: "thermometer-outline", href: "/hospitality/temperature-logs" },
    { id: "haccp", title: "HACCP CCP entry", sub: "Cook / cool / sanitise critical limit", icon: "clipboard-outline", href: "/hospitality/haccp" },
    { id: "cleaning", title: "Cleaning sign-off", sub: "Complete a cleaning task", icon: "sparkles-outline", href: "/hospitality/cleaning" },
    { id: "allergen", title: "Allergen update", sub: "Menu item allergen declaration", icon: "alert-outline", href: "/hospitality/allergens" },
    { id: "incident", title: "Incident report", sub: "Customer or staff incident", icon: "warning-outline", href: "/incident/new" },
    { id: "supplier", title: "Approved supplier", sub: "Add or audit a supplier", icon: "business-outline", href: "/hospitality/suppliers" },
  ],
  transport: [
    { id: "pretrip", title: "Pre-trip inspection", sub: "NHVR daily check", icon: "construct-outline", href: "/transport/pretrip" },
    { id: "ffd", title: "Fitness-for-duty", sub: "Pre-shift driver declaration", icon: "fitness-outline", href: "/transport/fitness-for-duty" },
    { id: "fatigue", title: "Fatigue log", sub: "Work / rest hours (HVNL)", icon: "moon-outline", href: "/transport/fatigue" },
    { id: "load", title: "Load restraint check", sub: "LRG 3rd Ed performance standard", icon: "cube-outline", href: "/transport/load-restraint" },
    { id: "mass", title: "Mass declaration", sub: "GML / CML / HML / PBS", icon: "scale-outline", href: "/transport/mass-declarations" },
    { id: "nhvr", title: "NHVR occurrence", sub: "s 596A notifiable (24h)", icon: "alert-circle-outline", href: "/transport/nhvr" },
    { id: "incident", title: "Incident report", sub: "Injury, near-miss, hazard", icon: "warning-outline", href: "/incident/new" },
  ],
  healthcare: [
    { id: "sirs", title: "SIRS / NDIS report", sub: "Reportable incident", icon: "medkit-outline", href: "/healthcare/sirs" },
    { id: "ahpra", title: "AHPRA update", sub: "Registration + conditions", icon: "ribbon-outline", href: "/healthcare/ahpra" },
    { id: "care-minutes", title: "Care minutes", sub: "Aged Care evidence", icon: "heart-outline", href: "/healthcare/care-minutes" },
    { id: "screening", title: "Worker screening", sub: "NDIS / WWCC / NPC", icon: "shield-checkmark-outline", href: "/healthcare/worker-screening" },
    { id: "incident", title: "Clinical incident", sub: "Injury, near-miss, hazard", icon: "warning-outline", href: "/incident/new" },
    { id: "temp", title: "Vaccine / fridge temp", sub: "Cold-chain log", icon: "thermometer-outline", href: "/hospitality/temperature-logs" },
  ],
  retail: [
    { id: "lone-worker", title: "Lone-worker check-in", sub: "Confirm you're safe on shift", icon: "shield-outline", href: "/retail/lone-worker" },
    { id: "customer-incident", title: "Customer incident", sub: "Slip / aggression / theft", icon: "storefront-outline", href: "/retail/customer-incidents" },
    { id: "quick-induct", title: "Quick induct", sub: "Casual / contractor sign-on", icon: "qr-code-outline", href: "/retail/quick-induct" },
    { id: "incident", title: "Staff incident", sub: "Injury, near-miss, hazard", icon: "warning-outline", href: "/incident/new" },
  ],
};

export default function Capture() {
  const { user } = useAuth();
  const router = useRouter();
  const industry = (user?.industry as Industry | undefined) ?? "trades";
  const accent = accentFor(industry);
  const tiles = CAPTURES_BY_INDUSTRY[industry] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow={INDUSTRY_LABEL[industry]}
          title="Capture"
          subtitle={`Daily logs, declarations and reports for ${INDUSTRY_LABEL[industry]}. Every entry is regulator-ready.`}
          accent={accent}
        />

        <Eyebrow color={accent}>For your role</Eyebrow>
        {tiles.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No capture entries configured for your industry yet.</Text>
          </View>
        ) : tiles.map((c) => (
          <CaptureRow key={c.id} item={c} accent={accent} onPress={() => router.push(c.href as any)} />
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CaptureRow({
  item,
  accent,
  onPress,
}: {
  item: CaptureItem;
  accent: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      testID={`capture-${item.id}`}
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.row}
    >
      <View style={[styles.iconBox, { borderColor: accent }]}>
        <Ionicons name={item.icon} size={22} color={accent} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSub}>{item.sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  emptyBox: { padding: 18, borderWidth: 1, borderColor: TOKENS.border, marginTop: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
