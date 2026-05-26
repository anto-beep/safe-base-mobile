// Modules tab — full parity with the SafeBase web sidebar.
// Each industry sees the SAME shell of sections (Overview / Industry / Safety
// / Workflows / Library / Apps & Add-ons / Settings) but the Industry section
// rotates per logged-in industry. Unimplemented tiles render as LockedTile
// (still tappable — opens the Add-ons marketplace screen).

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LockedTile } from "@/src/components/LockedTile";
import { Eyebrow, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS, INDUSTRY_LABEL, Industry, TOKENS } from "@/src/theme/colors";

interface ModuleDef {
  slug: string;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: string;        // explicit native route (if implemented)
  locked?: boolean;     // upgrade-to-unlock pattern
}

// ---------- Section: shared core (every industry) ----------
const CORE: ModuleDef[] = [
  { slug: "incidents", label: "Incidents", sub: "Reports & regulator pipeline", icon: "warning-outline", href: "/incident" },
  { slug: "risks", label: "Risk register", sub: "5×5 matrix + reviews", icon: "alert-circle-outline", href: "/risk" },
  { slug: "risk-reviews", label: "Risk reviews", sub: "Scheduled review cycle", icon: "refresh-circle-outline", locked: true },
  { slug: "workers", label: "Workers / Team members", sub: "Roster + roles", icon: "people-outline", href: "/workers" },
  { slug: "competency", label: "Competency matrix", sub: "Skill x role evidence", icon: "grid-outline", locked: true },
  { slug: "licences", label: "Licences", sub: "Credentials + expiry", icon: "ribbon-outline", href: "/licences" },
  { slug: "alerts", label: "Alerts / Notifications", sub: "Compliance inbox", icon: "notifications-outline", href: "/notifications" },
  { slug: "documents", label: "Document library", sub: "SWMS, policies, evidence", icon: "document-text-outline", locked: true },
  { slug: "reports", label: "Reports", sub: "10 live dashboards", icon: "stats-chart-outline", href: "/reports" },
  { slug: "regulator", label: "Regulator cases", sub: "WorkSafe / NHVR / ACQSC / NDIS", icon: "scale-outline", locked: true },
];

// ---------- Per-industry "Industry" section ----------
const INDUSTRY_MODULES: Record<Industry, ModuleDef[]> = {
  trades: [
    { slug: "trades/swms-library", label: "SWMS library", sub: "Safe Work Method Statements", icon: "document-text-outline", locked: true },
    { slug: "trades/tradeinduct", label: "TradeInduct", sub: "Visitor + crew sign-on", icon: "qr-code-outline", locked: true },
    { slug: "trades/tradecheck", label: "TradeCheck", sub: "Cross-employer credentials", icon: "checkmark-done-outline", locked: true },
  ],
  hospitality: [
    { slug: "hospitality/temperature", label: "Temperature logs", sub: "Fridge / freezer / hot-hold", icon: "thermometer-outline", href: "/hospitality/temperature-logs" },
    { slug: "hospitality/fss", label: "FSS register", sub: "Food Safety Supervisor certs", icon: "ribbon-outline", href: "/hospitality/fss-register" },
    { slug: "hospitality/haccp", label: "HACCP CCP log", sub: "FSANZ 3.2.1 critical limits", icon: "clipboard-outline", href: "/hospitality/haccp" },
    { slug: "hospitality/allergens", label: "Allergens", sub: "14 priority allergens", icon: "alert-outline", href: "/hospitality/allergens" },
    { slug: "hospitality/cleaning", label: "Cleaning schedule", sub: "FSANZ 3.2.3 sign-offs", icon: "sparkles-outline", href: "/hospitality/cleaning" },
    { slug: "hospitality/suppliers", label: "Approved suppliers", sub: "ABN / audit / certificates", icon: "business-outline", href: "/hospitality/suppliers" },
    { slug: "hospitality/liquor", label: "RSA / Liquor", sub: "RSA / RSG / Approved Manager", icon: "wine-outline", href: "/hospitality/liquor" },
    { slug: "hospitality/inspection", label: "Inspection pack", sub: "Council evidence bundle", icon: "folder-open-outline", href: "/hospitality/inspection-pack" },
  ],
  transport: [
    { slug: "transport/vehicles", label: "Fleet vehicles", sub: "Rego + GVM + expiry", icon: "car-outline", href: "/transport/vehicles" },
    { slug: "transport/pretrip", label: "Pre-trip inspections", sub: "NHVR daily check", icon: "construct-outline", href: "/transport/pretrip" },
    { slug: "transport/fatigue", label: "Fatigue logs", sub: "Work diary + breaches", icon: "moon-outline", href: "/transport/fatigue" },
    { slug: "transport/ffd", label: "Fitness for duty", sub: "Pre-shift declaration", icon: "fitness-outline", href: "/transport/fitness-for-duty" },
    { slug: "transport/load", label: "Load restraint", sub: "LRG 3rd Ed records", icon: "cube-outline", locked: true },
    { slug: "transport/mass", label: "Mass declarations", sub: "GML / CML / HML / PBS", icon: "scale-outline", locked: true },
    { slug: "transport/cor", label: "CoR due diligence", sub: "HVNL s 26C log", icon: "shield-checkmark-outline", locked: true },
    { slug: "transport/nhvr", label: "NHVR occurrences", sub: "s 596A 24h reports", icon: "alert-circle-outline", href: "/transport/nhvr" },
  ],
  healthcare: [
    { slug: "healthcare/ahpra", label: "AHPRA register", sub: "Clinician renewals", icon: "ribbon-outline", href: "/healthcare/ahpra" },
    { slug: "healthcare/screening", label: "Worker screening", sub: "NDIS / WWCC / NPC", icon: "shield-checkmark-outline", locked: true },
    { slug: "healthcare/sirs", label: "SIRS incidents", sub: "Reportable incidents", icon: "medkit-outline", locked: true },
    { slug: "healthcare/ndis", label: "NDIS reportable", sub: "Quality & Safeguards", icon: "alert-circle-outline", locked: true },
    { slug: "healthcare/acqsc", label: "ACQSC evidence", sub: "Aged Care Standards", icon: "documents-outline", locked: true },
    { slug: "healthcare/care", label: "Care minutes", sub: "Aged Care evidence", icon: "heart-outline", locked: true },
  ],
  retail: [
    { slug: "retail/lone-worker", label: "Lone-worker shifts", sub: "Active check-ins", icon: "shield-outline", href: "/retail/lone-worker" },
    { slug: "retail/customer-incidents", label: "Customer incidents", sub: "Slip / aggression / theft", icon: "storefront-outline", locked: true },
    { slug: "retail/quick-induct", label: "Quick induct", sub: "Casual / contractor sign-on", icon: "qr-code-outline", locked: true },
    { slug: "retail/roster", label: "Roster eligibility", sub: "Credential gate", icon: "calendar-outline", locked: true },
  ],
};

// ---------- Safety section (all industries via /safety/{module}) ----------
const SAFETY: ModuleDef[] = [
  { slug: "safety-inspections", label: "Inspections", sub: "Site / vehicle / equipment", icon: "search-outline", locked: true },
  { slug: "safety-first_aid", label: "First aid", sub: "Treatments & supplies", icon: "medical-outline", locked: true },
  { slug: "safety-ppe", label: "PPE issue", sub: "Hi-vis, hard-hats, gloves", icon: "shield-outline", locked: true },
  { slug: "safety-plant", label: "Plant register", sub: "Plant & equipment", icon: "build-outline", locked: true },
  { slug: "safety-substances", label: "Hazardous substances", sub: "SDS register", icon: "flask-outline", locked: true },
  { slug: "safety-toolbox_talks", label: "Toolbox talks", sub: "Attendance + topics", icon: "chatbubbles-outline", locked: true },
  { slug: "safety-ai-docs", label: "AI documents", sub: "Generated policies & SWMS", icon: "sparkles-outline", locked: true },
  { slug: "safety-academy", label: "SafeBase Academy", sub: "Microlearning", icon: "school-outline", locked: true },
  { slug: "safety-legacy", label: "Legacy documents", sub: "Imported / archived", icon: "archive-outline", locked: true },
];

// ---------- Workflows section (5 canonical flows) ----------
const WORKFLOWS: ModuleDef[] = [
  { slug: "workflow-new_employee", label: "New employee", sub: "Onboarding stepper", icon: "person-add-outline", locked: true },
  { slug: "workflow-incident_resolution", label: "Incident resolution", sub: "Triage → close-out", icon: "warning-outline", href: "/workflows" },
  { slug: "workflow-swms_job_start", label: "SWMS → job start", sub: "Sign-on workflow", icon: "document-text-outline", locked: true },
  { slug: "workflow-annual_review", label: "Annual WHS review", sub: "Governance cycle", icon: "calendar-outline", locked: true },
  { slug: "workflow-subcontractor", label: "Subcontractor", sub: "Sub-onboarding", icon: "people-circle-outline", locked: true },
];

// ---------- Library section (4 canonical libraries) ----------
const LIBRARY: ModuleDef[] = [
  { slug: "library-process", label: "Process library", sub: "Reusable processes", icon: "git-branch-outline", locked: true },
  { slug: "library-activity", label: "Activity library", sub: "Reusable activities", icon: "list-outline", locked: true },
  { slug: "library-task", label: "Task library", sub: "Reusable tasks", icon: "checkbox-outline", locked: true },
  { slug: "library-control", label: "Control library", sub: "Hazard controls", icon: "shield-checkmark-outline", locked: true },
];

// ---------- Apps & Add-ons section ----------
const ADDONS: ModuleDef[] = [
  { slug: "addon-induct", label: "VenueInduct / TradeInduct", sub: "QR induction programs", icon: "qr-code-outline", locked: true },
  { slug: "addon-check", label: "VenueCheck / TradeCheck", sub: "Verified credentials marketplace", icon: "checkmark-done-outline", locked: true },
  { slug: "addon-academy", label: "Academy LMS", sub: "Microlearning + enrolments", icon: "school-outline", locked: true },
  { slug: "addon-partner", label: "Partner portal", sub: "Manage client accounts", icon: "briefcase-outline", locked: true },
  { slug: "addon-branding", label: "Partner branding", sub: "White-label DNS", icon: "color-palette-outline", locked: true },
  { slug: "addon-automations", label: "Automations", sub: "If-this-then-that recipes", icon: "git-network-outline", locked: true },
  { slug: "addon-webhooks", label: "Webhooks", sub: "Outbound event hooks", icon: "share-social-outline", locked: true },
  { slug: "addon-worker", label: "Mobile worker", sub: "Crew-facing view", icon: "phone-portrait-outline", locked: true },
  { slug: "addon-api", label: "API keys", sub: "Universal API access", icon: "key-outline", locked: true },
];

// ---------- Settings section ----------
const SETTINGS: ModuleDef[] = [
  { slug: "settings-business", label: "Business profile", sub: "ABN, address, ANZSIC", icon: "business-outline", locked: true },
  { slug: "settings-notifications", label: "Notification settings", sub: "Channels & schedules", icon: "notifications-outline", locked: true },
  { slug: "settings-team", label: "Team & invites", sub: "Roles + access", icon: "people-outline", locked: true },
  { slug: "settings-onboarding", label: "Onboarding", sub: "Setup checklist", icon: "checkmark-circle-outline", locked: true },
  { slug: "settings-billing", label: "Billing & plan", sub: "Subscription + invoices", icon: "card-outline", locked: true },
  { slug: "settings-demos", label: "Demo requests", sub: "Marketing inbox", icon: "mail-outline", locked: true },
];

export default function ModulesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const industry = (user?.industry as Industry | undefined) ?? "trades";
  const accent = accentFor(industry);
  const industryModules = INDUSTRY_MODULES[industry] ?? [];

  const open = (m: ModuleDef) => {
    if (m.locked || !m.href) {
      // route to the addons marketplace stub (locked tiles point here)
      router.push(("/module/" + encodeURIComponent(m.slug)) as any);
      return;
    }
    router.push(m.href as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow={INDUSTRY_LABEL[industry]}
          title="Modules"
          subtitle="Every compliance area in one tap. Mirrors your SafeBase web workspace."
          accent={accent}
        />

        <Section label={INDUSTRY_LABEL[industry]} accent={accent} modules={industryModules} onPress={open} />
        <Section label="Core" accent={accent} modules={CORE} onPress={open} />
        <Section label="Safety" accent={accent} modules={SAFETY} onPress={open} />
        <Section label="Workflows" accent={accent} modules={WORKFLOWS} onPress={open} />
        <Section label="Library" accent={accent} modules={LIBRARY} onPress={open} />
        <Section label="Apps & Add-ons" accent={accent} modules={ADDONS} onPress={open} />
        <Section label="Settings" accent={accent} modules={SETTINGS} onPress={open} />

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, accent, modules, onPress }: { label: string; accent: string; modules: ModuleDef[]; onPress: (m: ModuleDef) => void }) {
  if (modules.length === 0) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <Eyebrow color={accent}>{label}</Eyebrow>
      <View style={styles.grid}>
        {modules.map((m) => m.locked ? (
          <LockedTile
            key={m.slug}
            testID={`module-${m.slug.replace(/\//g, "-")}-locked`}
            label={m.label}
            sub={m.sub}
            icon={m.icon}
          />
        ) : (
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
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, marginTop: 4, marginBottom: 14 },
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
