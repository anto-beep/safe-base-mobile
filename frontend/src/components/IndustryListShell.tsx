// IndustryListShell — reusable list + create-form screen scaffold for
// per-industry modules (Hospitality / Transport / Healthcare / Retail).
// Handles: header, back chevron, error/empty/loading states, refresh control,
// form toggle button. Children render the form body and the row body.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, EmptyState, Eyebrow, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

interface Props {
  eyebrow: string;          // e.g. "Hospitality"
  title: string;            // e.g. "FSS Register"
  subtitle?: string;
  toggleLabel?: string;     // e.g. "Add FSS holder"
  formOpen: boolean;
  onToggleForm: () => void;
  formBody?: ReactNode;
  loading: boolean;
  error: string | null;
  empty: { icon?: keyof typeof Ionicons.glyphMap; title: string; body?: string };
  refreshing: boolean;
  onRefresh: () => void;
  rows: ReactNode;          // a fragment of row components (caller-owned)
  rowCount: number;         // for empty-state detection
  stats?: ReactNode;        // optional stats card row above toggle
  rowsEyebrow?: string;
  testIDPrefix?: string;
}

export function IndustryListShell({
  eyebrow, title, subtitle, toggleLabel, formOpen, onToggleForm, formBody,
  loading, error, empty, refreshing, onRefresh, rows, rowCount, stats,
  rowsEyebrow = "Records", testIDPrefix,
}: Props) {
  const accent = useAccent();
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            testID={testIDPrefix ? `${testIDPrefix}-back` : "shell-back"}
            style={styles.back}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <ScreenHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent={accent} />
          {stats}
          {toggleLabel ? (
            <PrimaryButton
              testID={testIDPrefix ? `${testIDPrefix}-toggle` : "shell-toggle"}
              label={formOpen ? "Hide form" : toggleLabel}
              onPress={onToggleForm}
              accent={accent}
              iconName={formOpen ? "chevron-up" : "add-circle"}
            />
          ) : null}
          {formOpen && formBody ? <Card>{formBody}</Card> : null}
          <View style={{ height: 6 }} />
          <Eyebrow color={accent}>{rowsEyebrow}</Eyebrow>
          {loading ? (
            <ActivityIndicator color={accent} style={{ marginTop: 24 }} />
          ) : error ? (
            <Card><Text style={styles.err}>{error}</Text></Card>
          ) : rowCount === 0 ? (
            <EmptyState icon={empty.icon} title={empty.title} body={empty.body} />
          ) : (
            <View>{rows}</View>
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const shellStyles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 12,
    marginBottom: 10,
    backgroundColor: TOKENS.background,
  },
  rowTitle: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  rowMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  err: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
