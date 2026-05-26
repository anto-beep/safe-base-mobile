// Healthcare — Care minutes log. Stats: 30-day total minutes.
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { CareMinute, HealthcareApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, PrimaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const TYPES = [
  { value: "rn", label: "RN time" },
  { value: "direct_care", label: "Direct care" },
  { value: "allied_health", label: "Allied health" },
];

export default function CareMinutesScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<CareMinute[]>([]);
  const [totalMin, setTotalMin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [initials, setInitials] = useState("");
  const [minutes, setMinutes] = useState("");
  const [type, setType] = useState("direct_care");
  const [clin, setClin] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HealthcareApi.listCareMinutes(); setRows(r.rows ?? []); setTotalMin(r.total_minutes ?? 0); }
    catch (e: any) { setError(e?.detail ?? "Could not load care minutes."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!initials.trim() || !minutes || !type) { setFe("Consumer initials, minutes and type are required."); return; }
    setBusy(true);
    try {
      await HealthcareApi.createCareMinutes({
        consumer_initials: initials.trim(), minutes: Number(minutes), care_type: type,
        clinician: clin.trim() || undefined, date: date || undefined, notes: notes.trim() || undefined,
      });
      setInitials(""); setMinutes(""); setClin(""); setDate(""); setNotes(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save care minutes."); }
    finally { setBusy(false); }
  };

  const hours = Math.round(totalMin / 60);

  return (
    <IndustryListShell
      eyebrow="Healthcare" title="Care minutes"
      subtitle="Direct care time per consumer. Evidence for ACQSC and Star Ratings."
      toggleLabel="Log care minutes" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "heart-outline", title: "No care minutes", body: "Log direct care time per consumer per shift." }}
      rowCount={rows.length}
      rowsEyebrow="Recent logs"
      testIDPrefix="cm"
      stats={
        <View style={s.statRow}>
          <View style={s.statBox}><Text style={s.statLabel}>Total mins</Text><Text style={s.statValue}>{totalMin}</Text></View>
          <View style={s.statBox}><Text style={s.statLabel}>≈ hours</Text><Text style={s.statValue}>{hours}</Text></View>
          <View style={s.statBox}><Text style={s.statLabel}>Entries</Text><Text style={s.statValue}>{rows.length}</Text></View>
        </View>
      }
      formBody={
        <View>
          <Input testID="cm-initials" label="Consumer initials (required)" value={initials} onChangeText={setInitials} accent={accent} placeholder="e.g. J.S." />
          <Input testID="cm-minutes" label="Minutes (required)" value={minutes} onChangeText={setMinutes} accent={accent} keyboardType="numeric" />
          <ChipGroup label="Care type" accent={accent} values={[type]} onChange={(v) => setType(v[0] ?? "direct_care")} options={TYPES} singleSelect />
          <Input testID="cm-clin" label="Clinician" value={clin} onChangeText={setClin} accent={accent} />
          <Input testID="cm-date" label="Date (YYYY-MM-DD, blank = today)" value={date} onChangeText={setDate} accent={accent} />
          <Input testID="cm-notes" label="Notes" value={notes} onChangeText={setNotes} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="cm-submit" label="Save log" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.log_id} testID={`cm-row-${r.log_id}`} style={shellStyles.row}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.consumer_initials} · {r.minutes} min</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{r.care_type.replace(/_/g, " ").toUpperCase()}{r.clinician ? ` · ${r.clinician}` : ""} · {r.date}</Text>
              {r.notes ? <Text style={shellStyles.rowSub} numberOfLines={2}>{r.notes}</Text> : null}
            </View>
          </View>
        </View>
      ))}
    />
  );
}

const s = StyleSheet.create({
  statRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 12 },
  statBox: { flex: 1, marginHorizontal: 4, borderWidth: 1, borderColor: TOKENS.border, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center" },
  statLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: MONO },
  statValue: { color: TOKENS.ink, fontSize: 20, fontWeight: "800", marginTop: 4 },
});
