// Hospitality — Cleaning schedule (FSANZ Std 3.2.3 maintenance & cleanliness).
// List + create + one-tap Complete action. Tapping Complete posts to
// POST /api/hospitality/cleaning-tasks/{task_id}/complete.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { CleaningTask, HospitalityApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const FREQS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "after_each_use", label: "After each use" },
];

export default function CleaningScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const [area, setArea] = useState("");
  const [freq, setFreq] = useState("daily");
  const [method, setMethod] = useState("");
  const [chem, setChem] = useState("");
  const [resp, setResp] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HospitalityApi.listCleaning(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load cleaning tasks."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!area.trim()) { setFe("Area is required."); return; }
    setBusy(true);
    try {
      await HospitalityApi.createCleaning({ area: area.trim(), frequency: freq, method: method.trim() || undefined, chemical: chem.trim() || undefined, responsible: resp.trim() || undefined });
      setArea(""); setMethod(""); setChem(""); setResp(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save cleaning task."); }
    finally { setBusy(false); }
  };

  const complete = async (taskId: string) => {
    setCompleting(taskId);
    try { await HospitalityApi.completeCleaning(taskId); load(); }
    catch { /* shell shows error on next list */ }
    finally { setCompleting(null); }
  };

  return (
    <IndustryListShell
      eyebrow="Hospitality" title="Cleaning schedule"
      subtitle="FSANZ Std 3.2.3 — equipment, surfaces and premises maintained in a clean state. Tap Complete on each sign-off."
      toggleLabel="Add cleaning task" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "sparkles-outline", title: "No cleaning tasks", body: "Add daily / weekly cleaning tasks for fridges, prep benches, floors, exhaust." }}
      rowCount={rows.length}
      rowsEyebrow="Schedule"
      testIDPrefix="clean"
      formBody={
        <View>
          <Input testID="clean-area" label="Area / equipment (required)" value={area} onChangeText={setArea} accent={accent} placeholder="e.g. Walk-in fridge floor" />
          <ChipGroup label="Frequency" accent={accent} values={[freq]} onChange={(v) => setFreq(v[0] ?? "daily")} options={FREQS} singleSelect />
          <Input testID="clean-method" label="Method" value={method} onChangeText={setMethod} accent={accent} placeholder="e.g. Hot water + sanitiser, scrub, rinse" />
          <Input testID="clean-chem" label="Chemical" value={chem} onChangeText={setChem} accent={accent} placeholder="e.g. Diversey Suma D4" />
          <Input testID="clean-resp" label="Responsible" value={resp} onChangeText={setResp} accent={accent} placeholder="e.g. Closing shift" />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="clean-submit" label="Save task" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.task_id} testID={`clean-row-${r.task_id}`} style={shellStyles.row}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.area}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{r.frequency.toUpperCase()}{r.method ? ` · ${r.method}` : ""}{r.chemical ? ` · ${r.chemical}` : ""}</Text>
              {r.responsible ? <Text style={shellStyles.rowSub}>Responsible: {r.responsible}</Text> : null}
              {r.last_completed_at ? <Text style={shellStyles.rowSub}>Last done {new Date(r.last_completed_at).toLocaleString("en-AU")}{r.last_completed_by ? ` · ${r.last_completed_by}` : ""}</Text> : null}
            </View>
            <Pill label={r.status === "completed" ? "DONE" : "OPEN"} color={r.status === "completed" ? TOKENS.success : TOKENS.warnInk} />
          </View>
          <TouchableOpacity
            testID={`clean-complete-${r.task_id}`}
            onPress={() => complete(r.task_id)}
            style={{ marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: accent, alignSelf: "flex-start", flexDirection: "row", alignItems: "center" }}
            disabled={completing === r.task_id}
          >
            {completing === r.task_id ? <ActivityIndicator size="small" color={accent} /> : <Text style={{ color: accent, fontWeight: "800", fontSize: 12, letterSpacing: 1.2 }}>{r.status === "completed" ? "MARK DONE AGAIN" : "MARK DONE"}</Text>}
          </TouchableOpacity>
        </View>
      ))}
    />
  );
}
