// Transport — Load Restraint records. LRG 3rd Ed performance standard.
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { LoadRestraintRecord, TransportApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

const METHODS = [
  { value: "tie-down", label: "Tie-down" },
  { value: "direct", label: "Direct" },
  { value: "blocking", label: "Blocking" },
  { value: "combination", label: "Combination" },
];

export default function LoadRestraintScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<LoadRestraintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [rego, setRego] = useState("");
  const [desc, setDesc] = useState("");
  const [weight, setWeight] = useState("");
  const [method, setMethod] = useState("tie-down");
  const [straps, setStraps] = useState("");
  const [friction, setFriction] = useState("");
  const [met, setMet] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TransportApi.listLoadRestraint(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load records."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!rego.trim() || !desc.trim()) { setFe("Vehicle rego and load description are required."); return; }
    setBusy(true);
    try {
      await TransportApi.createLoadRestraint({
        vehicle_rego: rego.trim().toUpperCase(), load_description: desc.trim(),
        load_weight_kg: weight ? Number(weight) : undefined,
        restraint_method: method, number_of_straps: straps ? Number(straps) : undefined,
        friction_modifier: friction.trim() || undefined, performance_standard_met: met,
      });
      setRego(""); setDesc(""); setWeight(""); setStraps(""); setFriction(""); setMet(true); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save record."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Transport" title="Load restraint"
      subtitle="Load Restraint Guide 3rd Ed — performance standard verification."
      toggleLabel="Record restraint check" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "cube-outline", title: "No restraint records", body: "Document each load restraint check before transit." }}
      rowCount={rows.length}
      rowsEyebrow="Records"
      testIDPrefix="lr"
      formBody={
        <View>
          <Input testID="lr-rego" label="Vehicle rego (required)" value={rego} onChangeText={setRego} accent={accent} autoCapitalize="characters" />
          <Input testID="lr-desc" label="Load description (required)" value={desc} onChangeText={setDesc} accent={accent} placeholder="e.g. Steel coils ×2" />
          <Input testID="lr-weight" label="Load weight (kg)" value={weight} onChangeText={setWeight} accent={accent} keyboardType="numeric" />
          <ChipGroup label="Restraint method" accent={accent} values={[method]} onChange={(v) => setMethod(v[0] ?? "tie-down")} options={METHODS} singleSelect />
          <Input testID="lr-straps" label="Number of straps" value={straps} onChangeText={setStraps} accent={accent} keyboardType="numeric" />
          <Input testID="lr-friction" label="Friction modifier" value={friction} onChangeText={setFriction} accent={accent} placeholder="e.g. rubber mat" />
          <ChipGroup label="Performance standard met?" accent={accent} values={met ? ["yes"] : ["no"]} onChange={(v) => setMet(v[0] === "yes")} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} singleSelect />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="lr-submit" label="Save record" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.record_id} testID={`lr-row-${r.record_id}`} style={[shellStyles.row, !r.performance_standard_met && { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.vehicle_rego} · {r.load_description}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{r.restraint_method ?? ""}{r.load_weight_kg ? ` · ${r.load_weight_kg}kg` : ""}{r.number_of_straps ? ` · ${r.number_of_straps} straps` : ""}</Text>
              <Text style={shellStyles.rowSub}>{new Date(r.created_at).toLocaleString("en-AU")}{r.checked_by ? ` · ${r.checked_by}` : ""}</Text>
            </View>
            <Pill label={r.performance_standard_met ? "MEETS" : "FAIL"} color={r.performance_standard_met ? TOKENS.success : TOKENS.destructive} />
          </View>
        </View>
      ))}
    />
  );
}
