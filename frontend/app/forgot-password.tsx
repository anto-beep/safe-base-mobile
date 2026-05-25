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

import { api } from "@/src/api/client";
import { Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { COLORS } from "@/src/theme/colors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const submit = async () => {
    setStatus(null);
    if (!email.trim()) {
      setStatus({ ok: false, msg: "Enter your account email." });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStatus({
        ok: true,
        msg: "If an account exists for that email, you'll get a reset link shortly.",
      });
    } catch (e: any) {
      // Always show a generic success to avoid email enumeration, but log the real reason.
      setStatus({
        ok: true,
        msg: "If an account exists for that email, you'll get a reset link shortly.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="forgot-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Back to sign in</Text>
          </TouchableOpacity>

          <Eyebrow color={COLORS.warning}>Reset password</Eyebrow>
          <Text style={styles.title}>We&apos;ll email you a reset link.</Text>
          <Text style={styles.subtitle}>
            Enter the email address tied to your SafeBase account. Links expire in 1 hour.
          </Text>

          <View style={{ height: 24 }} />

          <Input
            testID="forgot-email-input"
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@company.com.au"
            value={email}
            onChangeText={setEmail}
            accent={COLORS.warning}
          />

          {status ? (
            <Text
              testID="forgot-status"
              style={[styles.status, { color: status.ok ? COLORS.success : COLORS.error }]}
            >
              {status.msg}
            </Text>
          ) : null}

          <PrimaryButton
            testID="forgot-submit"
            label="Send reset link"
            onPress={submit}
            accent={COLORS.warning}
            loading={loading}
          />
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
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  status: { fontSize: 13, marginBottom: 12 },
});
