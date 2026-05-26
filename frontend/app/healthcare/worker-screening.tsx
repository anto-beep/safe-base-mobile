// Healthcare — Worker Screening (NDIS / Aged Care / WWCC clearances).
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { HealthcareApi, WorkerScreen } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

const TYPES = [
  { value: "ndis", label: "NDIS worker screening" },
  { value: "aged_care", label: "Aged Care clearance" },
  { value: "wwcc", label: "WWCC" },
  { value: "police_check", label: "Police check" },
];
const OUTCOMES = [
  { value: "cleared", label: "Cleared" }, { value: "barred", label: "Barred" }, { value: "pending", label: "Pending" },
];
const JURIS = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"];

export default function ScreeningScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<WorkerScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("ndis");
  const [num, setNum] = useState("");
  const [juris, setJuris] = useState("NSW");
  const [issued, setIssued] = useState("");
  const [expires, setExpires] = useState("");
  const [outcome, setOutcome] = useState("cleared");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HealthcareApi.listScreening(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load worker screening."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!name.trim() || !type) { setFe("Worker name and screening type are required."); return; }
    setBusy(true);
    try {
      await HealthcareApi.createScreening({
        worker_name: name.trim(), screening_type: type,
        clearance_number: num.trim() || undefined, jurisdiction: juris,
        issued_at: issued || undefined, expires_at: expires || undefined,
        outcome, notes: notes.trim() || undefined,
      });
      setName(""); setNum(""); setIssued(""); setExpires(""); setNotes(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save screening."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Healthcare" title="Worker screening"
      subtitle="NDIS / Aged Care / WWCC / Police check clearances. Expired clearances block roster eligibility."
      toggleLabel="Add screening" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "shield-checkmark-outline", title: "No screenings", body: "Record every NDIS / Aged Care / WWCC clearance — these gate roster eligibility." }}
      rowCount={rows.length}
      rowsEyebrow="Register"
      testIDPrefix="ws"
      formBody={
        <View>
          <Input testID="ws-name" label="Worker name (required)" value={name} onChangeText={setName} accent={accent} />
          <ChipGroup label="Screening type (required)" accent={accent} values={[type]} onChange={(v) => setType(v[0] ?? "ndis")} options={TYPES} singleSelect />
          <Input testID="ws-num" label="Clearance number" value={num} onChangeText={setNum} accent={accent} />
          <ChipGroup label="Jurisdiction" accent={accent} values={[juris]} onChange={(v) => setJuris(v[0] ?? "NSW")} options={JURIS.map(j => ({ value: j, label: j }))} singleSelect />
          <Input testID="ws-issued" label="Issued (YYYY-MM-DD)" value={issued} onChangeText={setIssued} accent={accent} />
          <Input testID="ws-expires" label="Expires (YYYY-MM-DD)" value={expires} onChangeText={setExpires} accent={accent} />
          <ChipGroup label="Outcome" accent={accent} values={[outcome]} onChange={(v) => setOutcome(v[0] ?? "cleared")} options={OUTCOMES} singleSelect />
          <Input testID="ws-notes" label="Notes" value={notes} onChangeText={setNotes} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="ws-submit" label="Save screening" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => {
        const status = r.outcome === "barred" ? { label: "BARRED", color: TOKENS.destructive }
          : r._expired ? { label: "EXPIRED", color: TOKENS.destructive }
          : r._days_to_expiry !== undefined && r._days_to_expiry <= 30 ? { label: `${r._days_to_expiry}D LEFT`, color: TOKENS.warnInk }
          : { label: r.outcome.toUpperCase(), color: r.outcome === "cleared" ? TOKENS.success : TOKENS.warnInk };
        return (
          <View key={r.screen_id} testID={`ws-row-${r.screen_id}`} style={[shellStyles.row, (r._expired || r.outcome === "barred") && { borderColor: TOKENS.destructive }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{r.worker_name}</Text>
                <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{r.screening_type.replace(/_/g, " ").toUpperCase()}{r.clearance_number ? ` · ${r.clearance_number}` : ""}{r.jurisdiction ? ` · ${r.jurisdiction}` : ""}</Text>
                {r.expires_at ? <Text style={shellStyles.rowSub}>Expires {new Date(r.expires_at).toLocaleDateString("en-AU")}</Text> : null}
              </View>
              <Pill label={status.label} color={status.color} />
            </View>
          </View>
        );
      })}
    />
  );
}
