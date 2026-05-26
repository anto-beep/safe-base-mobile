import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, INDUSTRY_ACCENT, INDUSTRY_LABEL, Industry, TOKENS } from "@/src/theme/colors";

const INDUSTRIES: Industry[] = ["trades", "hospitality", "transport", "healthcare", "retail"];

export default function Register() {
  const { register, loading } = useAuth();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [industry, setIndustry] = useState<Industry>("trades");
  const [error, setError] = useState<string | null>(null);

  const accent = TOKENS.authority;
  const industryAccent = INDUSTRY_ACCENT[industry];

  // Render hint: register header uses `accent` (blue), industry chip uses
  // `industryAccent` (which is the same as `a` below per-row).

  const submit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        company_name: company.trim() || undefined,
        industry,
        role: "owner",
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Sign-up failed.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="register-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Eyebrow color={accent}>Create workspace</Eyebrow>
          <Text style={styles.title}>Start your 14-day free trial.</Text>
          <Text style={styles.subtitle}>No credit card. Cancel anytime. Your industry, your obligations, one platform.</Text>

          <View style={{ height: 24 }} />

          <Input
            testID="register-name-input"
            label="Full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Jane Citizen"
            accent={accent}
          />
          <Input
            testID="register-company-input"
            label="Company (optional)"
            value={company}
            onChangeText={setCompany}
            placeholder="Acme Trades Pty Ltd"
            accent={accent}
          />
          <Input
            testID="register-email-input"
            label="Work email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@company.com.au"
            accent={accent}
          />
          <Input
            testID="register-password-input"
            label="Password (8+ chars)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            accent={accent}
          />

          <Eyebrow color={COLORS.textSecondary}>Primary industry</Eyebrow>
          <View style={styles.industryGrid}>
            {INDUSTRIES.map((i) => {
              const active = i === industry;
              const a = INDUSTRY_ACCENT[i];
              return (
                <TouchableOpacity
                  key={i}
                  testID={`register-industry-${i}`}
                  onPress={() => setIndustry(i)}
                  style={[
                    styles.industryChip,
                    {
                      borderColor: active ? a : COLORS.border,
                      backgroundColor: active ? `${a}1A` : COLORS.appBg,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <View style={[styles.industryDot, { backgroundColor: a }]} />
                  <Text
                    style={[
                      styles.industryLabel,
                      { color: active ? COLORS.textPrimary : COLORS.textSecondary },
                    ]}
                  >
                    {INDUSTRY_LABEL[i]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? (
            <Text testID="register-error" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <PrimaryButton
            testID="register-submit-button"
            label="Create account"
            onPress={submit}
            accent={accent}
            loading={loading}
          />

          <TouchableOpacity
            testID="register-go-login"
            style={styles.linkRow}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={{ color: accent, fontWeight: "800" }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 24 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  industryGrid: { marginBottom: 18 },
  industryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  industryDot: { width: 10, height: 10, marginRight: 12 },
  industryLabel: { fontSize: 15, fontWeight: "600" },
  error: { color: COLORS.error, fontSize: 14, marginBottom: 10 },
  linkRow: { paddingVertical: 18, alignItems: "center" },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
});
