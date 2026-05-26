import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/src/components/Logo";
import { Eyebrow, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { biometricCapability, isBiometricEnabled, unlockWithBiometric } from "@/src/hooks/useBiometric";
import { COLORS, TOKENS } from "@/src/theme/colors";

export default function Login() {
  const { login, loginWithEmergentSession, loading, refresh } = useAuth();
  const accent = TOKENS.authority; // Pre-login surfaces ALWAYS use authority blue.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [bioAvailable, setBioAvailable] = useState<{ available: boolean; enabled: boolean; type: string }>({
    available: false,
    enabled: false,
    type: "none",
  });

  useEffect(() => {
    (async () => {
      const cap = await biometricCapability();
      const enabled = await isBiometricEnabled();
      setBioAvailable({ available: cap.available && cap.enrolled, enabled, type: cap.type });
      if (cap.available && cap.enrolled && enabled) {
        const r = await unlockWithBiometric();
        if (r.ok) {
          await refresh();
          router.replace("/(tabs)");
        }
      }
    })();
  }, [refresh]);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Sign-in failed.");
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      const redirectUrl = Linking.createURL("auth");
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type !== "success" || !result.url) {
        setGoogleBusy(false);
        return;
      }
      const parsed = Linking.parse(result.url);
      const sessionId =
        (parsed.queryParams?.session_id as string | undefined) ??
        (() => {
          const hash = result.url.split("#")[1] ?? "";
          const params = new URLSearchParams(hash);
          return params.get("session_id") ?? undefined;
        })();
      if (!sessionId) {
        setError("Google sign-in did not return a session.");
        setGoogleBusy(false);
        return;
      }
      await loginWithEmergentSession(sessionId);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e?.detail ?? e?.message ?? "Google sign-in failed.";
      Alert.alert("Google sign-in", msg);
      setError(msg);
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleBiometric = async () => {
    const r = await unlockWithBiometric();
    if (r.ok) {
      await refresh();
      router.replace("/(tabs)");
    } else if (r.reason) {
      setError(r.reason);
    }
  };

  const bioLabel = bioAvailable.type === "face" ? "Face ID" : "Biometric";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={32} showWordmark />
            <View style={{ height: 22 }} />
            <Eyebrow color={accent}>Sign in</Eyebrow>
            <Text style={styles.title}>Every Industry.{"\n"}Every Obligation.{"\n"}One Platform.</Text>
            <Text style={styles.subtitle}>
              Sign in to your SafeBase workspace to log captures, action alerts and stay regulator-ready.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              testID="login-email-input"
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@company.com.au"
              value={email}
              onChangeText={setEmail}
              accent={accent}
            />
            <Input
              testID="login-password-input"
              label="Password"
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              accent={accent}
            />

            {error ? (
              <Text testID="login-error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <PrimaryButton
              testID="login-submit-button"
              label="Sign in"
              onPress={handleSubmit}
              accent={accent}
              loading={loading}
            />

            <View style={{ height: 12 }} />

            <SecondaryButton
              testID="login-google-button"
              label={googleBusy ? "Opening Google…" : "Continue with Google"}
              onPress={handleGoogle}
              iconName="logo-google"
              disabled={googleBusy}
            />

            {bioAvailable.available && bioAvailable.enabled ? (
              <>
                <View style={{ height: 12 }} />
                <SecondaryButton
                  testID="login-biometric-button"
                  label={`Unlock with ${bioLabel}`}
                  onPress={handleBiometric}
                  iconName={bioAvailable.type === "face" ? "scan-outline" : "finger-print-outline"}
                />
              </>
            ) : null}

            <TouchableOpacity
              testID="login-forgot-link"
              onPress={() => router.push("/forgot-password")}
              style={styles.linkRow}
            >
              <Text style={[styles.linkText, { color: accent }]}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Don&apos;t have an account?</Text>
              <TouchableOpacity testID="login-go-register" onPress={() => router.push("/register")}>
                <Text style={[styles.bottomText, { color: accent, fontWeight: "800" }]}>
                  {"  "}Create one
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="login-admin-link"
              onPress={() => router.push("/admin-login")}
              style={styles.adminLink}
            >
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
              <Text style={[styles.bottomText, { color: COLORS.textMuted, marginLeft: 6, fontSize: 12 }]}>
                SafeBase staff sign-in
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.footerText}>
              {(process.env.EXPO_PUBLIC_SAFEBASE_API ?? "safebase backend").replace(/^https?:\/\//, "")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 24, paddingTop: 24 },
  header: { marginBottom: 24 },
  title: {
    color: TOKENS.ink,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 12 },
  form: { backgroundColor: TOKENS.muted, borderWidth: 1, borderColor: TOKENS.border, padding: 18 },
  error: { color: TOKENS.destructive, fontSize: 14, marginBottom: 10 },
  linkRow: { paddingVertical: 12, alignItems: "center" },
  linkText: { fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
  divider: { height: 1, backgroundColor: TOKENS.border, marginVertical: 6 },
  bottomRow: { flexDirection: "row", justifyContent: "center", paddingTop: 12 },
  bottomText: { color: COLORS.textSecondary, fontSize: 14 },
  adminLink: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingTop: 18 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 32 },
  dot: { width: 6, height: 6, marginRight: 8 },
  footerText: { color: COLORS.textMuted, fontSize: 11 },
});
