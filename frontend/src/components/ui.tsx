import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { COLORS, fgForAccent } from "@/src/theme/colors";

export const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// ─── Eyebrow ─────────────────────────────────────────────────────────────
export function Eyebrow({
  children,
  color,
  testID,
}: {
  children: React.ReactNode;
  color?: string;
  testID?: string;
}) {
  return (
    <Text
      testID={testID}
      style={[styles.eyebrow, color ? { color } : null]}
      accessibilityRole="text"
    >
      / {children}
    </Text>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}) {
  return (
    <View testID={testID} style={[styles.card, style as any]}>
      {children}
    </View>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────
export function PrimaryButton({
  label,
  onPress,
  accent,
  loading,
  disabled,
  testID,
  iconName,
}: {
  label: string;
  onPress: () => void;
  accent: string;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}) {
  const fg = fgForAccent(accent);
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: accent, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnRow}>
          {iconName ? <Ionicons name={iconName} size={18} color={fg} style={{ marginRight: 8 }} /> : null}
          <Text style={[styles.btnText, { color: fg }]}>{label.toUpperCase()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({
  label,
  onPress,
  testID,
  disabled,
  iconName,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, styles.btnSecondary, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={styles.btnRow}>
        {iconName ? <Ionicons name={iconName} size={18} color={COLORS.textPrimary} style={{ marginRight: 8 }} /> : null}
        <Text style={[styles.btnText, { color: COLORS.textPrimary }]}>{label.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────
export function Input({
  label,
  accent,
  testID,
  containerStyle,
  ...rest
}: TextInputProps & { label?: string; accent?: string; containerStyle?: ViewStyle }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? <Eyebrow color={COLORS.textSecondary}>{label}</Eyebrow> : null}
      <TextInput
        testID={testID}
        placeholderTextColor={COLORS.textMuted}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && { borderColor: accent ?? COLORS.borderFocus },
          rest.style as any,
        ]}
      />
    </View>
  );
}

// ─── ScreenHeader ────────────────────────────────────────────────────────
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  accent,
  right,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.headerWrap}>
      <View style={{ flex: 1 }}>
        <Eyebrow color={accent}>{eyebrow}</Eyebrow>
        <Text style={styles.h1} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────
export function EmptyState({
  icon = "checkmark-circle-outline",
  title,
  body,
  testID,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.empty}>
      <Ionicons name={icon} size={42} color={COLORS.textMuted} />
      <Text style={[styles.h3, { marginTop: 12 }]}>{title}</Text>
      {body ? <Text style={[styles.subtitle, { textAlign: "center", marginTop: 6 }]}>{body}</Text> : null}
    </View>
  );
}

// ─── Pill ────────────────────────────────────────────────────────────────
export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },  btn: {
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRow: { flexDirection: "row", alignItems: "center" },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: {
    fontWeight: "800",
    letterSpacing: 1.2,
    fontSize: 13,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 18,
  },
  h1: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  h3: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  pillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
});
