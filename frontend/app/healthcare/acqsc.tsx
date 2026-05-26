// Healthcare — ACQSC Quality Standards (1-8) evidence register.
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AcqscEvidence, HealthcareApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const STANDARDS = [
  { value: 1, label: "1 · Consumer dignity" },
  { value: 2, label: "2 · Ongoing assessment" },
  { value: 3, label: "3 · Personal & clinical care" },
  { value: 4, label: "4 · Services & supports" },
  { value: 5, label: "5 · Service environment" },
  { value: 6, label: "6 · Feedback & complaints" },
  { value: 7, label: "7 · Human resources" },
  { value: 8, label: "8 · Organisational governance" },
];
const TYPES = [
  { value: "policy", label: "Policy" }, { value: "procedure", label: "Procedure" },
  { value: "record", label: "Record" }, { value: "training", label: "Training" },
];

export default function AcqscScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<AcqscEvidence[]>([]);
  const [coverage, setCoverage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [std, setStd] = useState(1);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("policy");
  const [ref, setRef] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HealthcareApi.listAcqsc(); setRows(r.rows ?? []); setCoverage(r.coverage ?? {}); }
    catch (e: any) { setError(e?.detail ?? "Could not load ACQSC evidence."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!title.trim()) { setFe("Title is required."); return; }
    setBusy(true);
    try {
      await HealthcareApi.createAcqsc({
        standard: std, title: title.trim(), description: desc.trim() || undefined,
        evidence_type: type, linked_doc_ref: ref.trim() || undefined,
        next_review_at: next || undefined,
      });
      setTitle(""); setDesc(""); setRef(""); setNext(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save evidence."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Healthcare" title="ACQSC evidence"
      subtitle="Aged Care Quality Standards 1-8. Track evidence per standard for audit readiness."
      toggleLabel="Add evidence" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "documents-outline", title: "No evidence registered", body: "Map at least one piece of evidence to each of the 8 standards." }}
      rowCount={rows.length}
      rowsEyebrow="Evidence register"
      testIDPrefix="acq"
      stats={
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {Object.entries(coverage).map(([k, v]) => (
            <View key={k} style={[s.cov, v === 0 && s.covEmpty]}>
              <Text style={s.covLabel}>STD {k}</Text>
              <Text style={[s.covValue, v === 0 && { color: TOKENS.destructive }]}>{v}</Text>
            </View>
          ))}
        </ScrollView>
      }
      formBody={
        <View>
          <ChipGroup label="Standard" accent={accent} values={[std]} onChange={(v) => setStd((v[0] as number) ?? 1)} options={STANDARDS} singleSelect />
          <Input testID="acq-title" label="Title (required)" value={title} onChangeText={setTitle} accent={accent} placeholder="e.g. Medication management policy v3" />
          <Input testID="acq-desc" label="Description" value={desc} onChangeText={setDesc} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
          <ChipGroup label="Type" accent={accent} values={[type]} onChange={(v) => setType(v[0] ?? "policy")} options={TYPES} singleSelect />
          <Input testID="acq-ref" label="Linked doc reference" value={ref} onChangeText={setRef} accent={accent} placeholder="e.g. DOC-12345" />
          <Input testID="acq-next" label="Next review (YYYY-MM-DD)" value={next} onChangeText={setNext} accent={accent} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="acq-submit" label="Save evidence" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.evidence_id} testID={`acq-row-${r.evidence_id}`} style={shellStyles.row}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.title}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>STD {r.standard}{r.evidence_type ? ` · ${r.evidence_type.toUpperCase()}` : ""}{r.linked_doc_ref ? ` · ${r.linked_doc_ref}` : ""}</Text>
              {r.description ? <Text style={shellStyles.rowSub} numberOfLines={2}>{r.description}</Text> : null}
              {r.next_review_at ? <Text style={shellStyles.rowSub}>Next review {new Date(r.next_review_at).toLocaleDateString("en-AU")}</Text> : null}
            </View>
            <Pill label={`STD ${r.standard}`} color={accent} />
          </View>
        </View>
      ))}
    />
  );
}

const s = StyleSheet.create({
  cov: { borderWidth: 1, borderColor: TOKENS.border, paddingVertical: 8, paddingHorizontal: 12, marginRight: 6, alignItems: "center", minWidth: 64 },
  covEmpty: { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" },
  covLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: MONO, letterSpacing: 1.2 },
  covValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800", marginTop: 2 },
});
