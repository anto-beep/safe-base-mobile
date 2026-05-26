// Admin login → optional TOTP → admin dashboard.

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import { COLORS, TOKENS } from "@/src/theme/colors";

export default function AdminLogin() {
  // Admin uses warning yellow as accent across the entire admin tree —
  // visually distinct from blue (pre-login) and industry colours (customer).
  const accent = TOKENS.warning;
  const { admin, login, verify2fa, step, loading } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If admin context already has a session, jump straight to the admin tree.
  useEffect(() => {
    if (admin) router.replace("/(admin)");
  }, [admin]);

  const onSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password required.");
      return;
    }
    try {
      const r = await login(email.trim(), password);
      if (!r.requires_2fa) router.replace("/(admin)");
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Sign-in failed.");
    }
  };

  const onVerify = async () => {
    setError(null);
    if (!code.trim()) {
      setError("Enter your 6-digit code.");
      return;
    }
    try {
      await verify2fa(code.trim());
      router.replace("/(admin)");
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Code rejected.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="admin-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Customer sign in</Text>
          </TouchableOpacity>

          <Eyebrow color={accent}>Internal admin</Eyebrow>
          <Text style={styles.title}>SafeBase staff access.</Text>
          <Text style={styles.subtitle}>
            This sign-in is for SafeBase internal staff only. All actions are audited.
          </Text>

          <View style={{ height: 24 }} />

          {step === "needs_2fa" ? (
            <>
              <Input
                testID="admin-totp"
                label="Authenticator code"
                value={code}
                onChangeText={setCode}
                placeholder="123 456"
                keyboardType="number-pad"
                accent={accent}
                maxLength={6}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                testID="admin-verify"
                label="Verify"
                onPress={onVerify}
                accent={accent}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Input
                testID="admin-email"
                label="Admin email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="admin@safebase.internal"
                accent={accent}
              />
              <Input
                testID="admin-password"
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                accent={accent}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                testID="admin-signin"
                label="Sign in"
                onPress={onSignIn}
                accent={accent}
                loading={loading}
              />
            </>
          )}
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
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  error: { color: COLORS.error, fontSize: 14, marginBottom: 10 },
});
