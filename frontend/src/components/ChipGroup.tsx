// Multi-select chip group, shared across stage forms.
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Eyebrow } from "@/src/components/ui";
import { COLORS, TOKENS } from "@/src/theme/colors";

interface Props<T extends string | number> {
  label?: string;
  options: { value: T; label: string }[] | readonly { value: T; label: string }[];
  values: T[];
  onChange: (next: T[]) => void;
  accent: string;
  singleSelect?: boolean;
  testIDPrefix?: string;
  helper?: string;
}

export function ChipGroup<T extends string | number>({
  label,
  options,
  values,
  onChange,
  accent,
  singleSelect,
  testIDPrefix,
  helper,
}: Props<T>) {
  const toggle = (v: T) => {
    if (singleSelect) {
      onChange(values.includes(v) ? [] : [v]);
      return;
    }
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Eyebrow color={accent}>{label}</Eyebrow> : null}
      <View style={styles.row}>
        {options.map((o) => {
          const active = values.includes(o.value);
          return (
            <TouchableOpacity
              key={String(o.value)}
              testID={testIDPrefix ? `${testIDPrefix}-${o.value}` : undefined}
              activeOpacity={0.85}
              onPress={() => toggle(o.value)}
              style={[styles.chip, { borderColor: active ? accent : TOKENS.border, backgroundColor: active ? `${accent}1A` : TOKENS.background }]}
            >
              <Text style={[styles.label, { color: active ? TOKENS.ink : COLORS.textSecondary }]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap" },
  chip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, marginRight: 6, marginBottom: 6, minHeight: 36, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 13, fontWeight: "600" },
  helper: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
