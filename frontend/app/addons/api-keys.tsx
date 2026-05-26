// Phase 1I · API keys — universal API access.
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Text, View } from "react-native";

import { ApiKeysApi, ApiKey } from "@/src/api/extras";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

export default function ApiKeysScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<ApiKey[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [label, setLabel] = useState("");
  const [target, setTarget] = useState("generic");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const [r, t] = await Promise.all([ApiKeysApi.list(), ApiKeysApi.targets().catch(() => ["generic"])]); setRows(Array.isArray(r) ? r : []); setTargets(Array.isArray(t) ? t : ["generic"]); }
    catch (e: any) { setError(e?.detail ?? "Could not load API keys."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!label.trim()) { setFe("Label is required."); return; }
    setBusy(true);
    try {
      const r: any = await ApiKeysApi.create({ label: label.trim(), integration_target: target });
      if (r.secret) Alert.alert("Key created", `Save this secret now — it won't be shown again:\n\n${r.secret}`);
      setLabel(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not create key."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Add-on" title="API keys"
      subtitle="Generate keys for integrations (Xero, Deputy, Teletrac, Shopify, AHPRA poll, etc.)."
      toggleLabel="Create key" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "key-outline", title: "No API keys", body: "Generate a key to integrate SafeBase with your other systems." }}
      rowCount={rows.length} rowsEyebrow="Active keys" testIDPrefix="key"
      formBody={
        <View>
          <Input testID="key-label" label="Label (required)" value={label} onChangeText={setLabel} accent={accent} placeholder="e.g. Xero production" />
          <ChipGroup label="Integration target" accent={accent} values={[target]} onChange={(v) => setTarget(v[0] ?? "generic")} options={(targets ?? ["generic"]).map(t => ({ value: t, label: t }))} singleSelect />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="key-create" label="Create key" onPress={save} accent={accent} loading={busy} iconName="key" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.key_id} testID={`key-row-${r.key_id}`} style={shellStyles.row}>
          <Text style={shellStyles.rowTitle}>{r.label}</Text>
          <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{r.key_id}{r.integration_target ? ` · ${r.integration_target}` : ""}</Text>
          {r.last_used_at ? <Text style={shellStyles.rowSub}>Last used {new Date(r.last_used_at).toLocaleString("en-AU")}</Text> : null}
          {r.created_at ? <Text style={shellStyles.rowSub}>Created {new Date(r.created_at).toLocaleDateString("en-AU")}</Text> : null}
        </View>
      ))}
    />
  );
}
