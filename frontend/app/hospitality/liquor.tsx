// Hospitality — RSA / Liquor cert register. Backend route
// /api/hospitality/liquor-certs. Tracks RSA / RSG / Approved Manager.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { LiquorCert, HospitalityApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

const CERT_TYPES = [
  { value: "RSA", label: "RSA" }, { value: "RSG", label: "RSG" }, { value: "Approved Manager", label: "Approved Manager" },
];
const JURIS = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"];

export default function LiquorScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<LiquorCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [ctype, setCtype] = useState("RSA");
  const [cnum, setCnum] = useState("");
  const [juris, setJuris] = useState("NSW");
  const [issued, setIssued] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HospitalityApi.listLiquor(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load liquor certs."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!name.trim() || !ctype) { setFe("Name and certificate type are required."); return; }
    setBusy(true);
    try {
      await HospitalityApi.createLiquor({ worker_name: name.trim(), certificate_type: ctype, certificate_number: cnum.trim() || undefined, jurisdiction: juris, issued_at: issued || undefined, expires_at: expires || undefined });
      setName(""); setCnum(""); setIssued(""); setExpires(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save certificate."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Hospitality" title="RSA / Liquor register"
      subtitle="RSA / RSG / Approved Manager certificates. Required under L&G NSW (and equivalent State liquor authorities)."
      toggleLabel="Add certificate" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "wine-outline", title: "No liquor certificates", body: "Track RSA / RSG / Approved Manager for every staff member who serves liquor." }}
      rowCount={rows.length}
      rowsEyebrow="Holders"
      testIDPrefix="liq"
      formBody={
        <View>
          <Input testID="liq-name" label="Worker name (required)" value={name} onChangeText={setName} accent={accent} />
          <ChipGroup label="Certificate type (required)" accent={accent} values={[ctype]} onChange={(v) => setCtype(v[0] ?? "RSA")} options={CERT_TYPES} singleSelect />
          <Input testID="liq-num" label="Certificate number" value={cnum} onChangeText={setCnum} accent={accent} />
          <ChipGroup label="Jurisdiction" accent={accent} values={[juris]} onChange={(v) => setJuris(v[0] ?? "NSW")} options={JURIS.map(j => ({ value: j, label: j }))} singleSelect />
          <Input testID="liq-issued" label="Issued (YYYY-MM-DD)" value={issued} onChangeText={setIssued} accent={accent} />
          <Input testID="liq-expires" label="Expires (YYYY-MM-DD)" value={expires} onChangeText={setExpires} accent={accent} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="liq-submit" label="Save certificate" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => {
        const status = r._expired ? { label: "EXPIRED", color: TOKENS.destructive } : r._days_to_expiry !== undefined && r._days_to_expiry <= 30 ? { label: `${r._days_to_expiry}D LEFT`, color: TOKENS.warnInk } : { label: r.certificate_type.toUpperCase(), color: TOKENS.success };
        return (
          <View key={r.cert_id} testID={`liq-row-${r.cert_id}`} style={[shellStyles.row, r._expired && { borderColor: TOKENS.destructive }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{r.worker_name}</Text>
                <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{r.certificate_type.toUpperCase()}{r.certificate_number ? ` · ${r.certificate_number}` : ""}{r.jurisdiction ? ` · ${r.jurisdiction}` : ""}</Text>
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
