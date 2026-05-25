import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
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

import { api } from "@/src/api/client";
import { Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS } from "@/src/theme/colors";

export type FieldType = "text" | "longtext" | "number" | "select" | "boolean";

export interface CaptureField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean;
  numericKeyboard?: boolean;
}

export interface CaptureFormScreenProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  endpoint: string;
  fields: CaptureField[];
  transform?: (values: Record<string, any>, user: any) => Record<string, any>;
  successMessage?: string;
  testIdPrefix: string;
}

export function CaptureFormScreen(props: CaptureFormScreenProps) {
  const { user } = useAuth();
  const accent = accentFor(user?.industry);
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of props.fields) {
      init[f.key] =
        f.defaultValue !== undefined
          ? f.defaultValue
          : f.type === "boolean"
            ? false
            : "";
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (k: string, v: any) => setValues((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(null);
    for (const f of props.fields) {
      if (f.required) {
        const v = values[f.key];
        if (v === "" || v === undefined || v === null) {
          setError(`"${f.label}" is required.`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      const body = props.transform ? props.transform(values, user) : values;
      await api.post(props.endpoint, body);
      Alert.alert(
        "Submitted",
        props.successMessage ?? "Your capture has been logged to SafeBase.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            testID={`${props.testIdPrefix}-back`}
            style={styles.backRow}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Eyebrow color={accent}>{props.eyebrow}</Eyebrow>
          <Text style={styles.title}>{props.title}</Text>
          <Text style={styles.subtitle}>{props.subtitle}</Text>

          <View style={{ height: 18 }} />

          {props.fields.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              value={values[f.key]}
              onChange={(v) => setField(f.key, v)}
              accent={accent}
              testIdPrefix={props.testIdPrefix}
            />
          ))}

          {error ? (
            <Text testID={`${props.testIdPrefix}-error`} style={styles.error}>
              {error}
            </Text>
          ) : null}

          <PrimaryButton
            testID={`${props.testIdPrefix}-submit`}
            label={props.submitLabel}
            onPress={submit}
            accent={accent}
            loading={submitting}
          />
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  accent,
  testIdPrefix,
}: {
  field: CaptureField;
  value: any;
  onChange: (v: any) => void;
  accent: string;
  testIdPrefix: string;
}) {
  if (field.type === "boolean") {
    return (
      <TouchableOpacity
        testID={`${testIdPrefix}-${field.key}`}
        style={[styles.boolRow, { borderColor: value ? accent : COLORS.border }]}
        onPress={() => onChange(!value)}
        activeOpacity={0.85}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: value ? accent : COLORS.border, backgroundColor: value ? accent : "transparent" },
          ]}
        >
          {value ? <Ionicons name="checkmark" size={16} color={COLORS.appBg} /> : null}
        </View>
        <Text style={styles.boolLabel}>{field.label}</Text>
      </TouchableOpacity>
    );
  }
  if (field.type === "select") {
    return (
      <View style={{ marginBottom: 14 }}>
        <Eyebrow color={COLORS.textSecondary}>{field.label}</Eyebrow>
        <View style={styles.optionWrap}>
          {field.options?.map((opt) => {
            const active = value === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                testID={`${testIdPrefix}-${field.key}-${opt.value}`}
                onPress={() => onChange(opt.value)}
                activeOpacity={0.85}
                style={[
                  styles.option,
                  { borderColor: active ? accent : COLORS.border, backgroundColor: active ? `${accent}1A` : "transparent" },
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    { color: active ? COLORS.textPrimary : COLORS.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }
  return (
    <Input
      testID={`${testIdPrefix}-${field.key}`}
      label={field.label}
      value={String(value ?? "")}
      onChangeText={(t) => {
        if (field.type === "number") {
          // Allow empty string, otherwise parse to number
          if (t === "" || t === "-") onChange(t);
          else {
            const n = Number(t);
            onChange(Number.isFinite(n) ? n : t);
          }
        } else {
          onChange(t);
        }
      }}
      placeholder={field.placeholder}
      accent={accent}
      multiline={field.type === "longtext"}
      keyboardType={field.type === "number" ? "decimal-pad" : "default"}
      style={field.type === "longtext" ? { minHeight: 100, textAlignVertical: "top" } : undefined}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  error: { color: COLORS.error, fontSize: 14, marginBottom: 10 },
  boolRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  boolLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "600", flex: 1 },
  optionWrap: { flexDirection: "row", flexWrap: "wrap" },
  option: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  optionLabel: { fontSize: 14, fontWeight: "600" },
});
