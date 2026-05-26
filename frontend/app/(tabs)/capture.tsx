// Capture tab — shows the user's primary-industry quick-capture tiles fully
// unlocked, plus a clearly-labelled "Other industries" section. Industries the
// user is currently entitled to (paid OR mid-trial) show their capture tiles
// inline; un-subscribed industries surface a LockedTile with a "Start Free
// Trial" CTA pointing at /billing.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LockedTile } from "@/src/components/LockedTile";
import { Eyebrow, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { ALL_INDUSTRIES, useBilling } from "@/src/context/BillingContext";
import { accentFor, COLORS, INDUSTRY_LABEL, Industry, TOKENS } from "@/src/theme/colors";

interface CaptureItem {
  id: string;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}

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
    { id: "mass", title: "Mass declaration", sub: "GML / CML / HML / PBS", icon: "scale-outline", href: "/transport/mass" },
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
  const { isUnlocked, statusFor, anyTrialActive, ready } = useBilling();
  const primary = (user?.industry as Industry | undefined) ?? "trades";
  const accent = accentFor(primary);

  // While subscriptions are still loading we conservatively treat every
  // industry as unlocked so the user never sees a flash of "Upgrade to
  // unlock" tiles. Once `ready` flips to true, real per-industry gating
  // kicks in — but only if no trial is active anywhere on the account.
  const unlockAll = anyTrialActive || !ready;

  // An industry is "available" when it's paid OR in active trial. Primary
  // industry tiles always render (the user can always see their own).
  const availableIndustries: Industry[] = ALL_INDUSTRIES.filter(
    (i) => i === primary || unlockAll || isUnlocked(i),
  ) as Industry[];

  const lockedIndustries: Industry[] = unlockAll
    ? []
    : (ALL_INDUSTRIES.filter((i) => i !== primary && !isUnlocked(i)) as Industry[]);

  const primaryTiles = CAPTURES_BY_INDUSTRY[primary] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow={INDUSTRY_LABEL[primary]}
          title="Capture"
          subtitle={`Daily logs, declarations and reports. Every entry is regulator-ready.`}
          accent={accent}
        />

        {/* Primary industry — always shown */}
        <Eyebrow color={accent}>For your role</Eyebrow>
        {primaryTiles.map((c) => (
          <CaptureRow key={`${primary}-${c.id}`} item={c} accent={accent} onPress={() => router.push(c.href as any)} />
        ))}

        {/* Additional industries the user is paid-into OR mid-trial */}
        {availableIndustries
          .filter((i) => i !== primary)
          .map((ind) => {
            const tiles = CAPTURES_BY_INDUSTRY[ind] ?? [];
            const st = statusFor(ind);
            return (
              <View key={ind} style={{ marginTop: 18 }}>
                <View style={styles.sectionHeaderRow}>
                  <Eyebrow color={COLORS.textSecondary}>{INDUSTRY_LABEL[ind]}</Eyebrow>
                  {st.kind === "trial" ? (
                    <View style={styles.trialPill}>
                      <Ionicons name="gift-outline" size={11} color={TOKENS.authority} />
                      <Text style={styles.trialPillText}>{st.daysLeft ?? 0}D LEFT</Text>
                    </View>
                  ) : null}
                </View>
                {tiles.map((c) => (
                  <CaptureRow
                    key={`${ind}-${c.id}`}
                    item={c}
                    accent={accent}
                    onPress={() => router.push(c.href as any)}
                  />
                ))}
              </View>
            );
          })}

        {/* Locked industries — Start Free Trial CTAs */}
        {lockedIndustries.length > 0 && ready ? (
          <>
            <View style={{ height: 18 }} />
            <Eyebrow color={COLORS.textMuted}>Other industries</Eyebrow>
            <Text style={styles.lockedHint}>Try every SafeBase industry free for 14 days. Everything unlocked, no card required.</Text>
            <View style={styles.lockedGrid}>
              {lockedIndustries.map((ind) => {
                const st = statusFor(ind);
                const isExpired = st.kind === "expired" || st.kind === "canceling";
                return (
                  <LockedTile
                    key={ind}
                    testID={`capture-locked-${ind}`}
                    label={INDUSTRY_LABEL[ind]}
                    sub={`${(CAPTURES_BY_INDUSTRY[ind] ?? []).length} capture flows`}
                    icon="lock-closed-outline"
                    href="/billing"
                    variant={isExpired ? "upgrade" : "trial"}
                  />
                );
              })}
            </View>
          </>
        ) : null}

        <View style={{ height: 80 }} />
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
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  trialPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: `${TOKENS.authority}15`,
    borderWidth: 1,
    borderColor: TOKENS.authority,
  },
  trialPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: TOKENS.authority, marginLeft: 4 },
  lockedHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 4, marginBottom: 8 },
  lockedGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
});
