// Billing dashboard — the single screen that drives all subscription UX:
//   • lists every industry with its current status (trial / active /
//     canceling / none),
//   • lets users Start Free Trial for un-subscribed industries,
//   • lets users Upgrade (paid checkout via Stripe URL in a browser),
//   • lets users Cancel an active sub,
//   • lets users Change tier within an industry.
//
// Stripe Checkout is opened via expo-web-browser (in-app browser); on return
// we refresh /billing/my-subscriptions.

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BillingApi, IndustrySlug, Plan, formatAud } from "@/src/api/billing";
import { Card, Eyebrow, PrimaryButton, ScreenHeader, SecondaryButton, Pill } from "@/src/components/ui";
import { ALL_INDUSTRIES, useBilling } from "@/src/context/BillingContext";
import { accentFor, COLORS, INDUSTRY_ACCENT, INDUSTRY_LABEL, TOKENS } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";

export default function BillingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const accent = accentFor(user?.industry);
  const { subscriptions, statusFor, refresh, startTrial, cancel, change } = useBilling();
  const [busy, setBusy] = useState<string | null>(null); // industry currently transitioning
  const [plansOpen, setPlansOpen] = useState<IndustrySlug | null>(null);

  // Always refresh on focus so the screen reflects post-Stripe-return state.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleStartTrial = async (ind: IndustrySlug) => {
    setBusy(ind);
    try {
      await startTrial(ind);
      Alert.alert(
        "Trial started",
        `Your 14-day ${INDUSTRY_LABEL[ind]} free trial is now active. Everything is unlocked.`,
      );
    } catch (e: any) {
      Alert.alert("Could not start trial", e?.detail ?? "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleUpgrade = async (ind: IndustrySlug, tier_slug?: string) => {
    setBusy(ind);
    try {
      const r = await BillingApi.checkoutIndustry(ind, tier_slug);
      const url = r.url ?? r.checkout_url;
      if (!url) {
        // Backend may return a non-URL response; refresh and notify.
        await refresh();
        Alert.alert("Upgrade started", "Your subscription has been updated.");
        return;
      }
      await WebBrowser.openBrowserAsync(url);
      // After the user returns from Stripe, re-sync state.
      await refresh();
    } catch (e: any) {
      Alert.alert("Couldn't start checkout", e?.detail ?? "Please try again.");
    } finally {
      setBusy(null);
      setPlansOpen(null);
    }
  };

  const handleCancel = async (ind: IndustrySlug) => {
    Alert.alert(
      `Cancel ${INDUSTRY_LABEL[ind]} plan?`,
      "You'll keep access until the end of your current period.",
      [
        { text: "Keep plan", style: "cancel" },
        {
          text: "Cancel plan",
          style: "destructive",
          onPress: async () => {
            setBusy(ind);
            try {
              await cancel(ind);
            } catch (e: any) {
              Alert.alert("Couldn't cancel", e?.detail ?? "Please try again.");
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <ScreenHeader
          eyebrow="Plan"
          title="Billing"
          subtitle="14-day free trial · unlock every module across every industry. Upgrade any time."
          accent={accent}
        />

        {ALL_INDUSTRIES.map((ind) => {
          const st = statusFor(ind as IndustrySlug);
          const cAccent = INDUSTRY_ACCENT[ind as IndustrySlug] ?? accent;
          const isBusy = busy === ind;
          return (
            <Card key={ind} testID={`billing-card-${ind}`}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Eyebrow color={cAccent}>{INDUSTRY_LABEL[ind as IndustrySlug]}</Eyebrow>
                  <Text style={styles.industryName}>{INDUSTRY_LABEL[ind as IndustrySlug]}</Text>
                </View>
                <StatusBadge kind={st.kind} daysLeft={st.daysLeft} />
              </View>

              {st.kind === "trial" ? (
                <Text style={styles.note}>
                  {st.daysLeft ?? 0} day{st.daysLeft === 1 ? "" : "s"} left in your free trial. Everything in this industry is unlocked.
                </Text>
              ) : null}
              {st.kind === "active" ? (
                <Text style={styles.note}>
                  Subscription active{st.tier ? ` · ${st.tier.replace(/_/g, " ")}` : ""}{st.cycle ? ` · ${st.cycle}` : ""}.
                </Text>
              ) : null}
              {st.kind === "canceling" ? (
                <Text style={styles.note}>
                  Canceling · access until {st.endsAt ? new Date(st.endsAt).toLocaleDateString("en-AU") : "period end"}.
                </Text>
              ) : null}
              {st.kind === "expired" ? (
                <Text style={styles.note}>Trial expired. Upgrade to keep access.</Text>
              ) : null}
              {st.kind === "none" ? (
                <Text style={styles.note}>Not subscribed yet. Start a 14-day free trial — every module unlocked, no card required.</Text>
              ) : null}

              <View style={styles.actions}>
                {st.kind === "none" || st.kind === "expired" ? (
                  <PrimaryButton
                    testID={`billing-trial-${ind}`}
                    label={isBusy ? "Starting…" : "Start free trial"}
                    iconName="gift-outline"
                    accent={cAccent}
                    onPress={() => handleStartTrial(ind as IndustrySlug)}
                    loading={isBusy}
                  />
                ) : null}

                {st.kind === "trial" || st.kind === "expired" || st.kind === "canceling" ? (
                  <View style={{ marginTop: st.kind === "none" ? 8 : 0 }}>
                    <PrimaryButton
                      testID={`billing-upgrade-${ind}`}
                      label="View plans & upgrade"
                      iconName="rocket-outline"
                      accent={cAccent}
                      onPress={() => setPlansOpen(ind as IndustrySlug)}
                    />
                  </View>
                ) : null}

                {st.kind === "active" ? (
                  <View>
                    <SecondaryButton
                      testID={`billing-change-${ind}`}
                      label="Change plan"
                      iconName="swap-horizontal-outline"
                      onPress={() => setPlansOpen(ind as IndustrySlug)}
                    />
                    <View style={{ height: 8 }} />
                    <TouchableOpacity
                      testID={`billing-cancel-${ind}`}
                      onPress={() => handleCancel(ind as IndustrySlug)}
                      style={styles.cancelBtn}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.cancelText}>Cancel plan</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>

      <PlansSheet
        visible={!!plansOpen}
        industry={plansOpen}
        onClose={() => setPlansOpen(null)}
        onPick={(slug) => plansOpen && handleUpgrade(plansOpen, slug)}
      />
    </SafeAreaView>
  );
}

function StatusBadge({ kind, daysLeft }: { kind: string; daysLeft?: number }) {
  if (kind === "trial") return <Pill label={`TRIAL · ${daysLeft ?? 0}D LEFT`} color={TOKENS.authority} />;
  if (kind === "active") return <Pill label="ACTIVE" color={TOKENS.success} />;
  if (kind === "canceling") return <Pill label="CANCELING" color={TOKENS.warning} />;
  if (kind === "expired") return <Pill label="EXPIRED" color={TOKENS.destructive} />;
  return <Pill label="NOT SUBSCRIBED" color={COLORS.textMuted} />;
}

function PlansSheet({
  visible,
  industry,
  onClose,
  onPick,
}: {
  visible: boolean;
  industry: IndustrySlug | null;
  onClose: () => void;
  onPick: (slug: string) => void;
}) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const accent = industry ? INDUSTRY_ACCENT[industry] : TOKENS.authority;

  useEffect(() => {
    if (!visible || !industry) return;
    setLoading(true);
    setErr(null);
    BillingApi.plans(industry)
      .then((r) => setPlans(r.plans ?? []))
      .catch((e: any) => setErr(e?.detail ?? "Could not load plans."))
      .finally(() => setLoading(false));
  }, [visible, industry]);

  const filtered = (plans ?? []).filter((p) => p.cycle === cycle);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet} testID="plans-sheet">
        <View style={styles.sheetHeader}>
          <Eyebrow color={accent}>Plans</Eyebrow>
          <TouchableOpacity testID="plans-close" onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sheetTitle}>
          {industry ? INDUSTRY_LABEL[industry] : ""} plans
        </Text>

        <View style={styles.cycleRow}>
          {(["monthly", "annual"] as const).map((c) => {
            const active = cycle === c;
            return (
              <TouchableOpacity
                key={c}
                testID={`plan-cycle-${c}`}
                onPress={() => setCycle(c)}
                style={[styles.cycleChip, { borderColor: active ? accent : COLORS.border, backgroundColor: active ? `${accent}1A` : "transparent" }]}
              >
                <Text style={[styles.cycleText, { color: active ? COLORS.textPrimary : COLORS.textSecondary }]}>{c.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={{ marginTop: 8 }}>
          {loading ? <ActivityIndicator color={accent} style={{ marginTop: 16 }} /> : null}
          {err ? <Text style={{ color: TOKENS.destructive, marginTop: 12 }}>{err}</Text> : null}
          {!loading && filtered.length === 0 ? (
            <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>No plans available.</Text>
          ) : null}
          {filtered.map((p) => (
            <TouchableOpacity
              key={p.slug}
              testID={`plan-${p.slug}`}
              onPress={() => onPick(p.slug)}
              activeOpacity={0.85}
              style={[styles.planRow, { borderColor: accent }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.planLabel}>{p.label}</Text>
                <Text style={styles.planMeta}>Up to {p.worker_cap} {p.worker_cap === 1 ? "worker" : "workers"} · {p.cycle}</Text>
              </View>
              <View>
                <Text style={styles.planPrice}>{formatAud(p.amount)}</Text>
                <Text style={styles.planCurrency}>{p.currency.toUpperCase()}/{p.cycle === "monthly" ? "mo" : "yr"}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  industryName: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 2 },
  note: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginVertical: 8 },
  actions: { marginTop: 6 },
  cancelBtn: { padding: 10, alignItems: "center" },
  cancelText: { color: COLORS.error, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000099" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: COLORS.appBg, borderTopWidth: 1, borderTopColor: COLORS.border, padding: 20, maxHeight: "85%" },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800" },
  cycleRow: { flexDirection: "row", marginTop: 12 },
  cycleChip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  cycleText: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  planRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 14, marginBottom: 10 },
  planLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  planMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  planPrice: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800", textAlign: "right" },
  planCurrency: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700", textAlign: "right", letterSpacing: 0.6 },
});
