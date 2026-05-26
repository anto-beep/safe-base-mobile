// Transport — CoR Due Diligence log (HVNL s 26C).
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { CorDueDiligence, TransportApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent, COLORS } from "@/src/theme/colors";

const PARTIES = [
  { value: "Consigner", label: "Consigner" }, { value: "Packer", label: "Packer" },
  { value: "Loader", label: "Loader" }, { value: "Driver", label: "Driver" },
  { value: "Scheduler", label: "Scheduler" }, { value: "Operator", label: "Operator" },
  { value: "Consignee", label: "Consignee" },
];

export default function CorScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<CorDueDiligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [party, setParty] = useState("Driver");
  const [hazard, setHazard] = useState("");
  const [action, setAction] = useState("");
  const [evidence, setEvidence] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [nextReview, setNextReview] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TransportApi.listCor(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load CoR entries."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!party || !action.trim()) { setFe("Party and action are required."); return; }
    setBusy(true);
    try {
      await TransportApi.createCor({
        party, action: action.trim(), hazard: hazard.trim() || undefined,
        evidence_link: evidence.trim() || undefined, reviewed_by: reviewer.trim() || undefined,
        next_review_at: nextReview || undefined,
      });
      setHazard(""); setAction(""); setEvidence(""); setReviewer(""); setNextReview(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save entry."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Transport" title="CoR due diligence"
      subtitle="HVNL s 26C — executive officer due-diligence log. Demonstrates active oversight per Chain of Responsibility."
      toggleLabel="Add due-diligence entry" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "shield-checkmark-outline", title: "No CoR entries", body: "Log each due-diligence action with evidence — vital for officer defence." }}
      rowCount={rows.length}
      rowsEyebrow="Register"
      testIDPrefix="cor"
      formBody={
        <View>
          <ChipGroup label="Party (required)" accent={accent} values={[party]} onChange={(v) => setParty(v[0] ?? "Driver")} options={PARTIES} singleSelect />
          <Input testID="cor-hazard" label="Hazard / risk" value={hazard} onChangeText={setHazard} accent={accent} placeholder="e.g. Fatigue, mass, speed, load restraint" />
          <Input testID="cor-action" label="Action taken (required)" value={action} onChangeText={setAction} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
          <Input testID="cor-evidence" label="Evidence link" value={evidence} onChangeText={setEvidence} accent={accent} placeholder="URL or doc ref" autoCapitalize="none" />
          <Input testID="cor-reviewer" label="Reviewed by" value={reviewer} onChangeText={setReviewer} accent={accent} />
          <Input testID="cor-next" label="Next review (YYYY-MM-DD)" value={nextReview} onChangeText={setNextReview} accent={accent} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="cor-submit" label="Save entry" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.entry_id} testID={`cor-row-${r.entry_id}`} style={shellStyles.row}>
          <Text style={shellStyles.rowTitle}>{r.party}{r.hazard ? ` · ${r.hazard}` : ""}</Text>
          <Text style={shellStyles.rowMeta} numberOfLines={3}>{r.action}</Text>
          {r.evidence_link ? <Text style={[shellStyles.rowSub, { color: accent }]}>{r.evidence_link}</Text> : null}
          <Text style={[shellStyles.rowSub, { fontFamily: MONO }]}>{new Date(r.created_at).toLocaleString("en-AU")}{r.reviewed_by ? ` · ${r.reviewed_by}` : ""}{r.next_review_at ? ` · review ${new Date(r.next_review_at).toLocaleDateString("en-AU")}` : ""}</Text>
        </View>
      ))}
    />
  );
}
