import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View, ViewStyle } from "react-native";

import { COLORS } from "@/src/theme/colors";

interface Props {
  size?: number;
  showWordmark?: boolean;
  style?: ViewStyle | ViewStyle[];
  invert?: boolean;
  testID?: string;
}

// Typographic logo mark: yellow tile + cube icon + SAFEBASE wordmark.
// No external image dependency — pure components for crisp scaling everywhere.
// `invert` flips for use on dark surfaces (e.g. concierge chat header).
export function Logo({ size = 28, showWordmark = true, style, invert, testID }: Props) {
  const tileBg = COLORS.warning; // brand mark — always yellow
  const cubeColor = "#0A0A0A";
  const wordmarkColor = invert ? "#FFFFFF" : "#0A0A0A";
  return (
    <View testID={testID} style={[styles.row, style as any]}>
      <View style={[styles.tile, { width: size, height: size, backgroundColor: tileBg }]}>
        <Ionicons name="cube" size={size * 0.62} color={cubeColor} />
      </View>
      {showWordmark ? (
        <Text style={[styles.wordmark, { fontSize: size * 0.6, color: wordmarkColor, marginLeft: size * 0.35 }]}>
          SAFEBASE
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  tile: { alignItems: "center", justifyContent: "center" },
  wordmark: {
    fontWeight: "900",
    letterSpacing: 2.5,
    fontFamily: Platform.select({ ios: "Avenir-Heavy", android: "sans-serif-condensed" }),
  },
});
