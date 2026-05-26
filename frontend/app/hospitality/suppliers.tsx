// Hospitality — Approved Supplier Register (FSANZ Std 3.2.2 approval).
// Tracks ABN, category, approval certificates, last audit.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { Supplier, HospitalityApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

const CATS = [
  { value: "meat", label: "Meat" }, { value: "seafood", label: "Seafood" },
  { value: "dairy", label: "Dairy" }, { value: "produce", label: "Produce" },
  { value: "dry", label: "Dry / pantry" }, { value: "beverage", label: "Beverage" }, { value: "chemical", label: "Chemical" },
];

export default function SuppliersScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [cat, setCat] = useState("produce");
  const [abn, setAbn] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lastAudit, setLastAudit] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HospitalityApi.listSuppliers(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load supplier register."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!name.trim()) { setFe("Supplier name is required."); return; }
    setBusy(true);
    try {
      await HospitalityApi.createSupplier({
        name: name.trim(), category: cat, abn: abn.trim() || undefined,
        contact_email: email.trim() || undefined, contact_phone: phone.trim() || undefined,
        last_audit_at: lastAudit || undefined, notes: notes.trim() || undefined,
      });
      setName(""); setAbn(""); setEmail(""); setPhone(""); setLastAudit(""); setNotes(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save supplier."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Hospitality" title="Approved suppliers"
      subtitle="FSANZ Std 3.2.2 — only purchase food from approved sources. Track ABN, audits, certificates."
      toggleLabel="Add supplier" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "business-outline", title: "No suppliers", body: "Add the suppliers your venue purchases from." }}
      rowCount={rows.length}
      rowsEyebrow="Register"
      testIDPrefix="sup"
      formBody={
        <View>
          <Input testID="sup-name" label="Supplier name (required)" value={name} onChangeText={setName} accent={accent} />
          <ChipGroup label="Category" accent={accent} values={[cat]} onChange={(v) => setCat(v[0] ?? "produce")} options={CATS} singleSelect />
          <Input testID="sup-abn" label="ABN" value={abn} onChangeText={setAbn} accent={accent} keyboardType="numbers-and-punctuation" />
          <Input testID="sup-email" label="Email" value={email} onChangeText={setEmail} accent={accent} autoCapitalize="none" keyboardType="email-address" />
          <Input testID="sup-phone" label="Phone" value={phone} onChangeText={setPhone} accent={accent} keyboardType="phone-pad" />
          <Input testID="sup-audit" label="Last audit (YYYY-MM-DD)" value={lastAudit} onChangeText={setLastAudit} accent={accent} placeholder="2025-02-10" />
          <Input testID="sup-notes" label="Notes" value={notes} onChangeText={setNotes} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="sup-submit" label="Save supplier" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.supplier_id} testID={`sup-row-${r.supplier_id}`} style={shellStyles.row}>
          <Text style={shellStyles.rowTitle}>{r.name}</Text>
          <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{(r.category ?? "").toUpperCase()}{r.abn ? ` · ABN ${r.abn}` : ""}</Text>
          {(r.contact_email || r.contact_phone) ? <Text style={shellStyles.rowSub}>{[r.contact_email, r.contact_phone].filter(Boolean).join(" · ")}</Text> : null}
          {r.last_audit_at ? <Text style={shellStyles.rowSub}>Last audit {new Date(r.last_audit_at).toLocaleDateString("en-AU")}</Text> : null}
          {r.notes ? <Text style={shellStyles.rowSub} numberOfLines={2}>{r.notes}</Text> : null}
        </View>
      ))}
    />
  );
}
