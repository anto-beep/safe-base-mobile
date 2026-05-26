// Healthcare — NDIS reportable incidents. High-risk = 24h deadline, others 5d.
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { HealthcareApi, NdisReportable } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const CATEGORIES = [
  { value: "death", label: "Death" },
  { value: "serious_injury", label: "Serious injury" },
  { value: "sexual_misconduct", label: "Sexual misconduct" },
  { value: "unauthorised_restraint", label: "Unauthorised restraint" },
  { value: "abuse_neglect", label: "Abuse / neglect" },
  { value: "unlawful_contact", label: "Unlawful contact" },
  { value: "theft", label: "Theft" },
  { value: "other", label: "Other" },
];

export default function NdisScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<NdisReportable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [cat, setCat] = useState("serious_injury");
  const [summary, setSummary] = useState("");
  const [occAt, setOccAt] = useState("");
  const [initials, setInitials] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HealthcareApi.listNdis(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load NDIS reportables."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!summary.trim() || !occAt.trim()) { setFe("Summary and occurred-at are required."); return; }
    setBusy(true);
    try {
      await HealthcareApi.createNdis({
        category: cat, summary: summary.trim(), occurred_at: occAt.trim(),
        participant_initials: initials.trim() || undefined,
      });
      setSummary(""); setOccAt(""); setInitials(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save report."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Healthcare" title="NDIS reportable"
      subtitle="NDIS Quality & Safeguards Commission. High-risk categories must be notified within 24h."
      toggleLabel="Report incident" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "alert-circle-outline", title: "No NDIS reportables", body: "Reportable incidents involving NDIS participants are logged here." }}
      rowCount={rows.length}
      rowsEyebrow="Reportables"
      testIDPrefix="ndis"
      formBody={
        <View>
          <ChipGroup label="Category" accent={accent} values={[cat]} onChange={(v) => setCat(v[0] ?? "serious_injury")} options={CATEGORIES} singleSelect />
          <Input testID="ndis-summary" label="Summary (required)" value={summary} onChangeText={setSummary} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
          <Input testID="ndis-occat" label="Occurred at (ISO datetime, required)" value={occAt} onChangeText={setOccAt} accent={accent} placeholder="2025-06-12T14:30:00" />
          <Input testID="ndis-initials" label="Participant initials" value={initials} onChangeText={setInitials} accent={accent} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="ndis-submit" label="Report incident" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => {
        const overdue = !r.commission_submitted_at && new Date(r.notify_commission_by).getTime() < Date.now();
        return (
          <View key={r.incident_id} testID={`ndis-row-${r.incident_id}`} style={[shellStyles.row, overdue && { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{r.category.replace(/_/g, " ").toUpperCase()}</Text>
                <Text style={shellStyles.rowMeta} numberOfLines={2}>{r.summary}</Text>
                <Text style={[shellStyles.rowSub, { fontFamily: MONO }]}>Occurred {new Date(r.occurred_at).toLocaleString("en-AU")}{r.participant_initials ? ` · ${r.participant_initials}` : ""}</Text>
                <Text style={[shellStyles.rowSub, { color: overdue ? TOKENS.destructive : COLORS.textMuted, fontWeight: overdue ? "700" : "400" }]}>
                  {r.commission_submitted_at ? `Submitted ${new Date(r.commission_submitted_at).toLocaleString("en-AU")}` : `Notify by ${new Date(r.notify_commission_by).toLocaleString("en-AU")}`}
                </Text>
              </View>
              <Pill label={r.is_high_risk ? "HIGH RISK" : "STANDARD"} color={r.is_high_risk ? TOKENS.destructive : TOKENS.warnInk} />
            </View>
          </View>
        );
      })}
    />
  );
}
