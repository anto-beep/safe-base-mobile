import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Eyebrow, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS } from "@/src/theme/colors";

const BG_URL =
  "https://static.prod-images.emergentagent.com/jobs/a57af9a8-0335-40f6-97fa-83b3bf0ccb34/images/e2639357d86dc06451309c2a23ef4c6923fefafaaf402b431bee8c616f961842.png";
const LOGO_URL =
  "https://static.prod-images.emergentagent.com/jobs/a57af9a8-0335-40f6-97fa-83b3bf0ccb34/images/c702745f1f1cc63d7a12ca70af438f9155de31bf6dced284a1292e2f66f65406.png";

export default function Login() {
  const { login, loginWithEmergentSession, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

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
        // Hash fragments may land in url.fragment via parse — fall back manual.
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
      // /api/auth/google-session on the external SafeBase backend may not
      // accept the Emergent session shape — surface the error clearly.
      const msg = e?.detail ?? e?.message ?? "Google sign-in failed.";
      Alert.alert("Google sign-in", msg);
      setError(msg);
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <ImageBackground source={{ uri: BG_URL }} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} contentFit="contain" />
              <Eyebrow color={COLORS.warning}>SafeBase</Eyebrow>
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
                accent={COLORS.warning}
              />
              <Input
                testID="login-password-input"
                label="Password"
                secureTextEntry
                autoComplete="password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                accent={COLORS.warning}
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
                accent={COLORS.warning}
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

              <TouchableOpacity
                testID="login-forgot-link"
                onPress={() => router.push("/forgot-password")}
                style={styles.linkRow}
              >
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>Don&apos;t have an account?</Text>
                <TouchableOpacity testID="login-go-register" onPress={() => router.push("/register")}>
                  <Text style={[styles.bottomText, { color: COLORS.warning, fontWeight: "800" }]}>
                    {"  "}Create one
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.demoBox}>
                <Eyebrow color={COLORS.textMuted}>Demo accounts</Eyebrow>
                <Text style={styles.demoText}>trades.demo@safebase.com.au · Demo@1234</Text>
                <Text style={styles.demoText}>hospitality.demo@safebase.com.au · Demo@1234</Text>
                <Text style={styles.demoText}>transport.demo@safebase.com.au · Demo@1234</Text>
                <Text style={styles.demoText}>healthcare.demo@safebase.com.au · Demo@1234</Text>
                <Text style={styles.demoText}>retail.demo@safebase.com.au · Demo@1234</Text>
              </View>
            </View>

            <View style={{ height: 32 }} />

            <View style={styles.footer}>
              <View style={styles.dot} />
              <Text style={styles.footerText}>
                Pointing at: {(process.env.EXPO_PUBLIC_SAFEBASE_API ?? "safebase backend").replace(/^https?:\/\//, "")}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.appBg },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay },
  content: { padding: 24, paddingTop: 24 },
  header: { marginBottom: 24 },
  logo: { width: 48, height: 48, marginBottom: 18 },
  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  error: { color: COLORS.error, fontSize: 14, marginBottom: 10 },
  linkRow: { paddingVertical: 12, alignItems: "center" },
  linkText: { color: COLORS.textSecondary, fontSize: 13, textDecorationLine: "underline" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  bottomRow: { flexDirection: "row", justifyContent: "center", paddingTop: 12 },
  bottomText: { color: COLORS.textSecondary, fontSize: 14 },
  demoBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: COLORS.appBg,
  },
  demoText: { color: COLORS.textMuted, fontSize: 11, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, backgroundColor: COLORS.success, marginRight: 8 },
  footerText: { color: COLORS.textMuted, fontSize: 11 },
});
