// Hospitality — HACCP CCP log (FSANZ Std 3.2.1).
// Backend: GET/POST /api/hospitality/haccp-ccp. within_limit defaults true;
// flip to false to require a corrective action.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { HaccpEntry, HospitalityApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent, COLORS } from "@/src/theme/colors";

const HAZARDS = [
  { value: "biological", label: "Biological" },
  { value: "chemical", label: "Chemical" },
  { value: "physical", label: "Physical" },
  { value: "allergen", label: "Allergen" },
];

export default function HaccpScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<HaccpEntry[]>([]);
  const [breachCount, setBreachCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [step, setStep] = useState("");
  const [hazard, setHazard] = useState("biological");
  const [limit, setLimit] = useState("");
  const [measured, setMeasured] = useState("");
  const [within, setWithin] = useState(true);
  const [correct, setCorrect] = useState("");
  const [verifier, setVerifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HospitalityApi.listHaccp(); setRows(r.rows ?? []); setBreachCount(r.breach_count ?? 0); }
    catch (e: any) { setError(e?.detail ?? "Could not load HACCP entries."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!step.trim() || !measured.trim()) { setFe("CCP step and measured value are required."); return; }
    if (!within && !correct.trim()) { setFe("Out of limit — corrective action is required."); return; }
    setBusy(true);
    try {
      await HospitalityApi.createHaccp({
        ccp_step: step.trim(), hazard, critical_limit: limit.trim() || undefined,
        measured_value: measured.trim(), within_limit: within,
        corrective_action: correct.trim() || undefined,
        verified_by: verifier.trim() || undefined,
      });
      setStep(""); setLimit(""); setMeasured(""); setCorrect(""); setWithin(true); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save HACCP entry."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Hospitality" title="HACCP CCP log"
      subtitle={`FSANZ Std 3.2.1 critical-control-point monitoring. Breaches in record: ${breachCount}.`}
      toggleLabel="Record CCP measurement" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "clipboard-outline", title: "No CCP entries", body: "Log a critical-control-point measurement (e.g. cook temperature, sanitiser ppm)." }}
      rowCount={rows.length}
      rowsEyebrow="Recent measurements"
      testIDPrefix="haccp"
      formBody={
        <View>
          <Input testID="haccp-step" label="CCP step (required)" value={step} onChangeText={setStep} accent={accent} placeholder="e.g. Cook — centre of poultry" />
          <ChipGroup label="Hazard" accent={accent} values={[hazard]} onChange={(v) => setHazard(v[0] ?? "biological")} options={HAZARDS} singleSelect />
          <Input testID="haccp-limit" label="Critical limit" value={limit} onChangeText={setLimit} accent={accent} placeholder="e.g. ≥75°C for 15s" />
          <Input testID="haccp-measured" label="Measured value (required)" value={measured} onChangeText={setMeasured} accent={accent} placeholder="e.g. 78°C" />
          <ChipGroup label="Within limit?" accent={accent} values={within ? ["yes"] : ["no"]} onChange={(v) => setWithin(v[0] === "yes")} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No — breach" }]} singleSelect />
          {!within ? <Input testID="haccp-correct" label="Corrective action (required)" value={correct} onChangeText={setCorrect} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} /> : null}
          <Input testID="haccp-verifier" label="Verified by" value={verifier} onChangeText={setVerifier} accent={accent} placeholder="Your name (optional)" />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="haccp-submit" label="Save measurement" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.ccp_id} testID={`haccp-row-${r.ccp_id}`} style={[shellStyles.row, !r.within_limit && { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.ccp_step}</Text>
              <Text style={shellStyles.rowMeta}>{(r.hazard ?? "").toUpperCase()} · measured {String(r.measured_value)}{r.critical_limit ? ` · limit ${r.critical_limit}` : ""}</Text>
              <Text style={shellStyles.rowSub}>{new Date(r.recorded_at).toLocaleString("en-AU")}{r.verified_by ? ` · by ${r.verified_by}` : ""}</Text>
              {r.corrective_action ? <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>Action: {r.corrective_action}</Text> : null}
            </View>
            <Pill label={r.within_limit ? "WITHIN" : "BREACH"} color={r.within_limit ? TOKENS.success : TOKENS.destructive} />
          </View>
        </View>
      ))}
    />
  );
}
