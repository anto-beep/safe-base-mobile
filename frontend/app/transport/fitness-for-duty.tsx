// Transport — Fitness-for-Duty declaration. Backend computes fit_to_drive
// (slept ≥5h + not impaired). Driver-facing pre-shift form.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { FitnessForDuty, TransportApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function FfdScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<FitnessForDuty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [driver, setDriver] = useState("");
  const [slept, setSlept] = useState("");
  const [alcohol, setAlcohol] = useState(false);
  const [meds, setMeds] = useState(false);
  const [unwell, setUnwell] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TransportApi.listFfd(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load fitness-for-duty declarations."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  // Local preview of backend rule — server is authoritative.
  const sleptN = parseFloat(slept);
  const previewFit = !isNaN(sleptN) && sleptN >= 5 && !alcohol && !meds && !unwell;

  const save = async () => {
    setFe(null);
    if (!driver.trim() || !slept) { setFe("Driver name and hours slept are required."); return; }
    setBusy(true);
    try {
      await TransportApi.createFfd({
        driver_name: driver.trim(), hours_slept_24h: Number(slept),
        alcohol_last_8h: alcohol, on_medication_affecting: meds, unwell, fit_to_drive: true,
      });
      setDriver(""); setSlept(""); setAlcohol(false); setMeds(false); setUnwell(false); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save declaration."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Transport" title="Fitness for duty"
      subtitle="Pre-shift driver self-declaration. Backend marks NOT fit if slept <5h, on medication affecting, alcohol in last 8h, or unwell."
      toggleLabel="New declaration" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "fitness-outline", title: "No declarations", body: "Drivers should declare fitness before each shift." }}
      rowCount={rows.length}
      rowsEyebrow="Recent declarations"
      testIDPrefix="ffd"
      formBody={
        <View>
          <Input testID="ffd-driver" label="Driver name (required)" value={driver} onChangeText={setDriver} accent={accent} />
          <Input testID="ffd-slept" label="Hours slept in last 24h (required)" value={slept} onChangeText={setSlept} accent={accent} keyboardType="numbers-and-punctuation" placeholder="e.g. 7.5" />
          <ChipGroup label="Alcohol in last 8 hours?" accent={accent} values={alcohol ? ["yes"] : []} onChange={(v) => setAlcohol(v.includes("yes"))} options={[{ value: "yes", label: "Yes" }]} singleSelect />
          <ChipGroup label="On medication affecting driving?" accent={accent} values={meds ? ["yes"] : []} onChange={(v) => setMeds(v.includes("yes"))} options={[{ value: "yes", label: "Yes" }]} singleSelect />
          <ChipGroup label="Unwell (fever, dizziness, pain)?" accent={accent} values={unwell ? ["yes"] : []} onChange={(v) => setUnwell(v.includes("yes"))} options={[{ value: "yes", label: "Yes" }]} singleSelect />
          {slept ? (
            <View style={{ flexDirection: "row", alignItems: "center", padding: 10, marginVertical: 8, backgroundColor: previewFit ? "#ECFDF5" : "#FEF2F2", borderWidth: 1, borderColor: previewFit ? "#A7F3D0" : TOKENS.destructive }}>
              <Text style={{ color: previewFit ? "#065F46" : TOKENS.destructive, fontWeight: "800", fontSize: 12, letterSpacing: 1 }}>{previewFit ? "PREVIEW · FIT TO DRIVE" : "PREVIEW · NOT FIT"}</Text>
            </View>
          ) : null}
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="ffd-submit" label="Submit declaration" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.declaration_id} testID={`ffd-row-${r.declaration_id}`} style={[shellStyles.row, !r.fit_to_drive && { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.driver_name}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{new Date(r.declared_at).toLocaleString("en-AU")} · slept {r.hours_slept_24h}h</Text>
              <Text style={shellStyles.rowSub}>{[r.alcohol_last_8h ? "alcohol" : null, r.on_medication_affecting ? "on meds" : null, r.unwell ? "unwell" : null].filter(Boolean).join(" · ") || "clear"}</Text>
            </View>
            <Pill label={r.fit_to_drive ? "FIT" : "NOT FIT"} color={r.fit_to_drive ? TOKENS.success : TOKENS.destructive} />
          </View>
        </View>
      ))}
    />
  );
}
