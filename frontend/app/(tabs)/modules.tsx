import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Eyebrow, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS, INDUSTRY_LABEL, Industry } from "@/src/theme/colors";

interface ModuleDef {
  slug: string;
  label: string;
  sub: string;
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  // If `industries` is undefined → universal. Otherwise gated to those industries.
  industries?: Industry[];
}

const UNIVERSAL: ModuleDef[] = [
  { slug: "incidents", label: "Incidents", sub: "Reports & regulator pipeline", icon: "warning-outline" },
  { slug: "workers", label: "Workers & licences", sub: "Team + credentials", icon: "people-outline" },
  { slug: "documents", label: "Documents", sub: "SWMS, policies, evidence", icon: "document-text-outline" },
  { slug: "inductions", label: "Inductions", sub: "Visitor + crew sign-ons", icon: "qr-code-outline" },
  { slug: "safety", label: "Safety register", sub: "Inspections, plant, toolbox", icon: "shield-checkmark-outline" },
  { slug: "risks", label: "Risk register", sub: "5×5 matrix + reviews", icon: "alert-circle-outline" },
  { slug: "reports", label: "Reports", sub: "Live dashboards", icon: "stats-chart-outline" },
  { slug: "compliance-inbox", label: "Compliance inbox", sub: "Action queue", icon: "mail-open-outline" },
  { slug: "automations", label: "Automations", sub: "If-this-then-that", icon: "git-network-outline" },
  { slug: "regulator-pipeline", label: "Regulator pipeline", sub: "WorkSafe / NHVR / ACQSC / NDIS", icon: "scale-outline" },
  { slug: "api-keys", label: "API keys", sub: "Universal API access", icon: "key-outline" },
  { slug: "addons", label: "Add-ons", sub: "Marketplace", icon: "cube-outline" },
];

const PER_INDUSTRY: ModuleDef[] = [
  { slug: "hospitality/food-safety", label: "Food safety", sub: "HACCP plan + CCPs", icon: "restaurant-outline", industries: ["hospitality"] },
  { slug: "hospitality/temperature", label: "Temperature logs", sub: "Fridges, freezers, hot-hold", icon: "thermometer-outline", industries: ["hospitality"] },
  { slug: "hospitality/allergens", label: "Allergens", sub: "14 priority allergens", icon: "alert-outline", industries: ["hospitality"] },
  { slug: "transport/fleet", label: "Fleet vehicles", sub: "Rego + GVM + expiry", icon: "car-outline", industries: ["transport"] },
  { slug: "transport/fatigue", label: "Fatigue", sub: "Work diary + breaches", icon: "moon-outline", industries: ["transport"] },
  { slug: "transport/pretrip", label: "Pre-trip log", sub: "HV inspections", icon: "construct-outline", industries: ["transport"] },
  { slug: "healthcare/care", label: "Care minutes", sub: "Aged Care evidence", icon: "heart-outline", industries: ["healthcare"] },
  { slug: "healthcare/ahpra", label: "AHPRA register", sub: "Clinician renewals", icon: "ribbon-outline", industries: ["healthcare"] },
  { slug: "healthcare/sirs", label: "SIRS / NDIS", sub: "Reportable incidents", icon: "medkit-outline", industries: ["healthcare"] },
  { slug: "retail/lone-worker", label: "Lone worker", sub: "Active shifts", icon: "shield-outline", industries: ["retail"] },
  { slug: "retail/store-incidents", label: "Store incidents", sub: "Customer-facing", icon: "storefront-outline", industries: ["retail"] },
  { slug: "trades/swms", label: "SWMS library", sub: "Safe Work Method Statements", icon: "document-text-outline", industries: ["trades"] },
  { slug: "trades/tradecheck", label: "TradeCheck", sub: "Cross-employer credentials", icon: "checkmark-done-outline", industries: ["trades"] },
];

export default function ModulesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const industry = (user?.industry as Industry | undefined) ?? "trades";
  const accent = accentFor(industry);

  const industrySpecific = PER_INDUSTRY.filter((m) => m.industries?.includes(industry));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow={INDUSTRY_LABEL[industry]}
          title="Modules"
          subtitle="Every compliance area in one tap. Mirrors your SafeBase web workspace."
          accent={accent}
        />

        {industrySpecific.length ? (
          <>
            <Eyebrow color={accent}>For {INDUSTRY_LABEL[industry].split(" ")[0].toLowerCase()}</Eyebrow>
            <ModuleGrid modules={industrySpecific} accent={accent} onPress={(m) => router.push(routeFor(m) as any)} />
          </>
        ) : null}

        <View style={{ height: 14 }} />
        <Eyebrow color={COLORS.textSecondary}>Core</Eyebrow>
        <ModuleGrid modules={UNIVERSAL} accent={accent} onPress={(m) => router.push(routeFor(m) as any)} />

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Some modules now have dedicated mobile screens — route to those instead of
// the generic /module/[slug] placeholder. Keep this map small; new entries
// added as each module gets its own native screen during the parity build.
function routeFor(m: ModuleDef): string {
  if (m.slug === "incidents") return "/incident";
  return `/module/${encodeURIComponent(m.slug)}`;
}


function ModuleGrid({ modules, accent, onPress }: { modules: ModuleDef[]; accent: string; onPress: (m: ModuleDef) => void }) {
  return (
    <View style={styles.grid}>
      {modules.map((m) => (
        <TouchableOpacity
          key={m.slug}
          testID={`module-${m.slug.replace(/\//g, "-")}`}
          activeOpacity={0.85}
          style={styles.tile}
          onPress={() => onPress(m)}
        >
          <View style={[styles.iconBox, { borderColor: accent }]}>
            <Ionicons name={m.icon} size={20} color={accent} />
          </View>
          <Text style={styles.tileTitle}>{m.label}</Text>
          <Text style={styles.tileSub}>{m.sub}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, marginTop: 4, marginBottom: 6 },
  tile: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  tileSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
