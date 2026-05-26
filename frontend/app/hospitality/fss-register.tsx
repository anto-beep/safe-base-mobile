// Hospitality — Food Safety Supervisor (FSS) Register.
// Backend: GET/POST /api/hospitality/fss-register. Cert expiry highlighted
// (≤30 days = warn, expired = danger). Server gates via food_safety_module.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { FssRecord, HospitalityApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const JURIS = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"];

export default function FssRegisterScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<FssRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [cert, setCert] = useState("");
  const [rto, setRto] = useState("");
  const [issued, setIssued] = useState("");
  const [expires, setExpires] = useState("");
  const [juris, setJuris] = useState<string>("NSW");
  const [primary, setPrimary] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HospitalityApi.listFss(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load FSS register."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const reset = () => { setName(""); setCert(""); setRto(""); setIssued(""); setExpires(""); setPrimary(false); setNotes(""); };

  const save = async () => {
    setFe(null);
    if (!name.trim() || !cert.trim() || !rto.trim()) { setFe("Name, certificate number and RTO are required."); return; }
    setBusy(true);
    try {
      await HospitalityApi.createFss({
        worker_name: name.trim(), certificate_number: cert.trim(), issuing_rto: rto.trim(),
        issued_at: issued || undefined, expires_at: expires || undefined,
        jurisdiction: juris, is_primary_fss: primary, notes: notes.trim() || undefined,
      });
      reset(); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save FSS record."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Hospitality" title="FSS register"
      subtitle="Food Safety Supervisor certificates per FSANZ Std 3.2.2A — every venue must have a current FSS."
      toggleLabel="Add FSS holder" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "ribbon-outline", title: "No FSS holders yet", body: "Add at least one Food Safety Supervisor to satisfy Std 3.2.2A." }}
      rowCount={rows.length}
      rowsEyebrow="Certificate holders"
      testIDPrefix="fss"
      formBody={
        <View>
          <Input testID="fss-name" label="Worker name (required)" value={name} onChangeText={setName} accent={accent} />
          <Input testID="fss-cert" label="Certificate number (required)" value={cert} onChangeText={setCert} accent={accent} />
          <Input testID="fss-rto" label="Issuing RTO (required)" value={rto} onChangeText={setRto} accent={accent} placeholder="e.g. Allara Learning" />
          <Input testID="fss-issued" label="Issued (YYYY-MM-DD)" value={issued} onChangeText={setIssued} accent={accent} placeholder="2024-03-12" />
          <Input testID="fss-expires" label="Expires (YYYY-MM-DD)" value={expires} onChangeText={setExpires} accent={accent} placeholder="2029-03-12" />
          <ChipGroup label="Jurisdiction" accent={accent} values={[juris]} onChange={(v) => setJuris(v[0] ?? "NSW")} options={JURIS.map(j => ({ value: j, label: j }))} singleSelect />
          <ChipGroup label="Primary FSS for venue?" accent={accent} values={primary ? ["yes"] : []} onChange={(v) => setPrimary(v.includes("yes"))} options={[{ value: "yes", label: "Primary nominated FSS" }]} singleSelect />
          <Input testID="fss-notes" label="Notes" value={notes} onChangeText={setNotes} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="fss-submit" label="Save FSS record" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => {
        const status = r._expired ? { label: "EXPIRED", color: TOKENS.destructive } : r._expiring_soon ? { label: `${r._days_to_expiry}D LEFT`, color: TOKENS.warnInk } : { label: "ACTIVE", color: TOKENS.success };
        return (
          <View key={r.fss_id} testID={`fss-row-${r.fss_id}`} style={[shellStyles.row, r._expired && { borderColor: TOKENS.destructive }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{r.worker_name} {r.is_primary_fss ? <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontFamily: MONO }}>· PRIMARY</Text> : null}</Text>
                <Text style={shellStyles.rowMeta}>{r.certificate_number} · {r.issuing_rto}{r.jurisdiction ? ` · ${r.jurisdiction}` : ""}</Text>
                {r.expires_at ? <Text style={shellStyles.rowSub}>Expires {new Date(r.expires_at).toLocaleDateString("en-AU")}</Text> : null}
                {r.notes ? <Text style={shellStyles.rowSub} numberOfLines={2}>{r.notes}</Text> : null}
              </View>
              <Pill label={status.label} color={status.color} />
            </View>
          </View>
        );
      })}
    />
  );
}

// styles unused (shell handles layout)
