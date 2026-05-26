// Transport — NHVR Notifiable Occurrence (HVNL s 596A). 24h deadline
// computed by backend (notify_nhvr_by). Status remains pending until
// notified.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { NhvrOccurrence, TransportApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const TYPES = [
  { value: "death", label: "Death" },
  { value: "serious_injury", label: "Serious injury" },
  { value: "rollover", label: "Rollover" },
  { value: "load_loss", label: "Load loss" },
  { value: "dangerous_goods", label: "DG release" },
  { value: "infrastructure", label: "Infrastructure strike" },
];

export default function NhvrScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<NhvrOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [type, setType] = useState("rollover");
  const [summary, setSummary] = useState("");
  const [rego, setRego] = useState("");
  const [driver, setDriver] = useState("");
  const [occAt, setOccAt] = useState("");
  const [loc, setLoc] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TransportApi.listNhvr(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load NHVR occurrences."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!summary.trim() || !occAt.trim()) { setFe("Summary and occurred-at are required."); return; }
    setBusy(true);
    try {
      await TransportApi.createNhvr({
        occurrence_type: type, summary: summary.trim(), occurred_at: occAt.trim(),
        vehicle_rego: rego.trim() || undefined, driver_name: driver.trim() || undefined,
        location: loc.trim() || undefined,
      });
      setSummary(""); setRego(""); setDriver(""); setOccAt(""); setLoc(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save occurrence."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Transport" title="NHVR occurrences"
      subtitle="HVNL s 596A — serious occurrences must be reported to NHVR within 24h. Backend computes deadline automatically."
      toggleLabel="Log occurrence" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "alert-circle-outline", title: "No occurrences", body: "Notifiable occurrences are logged here. Don't forget the 24h NHVR deadline." }}
      rowCount={rows.length}
      rowsEyebrow="Reports"
      testIDPrefix="nhvr"
      formBody={
        <View>
          <ChipGroup label="Type" accent={accent} values={[type]} onChange={(v) => setType(v[0] ?? "rollover")} options={TYPES} singleSelect />
          <Input testID="nhvr-summary" label="Summary (required)" value={summary} onChangeText={setSummary} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
          <Input testID="nhvr-occat" label="Occurred at (ISO datetime, required)" value={occAt} onChangeText={setOccAt} accent={accent} placeholder="2025-06-12T14:30:00" />
          <Input testID="nhvr-rego" label="Vehicle rego" value={rego} onChangeText={setRego} accent={accent} autoCapitalize="characters" />
          <Input testID="nhvr-driver" label="Driver name" value={driver} onChangeText={setDriver} accent={accent} />
          <Input testID="nhvr-loc" label="Location" value={loc} onChangeText={setLoc} accent={accent} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="nhvr-submit" label="Save occurrence" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => {
        const overdue = !r.nhvr_notified_at && new Date(r.notify_nhvr_by).getTime() < Date.now();
        return (
          <View key={r.occurrence_id} testID={`nhvr-row-${r.occurrence_id}`} style={[shellStyles.row, overdue && { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{r.occurrence_type.replace(/_/g, " ").toUpperCase()}</Text>
                <Text style={shellStyles.rowMeta} numberOfLines={2}>{r.summary}</Text>
                <Text style={[shellStyles.rowSub, { fontFamily: MONO }]}>Occurred {new Date(r.occurred_at).toLocaleString("en-AU")}{r.vehicle_rego ? ` · ${r.vehicle_rego}` : ""}{r.location ? ` · ${r.location}` : ""}</Text>
                <Text style={[shellStyles.rowSub, { color: overdue ? TOKENS.destructive : COLORS.textMuted, fontWeight: overdue ? "700" : "400" }]}>{r.nhvr_notified_at ? `Notified ${new Date(r.nhvr_notified_at).toLocaleString("en-AU")}` : `Notify NHVR by ${new Date(r.notify_nhvr_by).toLocaleString("en-AU")}`}</Text>
              </View>
              <Pill label={r.nhvr_notified_at ? "NOTIFIED" : overdue ? "OVERDUE" : "PENDING"} color={r.nhvr_notified_at ? TOKENS.success : overdue ? TOKENS.destructive : TOKENS.warnInk} />
            </View>
          </View>
        );
      })}
    />
  );
}
