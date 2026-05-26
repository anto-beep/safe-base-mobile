// Phase 1I · TradeInduct / VenueInduct — QR induction programs.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { TradeInductApi, InductionProgram } from "@/src/api/extras";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, PrimaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function TradeInductScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<InductionProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TradeInductApi.programs(); setRows(Array.isArray(r) ? r : []); }
    catch (e: any) { setError(e?.detail ?? "Could not load induction programs."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!name.trim()) { setFe("Program name is required."); return; }
    setBusy(true);
    try {
      const dq = await TradeInductApi.defaultQuestions().catch(() => []);
      await TradeInductApi.create({ name: name.trim(), questions: dq });
      setName(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not create program."); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await TradeInductApi.remove(id); load(); }
    catch (e: any) { Alert.alert("Delete failed", e?.detail ?? ""); }
  };

  return (
    <IndustryListShell
      eyebrow="Add-on" title="TradeInduct / VenueInduct"
      subtitle="QR-based induction programs for visitors, casuals, contractors. Auto-generated questions per industry."
      toggleLabel="New program" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "qr-code-outline", title: "No induction programs", body: "Create a program — we'll pre-populate the question set for your industry." }}
      rowCount={rows.length} rowsEyebrow="Programs" testIDPrefix="tri"
      formBody={
        <View>
          <Input testID="tri-name" label="Program name (required)" value={name} onChangeText={setName} accent={accent} placeholder="e.g. Sydney CBD site induction" />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="tri-create" label="Create program" onPress={save} accent={accent} loading={busy} iconName="add" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.program_id} testID={`tri-row-${r.program_id}`} style={shellStyles.row}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.name}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>Code: {r.code ?? "—"} · {r.questions?.length ?? 0} questions</Text>
              <TouchableOpacity onPress={() => router.push(`/module/tradeinduct-${r.program_id}` as any)} style={{ marginTop: 6 }}>
                <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>View submissions →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => Alert.alert("Delete", `Delete ${r.name}?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => remove(r.program_id) }])}>
              <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    />
  );
}
