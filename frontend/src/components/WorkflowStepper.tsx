// Workflow stepper — reads step labels live from /api/workflows/catalog.
// Backend reference: /tmp/safebase-src/backend/server.py:1342 (_WORKFLOW_STEPS).
// Known types: new_employee, incident_resolution, swms_job_start, annual_review, subcontractor.
// Step toggle: POST /api/workflows/{wtype}/{instance_id}/step  { step_key, completed }

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { api } from "@/src/api/client";
import { Eyebrow } from "@/src/components/ui";
import { TOKENS } from "@/src/theme/colors";

export interface WorkflowStep {
  key: string;
  label: string;
  completed?: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
}

export interface WorkflowInstance {
  instance_id: string;
  workflow_type: string;
  title?: string;
  entity_id?: string;
  entity_name?: string;
  notes?: string;
  steps: WorkflowStep[];
  progress_pct?: number;
  completed_steps?: number;
  total_steps?: number;
  status?: "not_started" | "in_progress" | "complete";
}

interface Props {
  instance: WorkflowInstance;
  accent: string;
  onUpdate?: (next: WorkflowInstance) => void;
}

export function WorkflowStepper({ instance, accent, onUpdate }: Props) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>(instance.steps);

  const toggle = async (step: WorkflowStep) => {
    if (busyKey) return;
    setBusyKey(step.key);
    const desired = !step.completed;
    try {
      const resp = await api.post<WorkflowInstance>(
        `/workflows/${instance.workflow_type}/${instance.instance_id}/step`,
        { step_key: step.key, completed: desired },
      );
      // Backend returns the updated instance; reconcile UI from server truth.
      const nextSteps = resp?.steps ?? steps.map((s) => (s.key === step.key ? { ...s, completed: desired } : s));
      setSteps(nextSteps);
      onUpdate?.(resp ?? { ...instance, steps: nextSteps });
    } catch {
      // Optimistic-but-not-applied: leave UI unchanged so user can retry.
    } finally {
      setBusyKey(null);
    }
  };

  const total = steps.length;
  const done = steps.filter((s) => s.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <View style={styles.wrap} testID={`workflow-stepper-${instance.instance_id}`}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Eyebrow color={accent}>{instance.workflow_type.replace(/_/g, " ")}</Eyebrow>
          <Text style={styles.title} numberOfLines={2}>{instance.title ?? "Workflow"}</Text>
          {instance.entity_name ? <Text style={styles.entity}>{instance.entity_name}</Text> : null}
        </View>
        <View style={[styles.progressPill, { borderColor: accent }]}>
          <Text style={[styles.progressText, { color: accent }]}>
            {done}/{total} · {pct}%
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: accent }]} />
      </View>

      <View style={{ marginTop: 12 }}>
        {steps.map((s, i) => {
          const isBusy = busyKey === s.key;
          const isLast = i === steps.length - 1;
          return (
            <TouchableOpacity
              key={s.key}
              testID={`workflow-step-${s.key}`}
              activeOpacity={0.85}
              onPress={() => toggle(s)}
              disabled={isBusy}
              style={styles.stepRow}
            >
              <View style={styles.stepRail}>
                <View
                  style={[
                    styles.stepDot,
                    s.completed
                      ? { backgroundColor: accent, borderColor: accent }
                      : { backgroundColor: TOKENS.background, borderColor: TOKENS.border },
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator size="small" color={s.completed ? "#FFFFFF" : accent} />
                  ) : s.completed ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepIdx}>{i + 1}</Text>
                  )}
                </View>
                {!isLast ? <View style={[styles.stepLine, s.completed && { backgroundColor: accent }]} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: isLast ? 0 : 12 }}>
                <Text style={[styles.stepLabel, s.completed && styles.stepLabelDone]} numberOfLines={2}>
                  {s.label}
                </Text>
                {s.completed_at ? (
                  <Text style={styles.stepMeta}>
                    Completed {new Date(s.completed_at).toLocaleString()}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: TOKENS.background, borderWidth: 1, borderColor: TOKENS.border, padding: 14, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  title: { color: TOKENS.ink, fontSize: 16, fontWeight: "700", marginTop: 2 },
  entity: { color: "#737373", fontSize: 12, marginTop: 2 },
  progressPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  progressText: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  progressBar: { height: 4, backgroundColor: TOKENS.muted },
  progressFill: { height: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start" },
  stepRail: { width: 32, alignItems: "center" },
  stepDot: {
    width: 26,
    height: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIdx: { color: "#525252", fontSize: 12, fontWeight: "700" },
  stepLine: { width: 1, flex: 1, backgroundColor: TOKENS.border, marginTop: 2, minHeight: 18 },
  stepLabel: { color: TOKENS.ink, fontSize: 14, fontWeight: "600", marginLeft: 10, marginTop: 4 },
  stepLabelDone: { color: "#525252", textDecorationLine: "line-through" },
  stepMeta: { color: "#737373", fontSize: 11, marginLeft: 10, marginTop: 2 },
});
