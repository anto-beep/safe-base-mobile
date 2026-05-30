// Plan Rightsizer — 3-question client-side wizard that mirrors the
// SafeBase web app's /plan-rightsizer tool. Pulls plans from
// GET /billing/plans?industry=X and recommends the smallest tier whose
// worker_cap covers the user's team size. Multi-location workspaces get
// bumped to the next tier so the regulator coverage matches.

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BillingApi, IndustrySlug, Plan, formatAud } from "@/src/api/billing";
import { Card, Eyebrow, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { ALL_INDUSTRIES } from "@/src/context/BillingContext";
import { COLORS, INDUSTRY_ACCENT, INDUSTRY_LABEL, TOKENS } from "@/src/theme/colors";

type Step = 0 | 1 | 2 | 3;

export default function PlanRightsizer() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ industry?: string }>();

  const initialInd: IndustrySlug | null = (() => {
    const fromQ = params.industry as string | undefined;
    if (fromQ && (ALL_INDUSTRIES as readonly string[]).includes(fromQ)) return fromQ as IndustrySlug;
    const fromUser = (user?.primary_industry ?? user?.industry) as string | undefined;
    if (fromUser && (ALL_INDUSTRIES as readonly string[]).includes(fromUser)) return fromUser as IndustrySlug;
    return null;
  })();

  const [step, setStep] = useState<Step>(initialInd ? 1 : 0);
  const [industry, setIndustry] = useState<IndustrySlug | null>(initialInd);
  const [teamSize, setTeamSize] = useState<string>("");
  const [locations, setLocations] = useState<string>("");
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const accent = industry ? INDUSTRY_ACCENT[industry] : TOKENS.authority;

  // Lazy-load plans when we reach the result step.
  useEffect(() => {
    if (step !== 3 || !industry) return;
    setLoading(true); setErr(null);
    BillingApi.plans(industry)
      .then((r) => setPlans(r.plans ?? []))
      .catch((e: any) => setErr(e?.detail ?? "Could not load plans."))
      .finally(() => setLoading(false));
  }, [step, industry]);

  // Recommendation: smallest tier whose worker_cap >= teamSize. If multiple
  // locations, bump to the next tier (operational complexity reward).
  const recommendation = useMemo(() => {
    if (!plans || plans.length === 0) return null;
    const size = Math.max(1, parseInt(teamSize || "1", 10) || 1);
    const locs = Math.max(1, parseInt(locations || "1", 10) || 1);
    // Pick a default cycle: annual saves money so we lead with it.
    const annual = plans.filter((p) => p.cycle === "annual").sort((a, b) => a.worker_cap - b.worker_cap);
    if (annual.length === 0) return null;
    // Smallest tier that covers the team.
    let pick = annual.find((p) => p.worker_cap >= size) ?? annual[annual.length - 1];
    // Multi-location bump.
    if (locs >= 2) {
      const i = annual.indexOf(pick);
      if (i >= 0 && i + 1 < annual.length) pick = annual[i + 1];
    }
    const monthlyTwin = plans.find((p) => p.cycle === "monthly" && p.tier === pick.tier) ?? null;
    return { pick, monthlyTwin, size, locs };
  }, [plans, teamSize, locations]);

  const handleUpgrade = () => {
    if (!industry) return;
    router.replace(`/billing?industry=${industry}` as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          testID="rightsizer-back"
          onPress={() => (step === 0 ? router.back() : setStep((step - 1) as Step))}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          <Text style={styles.backText}>{step === 0 ? "Back" : "Previous question"}</Text>
        </TouchableOpacity>

        <ScreenHeader
          eyebrow={`Step ${Math.min(step + 1, 3)} of 3 · ${[
            "Industry",
            "Team size",
            "Locations",
            "Recommendation",
          ][step]}`}
          title={
            step === 3
              ? "Your right-sized plan"
              : [
                  "What industry are you in?",
                  "How many workers will use SafeBase?",
                  "How many sites or locations?",
                ][step]
          }
          subtitle={
            step === 3
              ? "Based on your team and locations — cancel or change anytime."
              : "Three quick questions and we'll pick the smallest plan that covers you."
          }
          accent={accent}
        />

        {step === 0 ? (
          <View>
            {(ALL_INDUSTRIES as IndustrySlug[]).map((ind) => {
              const active = industry === ind;
              const a = INDUSTRY_ACCENT[ind];
              return (
                <TouchableOpacity
                  key={ind}
                  testID={`rightsizer-industry-${ind}`}
                  onPress={() => {
                    setIndustry(ind);
                    setStep(1);
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.industryTile,
                    {
                      borderColor: active ? a : COLORS.border,
                      backgroundColor: active ? `${a}1A` : COLORS.surface,
                    },
                  ]}
                >
                  <View style={[styles.industryDot, { backgroundColor: a }]} />
                  <Text style={styles.industryName}>{INDUSTRY_LABEL[ind]}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {step === 1 ? (
          <Card>
            <Eyebrow color={accent}>Workers</Eyebrow>
            <Text style={styles.hint}>Include full-time, casual and subcontractor logins.</Text>
            <TextInput
              testID="rightsizer-team-size"
              keyboardType="number-pad"
              placeholder="e.g. 12"
              placeholderTextColor={COLORS.textMuted}
              value={teamSize}
              onChangeText={setTeamSize}
              style={[styles.numberInput, { borderColor: accent }]}
            />
            <View style={styles.bucketRow}>
              {["1", "5", "15", "50"].map((n) => (
                <TouchableOpacity
                  key={n}
                  testID={`rightsizer-bucket-team-${n}`}
                  onPress={() => setTeamSize(n)}
                  style={[styles.bucketChip, { borderColor: teamSize === n ? accent : COLORS.border }]}
                >
                  <Text style={styles.bucketChipText}>{n}{n === "50" ? "+" : ""}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton
              testID="rightsizer-next-2"
              label="Continue"
              accent={accent}
              onPress={() => setStep(2)}
              disabled={!parseInt(teamSize || "0", 10)}
              iconName="arrow-forward"
            />
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <Eyebrow color={accent}>Locations</Eyebrow>
            <Text style={styles.hint}>Sites, vans, vehicles or venues your workers operate from.</Text>
            <TextInput
              testID="rightsizer-locations"
              keyboardType="number-pad"
              placeholder="e.g. 1"
              placeholderTextColor={COLORS.textMuted}
              value={locations}
              onChangeText={setLocations}
              style={[styles.numberInput, { borderColor: accent }]}
            />
            <View style={styles.bucketRow}>
              {["1", "2", "5", "10"].map((n) => (
                <TouchableOpacity
                  key={n}
                  testID={`rightsizer-bucket-loc-${n}`}
                  onPress={() => setLocations(n)}
                  style={[styles.bucketChip, { borderColor: locations === n ? accent : COLORS.border }]}
                >
                  <Text style={styles.bucketChipText}>{n}{n === "10" ? "+" : ""}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton
              testID="rightsizer-show-result"
              label="See my plan"
              accent={accent}
              onPress={() => setStep(3)}
              disabled={!parseInt(locations || "0", 10)}
              iconName="sparkles"
            />
          </Card>
        ) : null}

        {step === 3 ? (
          <View>
            {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> : null}
            {err ? <Text style={{ color: TOKENS.destructive, marginTop: 12 }}>{err}</Text> : null}
            {recommendation ? (
              <Card>
                <Eyebrow color={accent}>Recommended tier</Eyebrow>
                <Text style={styles.recoTitle}>{recommendation.pick.label}</Text>
                <Text style={styles.recoPrice}>
                  {formatAud(recommendation.pick.amount)} <Text style={styles.recoPriceUnit}>{recommendation.pick.currency.toUpperCase()}/yr</Text>
                </Text>
                {recommendation.monthlyTwin ? (
                  <Text style={styles.recoMonthly}>
                    or {formatAud(recommendation.monthlyTwin.amount)} {recommendation.monthlyTwin.currency.toUpperCase()}/month
                  </Text>
                ) : null}
                <View style={styles.recoMetaRow}>
                  <RecoMeta label="Workers" value={`${recommendation.size}`} cap={`up to ${recommendation.pick.worker_cap}`} />
                  <RecoMeta label="Locations" value={`${recommendation.locs}`} cap={recommendation.locs >= 2 ? "bumped tier" : "single site"} />
                </View>
                <PrimaryButton
                  testID="rightsizer-upgrade"
                  label="Continue to upgrade"
                  accent={accent}
                  onPress={handleUpgrade}
                  iconName="rocket-outline"
                />
              </Card>
            ) : null}
            {!loading && plans && plans.length === 0 ? (
              <Card>
                <Text style={styles.hint}>
                  No plans available for {industry ? INDUSTRY_LABEL[industry] : "this industry"} yet. Check back soon.
                </Text>
              </Card>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RecoMeta({ label, value, cap }: { label: string; value: string; cap: string }) {
  return (
    <View style={styles.recoMetaCol}>
      <Text style={styles.recoMetaVal}>{value}</Text>
      <Text style={styles.recoMetaLabel}>{label}</Text>
      <Text style={styles.recoMetaCap}>{cap}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 14, marginLeft: 4 },
  hint: { color: COLORS.textMuted, fontSize: 13, marginVertical: 8, lineHeight: 18 },
  industryTile: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 14, marginBottom: 10 },
  industryDot: { width: 10, height: 10, marginRight: 12 },
  industryName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700", flex: 1 },
  numberInput: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "800", borderWidth: 1, padding: 12, marginVertical: 10 },
  bucketRow: { flexDirection: "row", marginBottom: 14 },
  bucketChip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  bucketChipText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700" },
  recoTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 6 },
  recoPrice: { color: COLORS.textPrimary, fontSize: 32, fontWeight: "800", marginTop: 4 },
  recoPriceUnit: { color: COLORS.textMuted, fontSize: 13, fontWeight: "700" },
  recoMonthly: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  recoMetaRow: { flexDirection: "row", marginVertical: 14 },
  recoMetaCol: { flex: 1 },
  recoMetaVal: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800" },
  recoMetaLabel: { color: COLORS.textPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 2 },
  recoMetaCap: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
});
