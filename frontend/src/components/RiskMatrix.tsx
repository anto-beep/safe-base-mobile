// 5×5 risk matrix — pixel-faithful to the SafeBase web app.
// Scoring formula: score = likelihood × consequence
// Level thresholds (from /tmp/safebase-src/backend/risk_module.py:337):
//   ≤5  = low      (success green)
//   ≤11 = medium   (warning amber)
//   ≤19 = high     (orange)
//   >19 = extreme  (destructive red)

import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TOKENS } from "@/src/theme/colors";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

export type Level = "low" | "medium" | "high" | "extreme";

export function riskLevel(score: number): Level | null {
  if (!score) return null;
  if (score <= 5) return "low";
  if (score <= 11) return "medium";
  if (score <= 19) return "high";
  return "extreme";
}

export const LEVEL_COLOR: Record<Level, string> = {
  low: "#059669", // success
  medium: "#F59E0B", // amber
  high: "#EA580C", // orange
  extreme: "#DC2626", // destructive
};

export const LEVEL_TINT: Record<Level, string> = {
  low: "#ECFDF5",
  medium: "#FEF3C7",
  high: "#FFEDD5",
  extreme: "#FEE2E2",
};

const LIKELIHOOD_LABELS = ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"];
const CONSEQUENCE_LABELS = ["Insignificant", "Minor", "Moderate", "Major", "Catastrophic"];

interface Props {
  likelihood: number; // 1..5
  consequence: number; // 1..5
  onChange?: (likelihood: number, consequence: number) => void;
  title?: string;
  testIdPrefix?: string;
  compact?: boolean;
}

export function RiskMatrix({
  likelihood,
  consequence,
  onChange,
  title,
  testIdPrefix = "risk-matrix",
  compact,
}: Props) {
  const score = likelihood * consequence;
  const level = riskLevel(score);
  const cellSize = compact ? 30 : 36;
  const readOnly = !onChange;

  return (
    <View style={styles.wrap} testID={testIdPrefix}>
      {title ? <Text style={styles.title}>{title}</Text> : null}

      {/* Header — consequence */}
      <View style={styles.row}>
        <View style={[styles.headerCell, { width: cellSize }]} />
        {CONSEQUENCE_LABELS.map((c, idx) => (
          <View key={c} style={[styles.headerCell, { width: cellSize }]}>
            <Text style={styles.headerNum}>{idx + 1}</Text>
          </View>
        ))}
      </View>

      {/* Rows — likelihood 5..1 (web shows highest at top) */}
      {[5, 4, 3, 2, 1].map((l) => (
        <View key={l} style={styles.row}>
          <View style={[styles.headerCell, { width: cellSize }]}>
            <Text style={styles.headerNum}>{l}</Text>
          </View>
          {[1, 2, 3, 4, 5].map((c) => {
            const cellScore = l * c;
            const cellLevel = riskLevel(cellScore);
            const isSelected = l === likelihood && c === consequence;
            return (
              <TouchableOpacity
                key={`${l}-${c}`}
                testID={`${testIdPrefix}-cell-${l}-${c}`}
                disabled={readOnly}
                activeOpacity={readOnly ? 1 : 0.7}
                onPress={() => onChange?.(l, c)}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: cellLevel ? LEVEL_COLOR[cellLevel] : TOKENS.muted,
                    borderColor: isSelected ? TOKENS.ink : TOKENS.background,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <Text style={styles.cellNum}>{cellScore}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Axis labels */}
      <View style={[styles.row, { marginTop: 8 }]}>
        <View style={{ width: cellSize }} />
        <Text style={styles.axis}>Consequence →</Text>
      </View>
      <Text style={[styles.axis, { transform: [{ translateX: 6 }] }]}>↑ Likelihood</Text>

      {/* Read-out */}
      {likelihood && consequence ? (
        <View style={styles.readout} testID={`${testIdPrefix}-readout`}>
          <View style={styles.readRow}>
            <Text style={styles.readLabel}>Score</Text>
            <Text style={styles.readValue}>
              {likelihood} × {consequence} ={" "}
              <Text style={{ color: level ? LEVEL_COLOR[level] : TOKENS.ink }}>{score}</Text>
            </Text>
          </View>
          <View style={styles.readRow}>
            <Text style={styles.readLabel}>Level</Text>
            {level ? (
              <View style={[styles.pill, { backgroundColor: LEVEL_TINT[level], borderColor: LEVEL_COLOR[level] }]}>
                <Text style={[styles.pillText, { color: LEVEL_COLOR[level] }]}>{level.toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.readRow}>
            <Text style={styles.readLabel}>{LIKELIHOOD_LABELS[likelihood - 1]} × {CONSEQUENCE_LABELS[consequence - 1]}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12 },
  title: { color: TOKENS.ink, fontSize: 14, fontWeight: "700", marginBottom: 8, fontFamily: MONO, letterSpacing: 1.2, textTransform: "uppercase" },
  row: { flexDirection: "row" },
  headerCell: { height: 30, alignItems: "center", justifyContent: "center" },
  headerNum: { color: TOKENS.ink, fontSize: 11, fontWeight: "700", fontFamily: MONO },
  cell: { alignItems: "center", justifyContent: "center" },
  cellNum: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", fontFamily: MONO },
  axis: { color: "#737373", fontSize: 10, fontWeight: "700", letterSpacing: 1.2, fontFamily: MONO, textTransform: "uppercase" },
  readout: { marginTop: 14, padding: 12, backgroundColor: TOKENS.muted, borderWidth: 1, borderColor: TOKENS.border },
  readRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  readLabel: { color: "#525252", fontSize: 12, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 1 },
  readValue: { color: TOKENS.ink, fontSize: 14, fontWeight: "700" },
  pill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, fontFamily: MONO },
});
