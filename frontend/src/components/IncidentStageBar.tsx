// 5-dot stage bar — mirrors the web StageBar component.
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { STAGES, StageKey } from "@/src/constants/incident";
import { TOKENS, MONO_OK } from "@/src/components/IncidentStageBar.styles";

export function IncidentStageBar({
  current,
  stagesDone = [],
  showLabel = true,
}: {
  current: StageKey | string;
  stagesDone?: string[];
  showLabel?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dotRow}>
        {STAGES.map((s) => {
          const isDone = stagesDone.includes(s.key) && s.key !== current;
          const isCurrent = current === s.key;
          return (
            <View
              key={s.key}
              style={[
                styles.dot,
                isCurrent
                  ? { backgroundColor: TOKENS.ink, borderColor: TOKENS.ink }
                  : isDone
                  ? { backgroundColor: "#059669", borderColor: "#059669" }
                  : { backgroundColor: TOKENS.background, borderColor: TOKENS.border },
              ]}
            />
          );
        })}
      </View>
      {showLabel ? (
        <Text style={[styles.label, { fontFamily: MONO_OK }]} numberOfLines={1}>
          {current}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "flex-start" },
  dotRow: { flexDirection: "row" },
  dot: { width: 12, height: 12, borderWidth: 1, marginRight: 3 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginTop: 4, textTransform: "uppercase" },
});
