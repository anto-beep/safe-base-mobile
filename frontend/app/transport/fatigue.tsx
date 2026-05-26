// Transport — Fatigue / work-rest logs. Backend computes breach when work > 12h
// or continuous rest < 7h under HVNL Standard Hours (Solo). Breaches view
// toggles via header pill.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { FatigueLog, TransportApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const STANDARDS = [
  { value: "standard", label: "Standard" }, { value: "bfm", label: "BFM" }, { value: "afm", label: "AFM" },
];

export default function FatigueScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<FatigueLog[]>([]);
  const [breachesOnly, setBreachesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [driver, setDriver] = useState("");
  const [rego, setRego] = useState("");
  const [work, setWork] = useState("");
  const [rest, setRest] = useState("");
  const [std, setStd] = useState("standard");
  const [dayDate, setDayDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await (breachesOnly ? TransportApi.listFatigueBreaches() : TransportApi.listFatigue());
      setRows(r.rows ?? []);
    } catch (e: any) { setError(e?.detail ?? "Could not load fatigue logs."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [breachesOnly]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!driver.trim() || !work) { setFe("Driver name and work hours are required."); return; }
    setBusy(true);
    try {
      await TransportApi.createFatigue({
        driver_name: driver.trim(), work_hours: Number(work),
        continuous_rest_hours: rest ? Number(rest) : 0,
        vehicle_rego: rego.trim() || undefined, standard: std as any,
        day_date: dayDate || undefined,
      });
      setDriver(""); setRego(""); setWork(""); setRest(""); setDayDate(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save fatigue log."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Transport" title="Fatigue logs"
      subtitle="HVNL Standard Hours: ≤12h work / ≥7h continuous rest per day. Server flags breaches automatically."
      toggleLabel="Record fatigue log" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "moon-outline", title: "No fatigue logs", body: "Log work / rest hours for each driver each day." }}
      rowCount={rows.length}
      rowsEyebrow={breachesOnly ? "Breaches only" : "All entries"}
      testIDPrefix="fat"
      stats={
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          <TouchableOpacity testID="fat-tab-all" onPress={() => setBreachesOnly(false)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: !breachesOnly ? accent : TOKENS.border, marginRight: 6 }}>
            <Text style={{ color: !breachesOnly ? accent : COLORS.textSecondary, fontWeight: "800", fontSize: 11, letterSpacing: 1.2 }}>ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="fat-tab-breach" onPress={() => setBreachesOnly(true)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: breachesOnly ? TOKENS.destructive : TOKENS.border }}>
            <Text style={{ color: breachesOnly ? TOKENS.destructive : COLORS.textSecondary, fontWeight: "800", fontSize: 11, letterSpacing: 1.2 }}>BREACHES</Text>
          </TouchableOpacity>
        </View>
      }
      formBody={
        <View>
          <Input testID="fat-driver" label="Driver name (required)" value={driver} onChangeText={setDriver} accent={accent} />
          <Input testID="fat-rego" label="Vehicle rego" value={rego} onChangeText={setRego} accent={accent} autoCapitalize="characters" />
          <Input testID="fat-work" label="Work hours in 24h (required)" value={work} onChangeText={setWork} accent={accent} keyboardType="numbers-and-punctuation" placeholder="e.g. 11.5" />
          <Input testID="fat-rest" label="Continuous rest hours in 24h" value={rest} onChangeText={setRest} accent={accent} keyboardType="numbers-and-punctuation" placeholder="e.g. 7.5" />
          <ChipGroup label="Standard" accent={accent} values={[std]} onChange={(v) => setStd(v[0] ?? "standard")} options={STANDARDS} singleSelect />
          <Input testID="fat-day" label="Day (YYYY-MM-DD, leave blank for today)" value={dayDate} onChangeText={setDayDate} accent={accent} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="fat-submit" label="Save log" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.log_id} testID={`fat-row-${r.log_id}`} style={[shellStyles.row, r.breach && { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.driver_name}{r.vehicle_rego ? ` · ${r.vehicle_rego}` : ""}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{r.day_date} · {r.standard.toUpperCase()} · work {r.work_hours}h / rest {r.continuous_rest_hours}h</Text>
              {r.breach && r.breach_reasons?.length ? (
                <Text style={{ color: TOKENS.destructive, fontSize: 12, marginTop: 4, fontWeight: "700" }}>{r.breach_reasons.join("; ")}</Text>
              ) : null}
            </View>
            <Pill label={r.breach ? "BREACH" : "WITHIN"} color={r.breach ? TOKENS.destructive : TOKENS.success} />
          </View>
        </View>
      ))}
    />
  );
}
