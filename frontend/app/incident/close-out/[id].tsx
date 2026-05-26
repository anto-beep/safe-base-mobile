// Stage 5 — Close-out. Mirrors backend body in
// /tmp/safebase_ref/backend/incident_workflow.py:458. Requires lessons_learned
// + signed_off_by. Includes the 4-section regulator/investigation/actions/
// documentation checklist.

import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Incident, Incidents } from "@/src/api/incidents";
import { Card, Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { CLOSE_CHECKLIST } from "@/src/constants/incident";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

export default function CloseOutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const router = useRouter();
  const { user } = useAuth();
  const [doc, setDoc] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lessons, setLessons] = useState("");
  const [signedBy, setSignedBy] = useState(user?.name ?? user?.email ?? "");
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    Incidents.get(id).then((d) => {
      setDoc(d);
      const c = d.close_out || {};
      setLessons(c.lessons_learned ?? "");
      setSignedBy(c.signed_off_by ?? user?.name ?? user?.email ?? "");
      setChecks(c.close_checklist ?? {});
    }).catch((e) => setError(e?.detail ?? "Could not load incident."))
      .finally(() => setLoading(false));
  }, [id]);

  const toggle = (k: string) => setChecks((c) => ({ ...c, [k]: !c[k] }));

  const aiLessons = async () => {
    if (!doc?.submission?.description) return;
    setAiBusy(true);
    try {
      const r = await Incidents.aiLessons({
        description: doc.submission.description,
        investigation: doc.investigation,
        actions: doc.actions,
      });
      setLessons(r.lessons_learned || lessons);
    } catch (e: any) {
      Alert.alert("AI unavailable", e?.detail ?? "Try again later.");
    } finally { setAiBusy(false); }
  };

  const submit = async () => {
    setError(null);
    if (!lessons.trim()) { setError("Lessons learned are required to close out."); return; }
    if (!signedBy.trim()) { setError("Sign off the close-out to proceed."); return; }
    setSaving(true);
    try {
      await Incidents.closeOut(id!, {
        lessons_learned: lessons.trim(),
        signed_off_by: signedBy.trim(),
        close_checklist: checks,
        signed_off_at: new Date().toISOString(),
      });
      Alert.alert("Incident closed", "All stages complete. The incident is now closed.", [
        { text: "OK", onPress: () => router.replace({ pathname: "/incident/[id]", params: { id: id! } }) },
      ]);
    } catch (e: any) {
      setError(e?.detail ?? e?.message ?? "Could not close out.");
    } finally { setSaving(false); }
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
          <TouchableOpacity testID="co-back" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Eyebrow color={accent}>Stage 5 · {doc.reference}</Eyebrow>
          <Text style={styles.h1}>Close out</Text>
          <Text style={styles.sub}>Confirm the checklist, capture lessons learned, sign off.</Text>
          <View style={{ height: 14 }} />

          {(Object.entries(CLOSE_CHECKLIST) as [keyof typeof CLOSE_CHECKLIST, readonly string[]][]).map(([cat, items]) => (
            <Card key={cat}>
              <Eyebrow color={accent}>{cat}</Eyebrow>
              {items.map((it) => {
                const k = `${cat}::${it}`;
                const on = !!checks[k];
                return (
                  <TouchableOpacity key={k} testID={`co-${k}`} style={styles.checkRow} activeOpacity={0.85} onPress={() => toggle(k)}>
                    <View style={[styles.checkBox, on ? { backgroundColor: accent, borderColor: accent } : { borderColor: TOKENS.border }]}>
                      {on ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                    </View>
                    <Text style={styles.checkLabel}>{it}</Text>
                  </TouchableOpacity>
                );
              })}
            </Card>
          ))}

          <Card>
            <View style={styles.aiRow}>
              <TouchableOpacity testID="ai-lessons" onPress={aiLessons} disabled={aiBusy} style={[styles.aiBtn, { borderColor: accent }]}>
                {aiBusy ? <ActivityIndicator color={accent} size="small" /> : <Ionicons name="sparkles" size={16} color={accent} />}
                <Text style={[styles.aiBtnLabel, { color: accent }]}>Suggest lessons learned</Text>
              </TouchableOpacity>
            </View>
            <Input
              testID="lessons"
              label="Lessons learned (required)"
              value={lessons}
              onChangeText={setLessons}
              accent={accent}
              multiline
              style={{ minHeight: 120, textAlignVertical: "top" }}
              placeholder="What did we change going forward? Share with the workforce."
            />
            <Input testID="co-sign" label="Signed off by (required)" value={signedBy} onChangeText={setSignedBy} accent={accent} />
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton testID="co-submit" label="Close out incident" onPress={submit} accent={"#059669"} loading={saving} iconName="lock-closed" />
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 4 },
  h1: { color: TOKENS.ink, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 8, borderTopWidth: 1, borderTopColor: TOKENS.border },
  checkBox: { width: 22, height: 22, borderWidth: 1, marginRight: 10, alignItems: "center", justifyContent: "center" },
  checkLabel: { flex: 1, color: COLORS.textPrimary, fontSize: 13, lineHeight: 18 },
  aiRow: { flexDirection: "row", marginBottom: 8 },
  aiBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  aiBtnLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginLeft: 6, textTransform: "uppercase" },
  error: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
