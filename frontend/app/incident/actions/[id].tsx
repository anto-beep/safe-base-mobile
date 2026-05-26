// Stage 4 — Corrective actions. Mirrors backend body in
// /tmp/safebase_ref/backend/incident_workflow.py:424. Fields: short_term[],
// long_term[], worker_communication, worker_consulted, internal_comments,
// risk_register (linked_risk_id), linked_swms_ids[], completed, draft.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Incident, Incidents } from "@/src/api/incidents";
import { ChipGroup } from "@/src/components/ChipGroup";
import { Card, Eyebrow, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { LONG_TERM_ACTION_TYPES, SHORT_TERM_ACTION_TYPES } from "@/src/constants/incident";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

type ActionItem = { type: string; action: string; owner?: string; due_date?: string; status?: string };

export default function ActionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const router = useRouter();
  const [doc, setDoc] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shortTerm, setShortTerm] = useState<ActionItem[]>([]);
  const [longTerm, setLongTerm] = useState<ActionItem[]>([]);
  const [workerComms, setWorkerComms] = useState("");
  const [workerConsulted, setWorkerConsulted] = useState(false);
  const [internalComments, setInternalComments] = useState("");

  useEffect(() => {
    if (!id) return;
    Incidents.get(id).then((d) => {
      setDoc(d);
      const a = d.actions || {};
      setShortTerm(a.short_term ?? []);
      setLongTerm(a.long_term ?? []);
      setWorkerComms(a.worker_communication ?? "");
      setWorkerConsulted(!!a.worker_consulted);
      setInternalComments(a.internal_comments ?? "");
    }).catch((e) => setError(e?.detail ?? "Could not load incident."))
      .finally(() => setLoading(false));
  }, [id]);

  const addAction = (kind: "short" | "long", type: string) => {
    const item: ActionItem = { type, action: "", owner: "", due_date: "", status: "open" };
    if (kind === "short") setShortTerm((s) => [...s, item]);
    else setLongTerm((s) => [...s, item]);
  };
  const updateAction = (kind: "short" | "long", idx: number, patch: Partial<ActionItem>) => {
    if (kind === "short") setShortTerm((s) => s.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    else setLongTerm((s) => s.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeAction = (kind: "short" | "long", idx: number) => {
    if (kind === "short") setShortTerm((s) => s.filter((_, i) => i !== idx));
    else setLongTerm((s) => s.filter((_, i) => i !== idx));
  };

  const save = async (draft: boolean) => {
    setError(null);
    if (!draft && shortTerm.length + longTerm.length === 0) { setError("Add at least one action before completing the stage."); return; }
    setSaving(draft ? "draft" : "submit");
    try {
      await Incidents.patchActions(id!, {
        short_term: shortTerm,
        long_term: longTerm,
        worker_communication: workerComms.trim(),
        worker_consulted: workerConsulted,
        internal_comments: internalComments.trim(),
        completed: !draft,
        draft,
      });
      Alert.alert(draft ? "Draft saved" : "Actions saved", draft ? "Continue when ready." : "Ready to close out the incident.", [
        { text: "OK", onPress: () => router.replace({ pathname: "/incident/[id]", params: { id: id! } }) },
      ]);
    } catch (e: any) { setError(e?.detail ?? "Could not save."); }
    finally { setSaving(null); }
  };

  if (loading || !doc) return (
    <SafeAreaView style={styles.safe}><Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={accent} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="act-back" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Eyebrow color={accent}>Stage 4 · {doc.reference}</Eyebrow>
          <Text style={styles.h1}>Corrective actions</Text>
          <Text style={styles.sub}>Define the short-term controls (now) and the long-term systemic changes. Assign owners and dates.</Text>
          <View style={{ height: 14 }} />

          <Card>
            <Eyebrow color={accent}>Short-term actions</Eyebrow>
            {shortTerm.map((it, i) => (
              <ActionRow key={i} item={it} accent={accent} onChange={(p) => updateAction("short", i, p)} onRemove={() => removeAction("short", i)} testIDPrefix={`st-${i}`} />
            ))}
            <ChipGroup
              label="Add short-term action"
              accent={accent}
              values={[]}
              onChange={(v) => { if (v[0]) addAction("short", v[0] as string); }}
              options={SHORT_TERM_ACTION_TYPES.map((t) => ({ value: t, label: `+ ${t}` }))}
              singleSelect
              testIDPrefix="add-st"
            />
          </Card>

          <Card>
            <Eyebrow color={accent}>Long-term actions</Eyebrow>
            {longTerm.map((it, i) => (
              <ActionRow key={i} item={it} accent={accent} onChange={(p) => updateAction("long", i, p)} onRemove={() => removeAction("long", i)} testIDPrefix={`lt-${i}`} />
            ))}
            <ChipGroup
              label="Add long-term action"
              accent={accent}
              values={[]}
              onChange={(v) => { if (v[0]) addAction("long", v[0] as string); }}
              options={LONG_TERM_ACTION_TYPES.map((t) => ({ value: t, label: `+ ${t}` }))}
              singleSelect
              testIDPrefix="add-lt"
            />
          </Card>

          <Card>
            <Input testID="worker-comms" label="Worker communication" value={workerComms} onChangeText={setWorkerComms} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} placeholder="How will affected workers be informed?" />
            <ChipGroup
              label="Worker consultation"
              accent={accent}
              values={workerConsulted ? ["yes"] : []}
              onChange={(v) => setWorkerConsulted((v[0] as any) === "yes")}
              options={[{ value: "yes", label: "Workers consulted on the corrective actions" }] as any}
              testIDPrefix="consulted"
            />
            <Input testID="internal-comments" label="Internal comments" value={internalComments} onChangeText={setInternalComments} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <SecondaryButton testID="act-draft" label="Save draft" onPress={() => save(true)} iconName="save-outline" disabled={saving === "draft"} />
          <View style={{ height: 12 }} />
          <PrimaryButton testID="act-submit" label="Save actions" onPress={() => save(false)} accent={accent} loading={saving === "submit"} iconName="checkmark" />
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ActionRow({ item, accent, onChange, onRemove, testIDPrefix }: { item: ActionItem; accent: string; onChange: (p: Partial<ActionItem>) => void; onRemove: () => void; testIDPrefix: string }) {
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionTop}>
        <Text style={styles.actionType}>{item.type}</Text>
        <TouchableOpacity onPress={onRemove} testID={`${testIDPrefix}-remove`}><Ionicons name="trash-outline" size={18} color={TOKENS.destructive} /></TouchableOpacity>
      </View>
      <Input testID={`${testIDPrefix}-action`} label="Action description" value={item.action} onChangeText={(v) => onChange({ action: v })} accent={accent} multiline style={{ minHeight: 50, textAlignVertical: "top" }} />
      <View style={styles.actionInline}>
        <View style={{ flex: 1, marginRight: 6 }}><Input testID={`${testIDPrefix}-owner`} label="Owner" value={item.owner ?? ""} onChangeText={(v) => onChange({ owner: v })} accent={accent} /></View>
        <View style={{ flex: 1, marginLeft: 6 }}><Input testID={`${testIDPrefix}-due`} label="Due (YYYY-MM-DD)" value={item.due_date ?? ""} onChangeText={(v) => onChange({ due_date: v })} accent={accent} placeholder="2026-08-12" autoCapitalize="none" /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 4 },
  h1: { color: TOKENS.ink, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
  actionRow: { borderWidth: 1, borderColor: TOKENS.border, padding: 10, marginBottom: 10 },
  actionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  actionType: { color: TOKENS.ink, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  actionInline: { flexDirection: "row" },
  error: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
