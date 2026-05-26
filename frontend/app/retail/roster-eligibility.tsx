// Retail — Roster eligibility lookup tool. Given a worker_id, the backend
// returns whether they can be rostered + a list of blockers. This is a
// read-only lookup screen (no create form).

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RetailApi, RosterEligibility } from "@/src/api/industry";
import { Card, EmptyState, Eyebrow, Input, MONO, Pill, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

export default function RosterEligibilityScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [workerId, setWorkerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RosterEligibility | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setError(null); setResult(null);
    if (!workerId.trim()) { setError("Enter a worker_id to check."); return; }
    setBusy(true);
    try {
      const r = await RetailApi.rosterEligibility(workerId.trim());
      setResult(r);
    } catch (e: any) { setError(e?.detail ?? "Could not check eligibility."); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
          <ScreenHeader eyebrow="Retail" title="Roster eligibility" subtitle="Credential-driven shift-block check. A worker cannot be rostered if their Quick Induct or licences are expired." accent={accent} />

          <Card>
            <Eyebrow color={accent}>Worker lookup</Eyebrow>
            <Input testID="re-worker" label="Worker ID" value={workerId} onChangeText={setWorkerId} accent={accent} placeholder="e.g. WRK-12345" autoCapitalize="characters" />
            <PrimaryButton testID="re-check" label="Check eligibility" onPress={check} accent={accent} loading={busy} iconName="search" />
          </Card>

          {error ? <Card><Text style={s.err}>{error}</Text></Card> : null}

          {result ? (
            <Card testID="re-result">
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={s.title}>{result.worker_id}</Text>
                <Pill label={result.can_roster ? "CAN ROSTER" : "BLOCKED"} color={result.can_roster ? TOKENS.success : TOKENS.destructive} />
              </View>
              <Text style={[s.meta, { marginTop: 8 }]}>{result.can_roster ? "All credentials current. This worker may be rostered." : `${result.blockers.length} blocker(s) preventing rostering.`}</Text>
              {result.blockers.length ? (
                <View style={{ marginTop: 12 }}>
                  {result.blockers.map((b, i) => (
                    <View key={i} style={s.blocker}>
                      <Ionicons name="close-circle" size={16} color={TOKENS.destructive} style={{ marginRight: 8 }} />
                      <Text style={s.blockerText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : !error && !busy ? (
            <EmptyState icon="calendar-outline" title="Enter a worker ID above" body="This tool checks Quick Induct validity + licence expiry to confirm if a worker can be rostered for their next shift." />
          ) : null}

          {busy ? <View style={{ alignItems: "center", marginVertical: 16 }}><ActivityIndicator color={accent} /></View> : null}
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  title: { color: TOKENS.ink, fontSize: 16, fontWeight: "700", fontFamily: MONO },
  meta: { color: COLORS.textSecondary, fontSize: 13 },
  blocker: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: TOKENS.border },
  blockerText: { color: COLORS.textPrimary, fontSize: 13, flex: 1 },
  err: { color: TOKENS.destructive, fontSize: 13 },
});
