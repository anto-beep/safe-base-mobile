// Phase 1F · Document Library (SWMS, policies, evidence). Backend: /documents.
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DocumentsApi, SafeBaseDoc } from "@/src/api/extras";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { ChipGroup } from "@/src/components/ChipGroup";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const DOC_TYPES = [
  { value: "swms", label: "SWMS" }, { value: "policy", label: "Policy" },
  { value: "procedure", label: "Procedure" }, { value: "evidence", label: "Evidence" },
  { value: "register", label: "Register" }, { value: "plan", label: "Plan" },
];

export default function DocumentsScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<SafeBaseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [type, setType] = useState("swms");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await DocumentsApi.list(); setRows(Array.isArray(r) ? r : []); }
    catch (e: any) { setError(e?.detail ?? "Could not load documents."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const generate = async () => {
    setFe(null);
    if (!title.trim()) { setFe("Title is required."); return; }
    setBusy(true);
    try {
      await DocumentsApi.generate({ type, title: title.trim() });
      setTitle(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not generate document."); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await DocumentsApi.remove(id); load(); }
    catch (e: any) { Alert.alert("Delete failed", e?.detail ?? "Could not delete."); }
  };

  return (
    <IndustryListShell
      eyebrow="Library" title="Document library"
      subtitle="SWMS, policies, procedures and evidence. AI-generated documents land here."
      toggleLabel="Generate document" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "document-text-outline", title: "No documents", body: "Use the SafeBase web app to upload, or generate a new doc here." }}
      rowCount={rows.length} rowsEyebrow="Library" testIDPrefix="doc"
      formBody={
        <View>
          <ChipGroup label="Type" accent={accent} values={[type]} onChange={(v) => setType(v[0] ?? "swms")} options={DOC_TYPES} singleSelect />
          <Input testID="doc-title" label="Title (required)" value={title} onChangeText={setTitle} accent={accent} placeholder="e.g. Working at heights SWMS" />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="doc-generate" label="Generate (AI)" onPress={generate} accent={accent} loading={busy} iconName="sparkles" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.document_id} testID={`doc-row-${r.document_id}`} style={shellStyles.row}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.title}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{(r.type ?? "DOC").toUpperCase()}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString("en-AU")}` : ""}</Text>
              {r.status ? <Text style={shellStyles.rowSub}>Status: {r.status}</Text> : null}
            </View>
            <TouchableOpacity testID={`doc-del-${r.document_id}`} onPress={() => Alert.alert("Delete", `Delete \"${r.title}\"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => remove(r.document_id) }])}>
              <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    />
  );
}
