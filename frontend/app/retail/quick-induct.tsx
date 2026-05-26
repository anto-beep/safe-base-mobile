// Retail — Quick Induct (3-min shift-blocker). Loads questions from
// /retail/quick-induct/meta and saves the casual's answers.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { QuickInduct, QuickInductMeta, RetailApi } from "@/src/api/industry";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

export default function QuickInductScreen() {
  const accent = useAccent();
  const [meta, setMeta] = useState<QuickInductMeta | null>(null);
  const [rows, setRows] = useState<QuickInduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [casual, setCasual] = useState("");
  const [store, setStore] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, r] = await Promise.all([
        RetailApi.quickInductMeta().catch(() => null),
        RetailApi.listQuickInduct().catch(() => ({ rows: [], total: 0 })),
      ]);
      if (m) setMeta(m);
      setRows(r.rows ?? []);
    } catch (e: any) { setError(e?.detail ?? "Could not load Quick Induct."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!casual.trim()) { setFe("Casual name is required."); return; }
    const missing = (meta?.questions ?? []).filter(q => !(answers[q.key] ?? "").trim());
    if (missing.length) { setFe(`Please answer all ${meta?.questions.length} questions before submitting.`); return; }
    setBusy(true);
    try {
      await RetailApi.createQuickInduct({ casual_name: casual.trim(), answers, store_location: store.trim() || undefined });
      setCasual(""); setStore(""); setAnswers({}); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save induction."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Retail" title="Quick Induct"
      subtitle={`3-minute shift-blocker for casuals & contractors. Valid for ${meta?.valid_days ?? 90} days.`}
      toggleLabel="New induction" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "qr-code-outline", title: "No inductions yet", body: "Casuals must complete a Quick Induct before they can roster." }}
      rowCount={rows.length}
      rowsEyebrow="Recent inductions"
      testIDPrefix="qi"
      formBody={
        <View>
          <Input testID="qi-name" label="Casual name (required)" value={casual} onChangeText={setCasual} accent={accent} />
          <Input testID="qi-store" label="Store location" value={store} onChangeText={setStore} accent={accent} placeholder="e.g. Bondi Junction" />
          {(meta?.questions ?? []).map(q => (
            <Input
              key={q.key}
              testID={`qi-q-${q.key}`}
              label={q.q}
              value={answers[q.key] ?? ""}
              onChangeText={(t) => setAnswers(a => ({ ...a, [q.key]: t }))}
              accent={accent}
              multiline
              style={{ minHeight: 60, textAlignVertical: "top" }}
            />
          ))}
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="qi-submit" label="Submit induction" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => {
        const expired = r.expires_at ? new Date(r.expires_at).getTime() < Date.now() : false;
        return (
          <View key={r.induct_id} testID={`qi-row-${r.induct_id}`} style={[shellStyles.row, (!r.passed || expired) && { borderColor: TOKENS.destructive }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{r.casual_name}</Text>
                <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{new Date(r.inducted_at).toLocaleString("en-AU")}{r.store_location ? ` · ${r.store_location}` : ""}</Text>
                {r.expires_at ? <Text style={shellStyles.rowSub}>Expires {new Date(r.expires_at).toLocaleDateString("en-AU")}</Text> : null}
                {!r.passed && r.missing_answers?.length ? <Text style={{ color: TOKENS.destructive, fontSize: 12, marginTop: 4 }}>Missing: {r.missing_answers.join(", ")}</Text> : null}
              </View>
              <Pill label={!r.passed ? "FAILED" : expired ? "EXPIRED" : "VALID"} color={!r.passed || expired ? TOKENS.destructive : TOKENS.success} />
            </View>
          </View>
        );
      })}
    />
  );
}
