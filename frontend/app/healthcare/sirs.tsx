// Healthcare — SIRS incidents (Aged Care 24h / 30d deadlines).
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

import { HealthcareApi, SirsIncident } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

// Backend priority-one categories
const CATEGORIES = [
  { value: "unreasonable_use_of_force", label: "Unreasonable use of force" },
  { value: "unlawful_sexual_contact", label: "Unlawful sexual contact" },
  { value: "psychological_abuse", label: "Psychological abuse" },
  { value: "neglect_with_serious_harm", label: "Neglect (serious harm)" },
  { value: "theft_financial_coercion", label: "Theft / financial coercion" },
  { value: "unexpected_death", label: "Unexpected death" },
  { value: "inappropriate_restraint", label: "Inappropriate restraint" },
  { value: "unexplained_absence", label: "Unexplained absence" },
  { value: "other_p2", label: "Other (priority 2)" },
];

export default function SirsScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<SirsIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const [cat, setCat] = useState("unexpected_death");
  const [summary, setSummary] = useState("");
  const [occAt, setOccAt] = useState("");
  const [initials, setInitials] = useState("");
  const [service, setService] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HealthcareApi.listSirs(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load SIRS incidents."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!summary.trim() || !occAt.trim()) { setFe("Summary and occurred-at are required."); return; }
    setBusy(true);
    try {
      await HealthcareApi.createSirs({
        category: cat, summary: summary.trim(), occurred_at: occAt.trim(),
        consumer_initials: initials.trim() || undefined, service_code: service.trim() || undefined,
      });
      setSummary(""); setOccAt(""); setInitials(""); setService(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save incident."); }
    finally { setBusy(false); }
  };

  const submitToAcqsc = async (incidentId: string) => {
    setSubmitting(incidentId);
    try {
      await HealthcareApi.submitSirs(incidentId);
      Alert.alert("Submitted", "Marked as submitted to ACQSC. Record the submission reference in the audit log.");
      load();
    } catch (e: any) { Alert.alert("Submit failed", e?.detail ?? "Could not submit."); }
    finally { setSubmitting(null); }
  };

  return (
    <IndustryListShell
      eyebrow="Healthcare" title="SIRS incidents"
      subtitle="Aged Care Quality & Safety Commission — Priority 1 within 24h, Priority 2 within 30d."
      toggleLabel="Report SIRS incident" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "medkit-outline", title: "No SIRS incidents", body: "Report any serious incident impacting an aged-care consumer here." }}
      rowCount={rows.length}
      rowsEyebrow="Incidents"
      testIDPrefix="sirs"
      formBody={
        <View>
          <ChipGroup label="Category" accent={accent} values={[cat]} onChange={(v) => setCat(v[0] ?? "unexpected_death")} options={CATEGORIES} singleSelect />
          <Input testID="sirs-summary" label="Summary (required)" value={summary} onChangeText={setSummary} accent={accent} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
          <Input testID="sirs-occat" label="Occurred at (ISO datetime, required)" value={occAt} onChangeText={setOccAt} accent={accent} placeholder="2025-06-12T14:30:00" />
          <Input testID="sirs-initials" label="Consumer initials" value={initials} onChangeText={setInitials} accent={accent} />
          <Input testID="sirs-service" label="Service code" value={service} onChangeText={setService} accent={accent} placeholder="e.g. 5-1234567890" />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="sirs-submit" label="Report incident" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => {
        const overdue = !r.acqsc_submitted_at && new Date(r.notify_by_24h).getTime() < Date.now();
        return (
          <View key={r.incident_id} testID={`sirs-row-${r.incident_id}`} style={[shellStyles.row, overdue && { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{r.category.replace(/_/g, " ").toUpperCase()}</Text>
                <Text style={shellStyles.rowMeta} numberOfLines={2}>{r.summary}</Text>
                <Text style={[shellStyles.rowSub, { fontFamily: MONO }]}>Occurred {new Date(r.occurred_at).toLocaleString("en-AU")}{r.consumer_initials ? ` · ${r.consumer_initials}` : ""}</Text>
                <Text style={[shellStyles.rowSub, { color: overdue ? TOKENS.destructive : COLORS.textMuted, fontWeight: overdue ? "700" : "400" }]}>
                  {r.acqsc_submitted_at ? `Submitted ${new Date(r.acqsc_submitted_at).toLocaleString("en-AU")}` : `Notify by ${new Date(r.notify_by_24h).toLocaleString("en-AU")} (P1)`}
                </Text>
              </View>
              <Pill label={r.priority === "one" ? "P1" : "P2"} color={r.priority === "one" ? TOKENS.destructive : TOKENS.warnInk} />
            </View>
            {!r.acqsc_submitted_at ? (
              <TouchableOpacity testID={`sirs-submit-${r.incident_id}`} onPress={() => submitToAcqsc(r.incident_id)} disabled={submitting === r.incident_id} style={{ marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: accent, alignSelf: "flex-start", flexDirection: "row", alignItems: "center" }}>
                {submitting === r.incident_id ? <ActivityIndicator size="small" color={accent} /> : <Text style={{ color: accent, fontWeight: "800", fontSize: 12, letterSpacing: 1.2 }}>MARK SUBMITTED TO ACQSC</Text>}
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    />
  );
}
