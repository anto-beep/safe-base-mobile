// Sign-up wizard — 3 steps that mirror the SafeBase web app:
//   Step 1: Industry tile (5 large taps)
//   Step 2: Role chosen from ROLES_BY_INDUSTRY[selectedIndustry] — never a
//           hard-coded set; rebuilds whenever industry changes
//   Step 3: Account details + terms + marketing opt-in + submit
//
// Wizard state (industry + role) persists to AsyncStorage so a backgrounded
// app resumes where the user left off.
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import {
  getRolesFor,
  IndustryKey,
  landingRouteForVariant,
  RoleDef,
  ROLES_BY_INDUSTRY,
} from "@/src/data/rolesByIndustry";
import { COLORS, INDUSTRY_ACCENT, INDUSTRY_LABEL, INDUSTRY_TAGLINE, TOKENS } from "@/src/theme/colors";
import { storage } from "@/src/utils/storage";

const INDUSTRIES = Object.keys(ROLES_BY_INDUSTRY) as IndustryKey[];
const WIZARD_STATE_KEY = "safebase.register.wizard";
type StepIndex = 0 | 1 | 2;

interface WizardState {
  industry?: IndustryKey;
  roleId?: string;
}

export default function Register() {
  const { register, loading } = useAuth();

  // Wizard state
  const [step, setStep] = useState<StepIndex>(0);
  const [industry, setIndustry] = useState<IndustryKey | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);

  // Step 3 form
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- Persistence: hydrate on mount, save on industry/role change -----
  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(WIZARD_STATE_KEY, "");
      if (!raw) return;
      try {
        const parsed: WizardState = JSON.parse(raw);
        if (parsed.industry && (INDUSTRIES as string[]).includes(parsed.industry)) {
          setIndustry(parsed.industry as IndustryKey);
        }
        if (parsed.roleId) setRoleId(parsed.roleId);
      } catch {
        // ignore — wizard starts fresh
      }
    })();
  }, []);

  useEffect(() => {
    const state: WizardState = { industry: industry ?? undefined, roleId: roleId ?? undefined };
    storage.setItem(WIZARD_STATE_KEY, JSON.stringify(state)).catch(() => null);
  }, [industry, roleId]);

  // Roles list — computed live from the selected industry. Rebuilds when
  // industry changes; never cached against a stale industry value.
  const roles: readonly RoleDef[] = useMemo(
    () => (industry ? getRolesFor(industry) : []),
    [industry],
  );

  // When the user changes industry, clear any stale role selection from a
  // previous industry so the role list rebuilds with NO leftover state.
  const selectIndustry = useCallback(
    (next: IndustryKey) => {
      if (next !== industry) setRoleId(null);
      setIndustry(next);
    },
    [industry],
  );

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === roleId) ?? null,
    [roles, roleId],
  );

  // Validators per step.
  const canContinue: boolean = useMemo(() => {
    if (step === 0) return !!industry;
    if (step === 1) return !!selectedRole;
    if (step === 2) {
      if (!name.trim() || !email.trim() || !password) return false;
      if (password.length < 8) return false;
      if (!termsAccepted) return false;
      return true;
    }
    return false;
  }, [step, industry, selectedRole, name, email, password, termsAccepted]);

  const accent = industry ? INDUSTRY_ACCENT[industry] : TOKENS.authority;

  const goNext = useCallback(() => {
    setError(null);
    if (step < 2) setStep(((step + 1) as StepIndex));
  }, [step]);

  const goBack = useCallback(() => {
    setError(null);
    if (step === 0) {
      router.back();
      return;
    }
    setStep(((step - 1) as StepIndex));
  }, [step]);

  const submit = useCallback(async () => {
    if (!industry || !selectedRole) {
      setError("Pick an industry and role first.");
      return;
    }
    setError(null);
    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        company_name: company.trim() || undefined,
        industry,
        // Keep a top-level `role` for older clients/UI gates (worker tab etc.)
        role: selectedRole.permission_role,
        // SafeBase role-catalogue fields — backend validates these.
        role_id: selectedRole.id,
        role_label: selectedRole.label,
        role_variant: selectedRole.variant,
        permission_role: selectedRole.permission_role,
        marketing_opt_in: marketingOptIn,
      });
      // Clear persisted wizard state on success.
      await storage.removeItem(WIZARD_STATE_KEY);
      // Route based on role_variant (returned user may carry variant or fall
      // back to the one we just submitted).
      const variant =
        (result as any)?.role_variant ?? selectedRole.variant;
      router.replace(landingRouteForVariant(variant) as any);
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Sign-up failed.");
    }
  }, [industry, selectedRole, register, name, email, password, company, marketingOptIn]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="register-back" style={styles.backRow} onPress={goBack}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>
              {step === 0 ? "Back" : step === 1 ? "Back to industry" : "Back to role"}
            </Text>
          </TouchableOpacity>

          <StepHeader step={step} accent={accent} />

          {step === 0 ? (
            <StepIndustry
              industry={industry}
              onPick={selectIndustry}
            />
          ) : null}

          {step === 1 ? (
            <StepRole
              industry={industry as IndustryKey}
              roles={roles}
              roleId={roleId}
              onPick={(r) => setRoleId(r.id)}
              accent={accent}
            />
          ) : null}

          {step === 2 ? (
            <StepAccount
              accent={accent}
              name={name} setName={setName}
              company={company} setCompany={setCompany}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              marketingOptIn={marketingOptIn} setMarketingOptIn={setMarketingOptIn}
              termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted}
              roleLabel={selectedRole?.label ?? ""}
              industryLabel={industry ? INDUSTRY_LABEL[industry] : ""}
            />
          ) : null}

          {error ? (
            <Text testID="register-error" style={styles.error}>{error}</Text>
          ) : null}

          <PrimaryButton
            testID={`register-continue-step-${step}`}
            label={step === 2 ? "Create account" : "Continue"}
            onPress={step === 2 ? submit : goNext}
            accent={accent}
            loading={step === 2 ? loading : false}
            disabled={!canContinue}
            iconName={step === 2 ? "checkmark" : "arrow-forward"}
          />

          {step === 0 ? (
            <TouchableOpacity
              testID="register-go-login"
              style={styles.linkRow}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={{ color: accent, fontWeight: "800" }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ───────── Step header ─────────

function StepHeader({ step, accent }: { step: StepIndex; accent: string }) {
  const labels = ["Your industry", "Your role", "Your account"];
  return (
    <View style={{ marginBottom: 18 }}>
      <Eyebrow color={accent}>{`Step ${step + 1} of 3 · ${labels[step]}`}</Eyebrow>
      <Text style={styles.title}>
        {step === 0 ? "What industry are you in?" : step === 1 ? "What's your role?" : "Almost done — let's create your account."}
      </Text>
      <Text style={styles.subtitle}>
        {step === 0
          ? "We tailor every form, register and report to your industry's regulator."
          : step === 1
          ? "Your role unlocks the right dashboard, notifications and capture flows."
          : "14-day free trial. No credit card. Cancel anytime."}
      </Text>

      {/* Dots progress */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i <= step ? accent : COLORS.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ───────── Step 1: Industry ─────────

function StepIndustry({
  industry,
  onPick,
}: {
  industry: IndustryKey | null;
  onPick: (i: IndustryKey) => void;
}) {
  return (
    <View>
      {INDUSTRIES.map((i) => {
        const active = i === industry;
        const a = INDUSTRY_ACCENT[i];
        return (
          <TouchableOpacity
            key={i}
            testID={`register-industry-${i}`}
            onPress={() => onPick(i)}
            style={[
              styles.industryTile,
              {
                borderColor: active ? a : COLORS.border,
                backgroundColor: active ? `${a}1A` : COLORS.surface,
              },
            ]}
            activeOpacity={0.85}
          >
            <View style={[styles.industryIconBox, { borderColor: a, backgroundColor: `${a}10` }]}>
              <View style={[styles.industryDot, { backgroundColor: a }]} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.industryName}>{INDUSTRY_LABEL[i]}</Text>
              <Text style={styles.industrySub}>{INDUSTRY_TAGLINE[i]}</Text>
            </View>
            {active ? (
              <Ionicons name="checkmark-circle" size={22} color={a} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ───────── Step 2: Role ─────────

function StepRole({
  industry,
  roles,
  roleId,
  onPick,
  accent,
}: {
  industry: IndustryKey;
  roles: readonly RoleDef[];
  roleId: string | null;
  onPick: (r: RoleDef) => void;
  accent: string;
}) {
  return (
    <View>
      <View style={[styles.industryPill, { borderColor: accent }]}>
        <View style={[styles.industryDot, { backgroundColor: accent }]} />
        <Text style={styles.industryPillText}>{INDUSTRY_LABEL[industry]}</Text>
        <Text style={styles.industryPillCount}>{roles.length} roles</Text>
      </View>

      {roles.map((r) => {
        const active = r.id === roleId;
        return (
          <TouchableOpacity
            key={r.id}
            testID={`register-role-${r.id}`}
            onPress={() => onPick(r)}
            activeOpacity={0.85}
            style={[
              styles.roleRow,
              { borderColor: active ? accent : COLORS.border, backgroundColor: active ? `${accent}10` : COLORS.surface },
            ]}
          >
            <Text style={[styles.roleLabel, active ? { color: COLORS.textPrimary } : null]}>{r.label}</Text>
            <View style={styles.roleRight}>
              <VariantPill variant={r.variant} active={active} />
              {active ? (
                <Ionicons name="checkmark-circle" size={20} color={accent} style={{ marginLeft: 6 }} />
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function VariantPill({ variant, active }: { variant: RoleDef["variant"]; active?: boolean }) {
  const labels: Record<RoleDef["variant"], string> = {
    owner: "Owner",
    safety_lead: "Safety lead",
    supervisor: "Supervisor",
    worker: "Worker",
  };
  const tones: Record<RoleDef["variant"], string> = {
    owner: TOKENS.authority,
    safety_lead: TOKENS.success,
    supervisor: TOKENS.warning,
    worker: COLORS.textMuted,
  };
  const tone = tones[variant];
  return (
    <View style={[styles.variantPill, { borderColor: tone, backgroundColor: active ? `${tone}1A` : "transparent" }]}>
      <Text style={[styles.variantPillText, { color: tone }]}>{labels[variant].toUpperCase()}</Text>
    </View>
  );
}

// ───────── Step 3: Account ─────────

function StepAccount({
  accent, name, setName, company, setCompany, email, setEmail, password, setPassword,
  marketingOptIn, setMarketingOptIn, termsAccepted, setTermsAccepted, roleLabel, industryLabel,
}: {
  accent: string;
  name: string; setName: (v: string) => void;
  company: string; setCompany: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  marketingOptIn: boolean; setMarketingOptIn: (v: boolean) => void;
  termsAccepted: boolean; setTermsAccepted: (v: boolean) => void;
  roleLabel: string;
  industryLabel: string;
}) {
  return (
    <View>
      <View style={[styles.summaryBox, { borderColor: accent }]}>
        <Eyebrow color={accent}>You're signing up as</Eyebrow>
        <Text style={styles.summaryText}>{roleLabel}{industryLabel ? ` · ${industryLabel}` : ""}</Text>
      </View>

      <Input testID="register-name-input" label="Full name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="Jane Citizen" accent={accent} />
      <Input testID="register-company-input" label="Business name (optional)" value={company} onChangeText={setCompany} placeholder="Acme Trades Pty Ltd" accent={accent} />
      <Input testID="register-email-input" label="Work email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com.au" accent={accent} />
      <Input testID="register-password-input" label="Password (8+ chars)" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" accent={accent} />

      <Checkbox
        testID="register-terms"
        checked={termsAccepted}
        onToggle={() => setTermsAccepted(!termsAccepted)}
        accent={accent}
        label="I agree to the SafeBase Terms of Service and Privacy Policy."
      />
      <Checkbox
        testID="register-marketing"
        checked={marketingOptIn}
        onToggle={() => setMarketingOptIn(!marketingOptIn)}
        accent={accent}
        label="Send me product updates and compliance tips (optional)."
      />
    </View>
  );
}

function Checkbox({ checked, onToggle, accent, label, testID }: { checked: boolean; onToggle: () => void; accent: string; label: string; testID?: string }) {
  return (
    <Pressable testID={testID} onPress={onToggle} style={styles.cbRow}>
      <View
        style={[
          styles.cbBox,
          checked ? { backgroundColor: accent, borderColor: accent } : { borderColor: COLORS.border },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <Text style={styles.cbLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 24, paddingBottom: 60 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, marginTop: 6 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
  dotsRow: { flexDirection: "row", marginTop: 14 },
  dot: { width: 32, height: 4, marginRight: 6 },

  industryTile: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  industryIconBox: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  industryDot: { width: 10, height: 10 },
  industryName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  industrySub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  industryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  industryPillText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700", marginLeft: 10, flex: 1 },
  industryPillCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },

  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  roleLabel: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "600", flex: 1 },
  roleRight: { flexDirection: "row", alignItems: "center" },
  variantPill: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  variantPillText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },

  summaryBox: { borderWidth: 1, padding: 12, marginBottom: 18 },
  summaryText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 4 },

  cbRow: { flexDirection: "row", alignItems: "flex-start", marginVertical: 6 },
  cbBox: { width: 22, height: 22, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 2 },
  cbLabel: { flex: 1, color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },

  error: { color: COLORS.error, fontSize: 14, marginVertical: 10 },
  linkRow: { paddingVertical: 18, alignItems: "center" },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
});
