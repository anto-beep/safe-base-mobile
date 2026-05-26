// Retail — Customer incident log (injury / aggression / theft / slip).
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { CustomerIncident, RetailApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

const TYPES = [
  { value: "injury", label: "Injury / slip" }, { value: "slip", label: "Slip / fall" },
  { value: "aggression", label: "Aggression / threat" }, { value: "theft", label: "Theft / shoplifting" },
  { value: "other", label: "Other" },
];
const SEVERITIES = [
  { value: "minor", label: "Minor" }, { value: "moderate", label: "Moderate" }, { value: "serious", label: "Serious" },
];

export default function CustomerIncidentsScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<CustomerIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [type, setType] = useState("injury");
  const [severity, setSeverity] = useState("minor");
  const [summary, setSummary] = useState("");
  const [occAt, setOccAt] = useState("");
  const [loc, setLoc] = useState("");
  const [cInitials, setCInitials] = useState("");
  const [staff, setStaff] = useState("");
  const [police, setPolice] = useState(false);
  const [ambulance, setAmbulance] = useState(false);
  const [cctv, setCctv] = useState("");
  const [follow, setFollow] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await RetailApi.listCustomerIncidents(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load customer incidents."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!summary.trim() || !occAt.trim()) { setFe("Summary and occurred-at are required."); return; }
    setBusy(true);
    try {
      await RetailApi.createCustomerIncident({
        incident_type: type, severity, summary: summary.trim(), occurred_at: occAt.trim(),
        location: loc.trim() || undefined, customer_initials: cInitials.trim() || undefined,
        staff_involved: staff.trim() || undefined, police_called: police, ambulance_called: ambulance,
        cctv_ref: cctv.trim() || undefined, follow_up_action: follow.trim() || undefined,
      });
      setSummary(""); setOccAt(""); setLoc(""); setCInitials(""); setStaff(""); setCctv(""); setFollow(""); setPolice(false); setAmbulance(false); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save incident."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Retail" title="Customer incidents"
      subtitle="Slips, aggression, theft and other customer-facing events. Tracks police / ambulance / CCTV."
      toggleLabel="Log incident" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "storefront-outline", title: "No customer incidents", body: "Slips, aggression or theft are logged here." }}
      rowCount={rows.length}
      rowsEyebrow="Incidents"
      testIDPrefix="ci"
      formBody={
        <View>
          <ChipGroup label="Type" accent={accent} values={[type]} onChange={(v) => setType(v[0] ?? "injury")} options={TYPES} singleSelect />
          <ChipGroup label="Severity" accent={accent} values={[severity]} onChange={(v) => setSeverity(v[0] ?? "minor")} options={SEVERITIES} singleSelect />
          <Input testID="ci-summary" label="Summary (required)" value={summary} onChangeText={setSummary} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
          <Input testID="ci-occat" label="Occurred at (ISO datetime, required)" value={occAt} onChangeText={setOccAt} accent={accent} placeholder="2025-06-12T14:30:00" />
          <Input testID="ci-loc" label="Location" value={loc} onChangeText={setLoc} accent={accent} />
          <Input testID="ci-cinit" label="Customer initials" value={cInitials} onChangeText={setCInitials} accent={accent} />
          <Input testID="ci-staff" label="Staff involved" value={staff} onChangeText={setStaff} accent={accent} />
          <ChipGroup label="Police called?" accent={accent} values={police ? ["yes"] : []} onChange={(v) => setPolice(v.includes("yes"))} options={[{ value: "yes", label: "Yes" }]} singleSelect />
          <ChipGroup label="Ambulance called?" accent={accent} values={ambulance ? ["yes"] : []} onChange={(v) => setAmbulance(v.includes("yes"))} options={[{ value: "yes", label: "Yes" }]} singleSelect />
          <Input testID="ci-cctv" label="CCTV reference" value={cctv} onChangeText={setCctv} accent={accent} />
          <Input testID="ci-follow" label="Follow-up action" value={follow} onChangeText={setFollow} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="ci-submit" label="Save incident" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.incident_id} testID={`ci-row-${r.incident_id}`} style={[shellStyles.row, r.severity === "serious" && { borderColor: TOKENS.destructive }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.incident_type.replace(/_/g, " ").toUpperCase()}{r.location ? ` · ${r.location}` : ""}</Text>
              <Text style={shellStyles.rowMeta} numberOfLines={2}>{r.summary}</Text>
              <Text style={[shellStyles.rowSub, { fontFamily: MONO }]}>{new Date(r.occurred_at).toLocaleString("en-AU")}{r.customer_initials ? ` · ${r.customer_initials}` : ""}</Text>
              {(r.police_called || r.ambulance_called) ? <Text style={shellStyles.rowSub}>{[r.police_called ? "Police" : null, r.ambulance_called ? "Ambulance" : null].filter(Boolean).join(" · ")}</Text> : null}
              {r.cctv_ref ? <Text style={shellStyles.rowSub}>CCTV: {r.cctv_ref}</Text> : null}
            </View>
            <Pill label={r.severity.toUpperCase()} color={r.severity === "serious" ? TOKENS.destructive : r.severity === "moderate" ? TOKENS.warnInk : TOKENS.success} />
          </View>
        </View>
      ))}
    />
  );
}
