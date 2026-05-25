import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Eyebrow, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS, INDUSTRY_LABEL, Industry } from "@/src/theme/colors";

interface CaptureItem {
  id: string;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  industries: Industry[];
}

const CAPTURES: CaptureItem[] = [
  {
    id: "lone-worker-checkin",
    title: "Lone-worker check-in",
    sub: "Confirm you're safe on shift",
    icon: "shield-checkmark-outline",
    href: "/capture/lone-worker-checkin",
    industries: ["retail", "healthcare"],
  },
  {
    id: "pretrip",
    title: "Pre-trip inspection",
    sub: "HV / fleet pre-start check",
    icon: "construct-outline",
    href: "/capture/pretrip-inspection",
    industries: ["transport"],
  },
  {
    id: "fitness",
    title: "Fitness for duty",
    sub: "Pre-shift driver declaration",
    icon: "fitness-outline",
    href: "/capture/fitness-for-duty",
    industries: ["transport"],
  },
  {
    id: "temp",
    title: "Temperature log",
    sub: "Fridge / hot-hold / dishwasher",
    icon: "thermometer-outline",
    href: "/capture/temperature-log",
    industries: ["hospitality", "healthcare"],
  },
  {
    id: "incident",
    title: "Incident report",
    sub: "Hazard, injury or near-miss",
    icon: "warning-outline",
    href: "/capture/incident-report",
    industries: ["trades", "hospitality", "transport", "healthcare", "retail"],
  },
  {
    id: "swms",
    title: "SWMS sign-on",
    sub: "Pre-start safe work method",
    icon: "document-text-outline",
    href: "/capture/swms-signon",
    industries: ["trades", "transport"],
  },
];

export default function Capture() {
  const { user } = useAuth();
  const router = useRouter();
  const industry = (user?.industry as Industry | undefined) ?? "trades";
  const accent = accentFor(industry);

  const recommended = CAPTURES.filter((c) => c.industries.includes(industry));
  const others = CAPTURES.filter((c) => !c.industries.includes(industry));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow={INDUSTRY_LABEL[industry]}
          title="Capture"
          subtitle="Daily logs, declarations and reports. Every entry is regulator-ready."
          accent={accent}
        />

        <Eyebrow color={accent}>Recommended for you</Eyebrow>
        {recommended.map((c) => (
          <CaptureRow key={c.id} item={c} accent={accent} onPress={() => router.push(c.href as any)} />
        ))}

        <View style={{ height: 24 }} />
        <Eyebrow color={COLORS.textSecondary}>Other captures</Eyebrow>
        {others.map((c) => (
          <CaptureRow key={c.id} item={c} accent={COLORS.textSecondary} onPress={() => router.push(c.href as any)} />
        ))}

        <View style={{ height: 32 }} />
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
});
