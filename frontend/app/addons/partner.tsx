// Phase 1I · Partner portal — manage client accounts.
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { PartnerApi, PartnerClient } from "@/src/api/extras";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const INDUSTRIES = [
  { value: "trades", label: "Trades" }, { value: "hospitality", label: "Hospitality" },
  { value: "transport", label: "Transport" }, { value: "healthcare", label: "Healthcare" }, { value: "retail", label: "Retail" },
];

export default function PartnerPortalScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<PartnerClient[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("trades");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const [c, su] = await Promise.all([PartnerApi.clients(), PartnerApi.summary().catch(() => null)]); setRows(Array.isArray(c) ? c : []); setSummary(su); }
    catch (e: any) { setError(e?.detail ?? "Could not load partner portal."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!name.trim()) { setFe("Client name is required."); return; }
    setBusy(true);
    try { await PartnerApi.addClient({ name: name.trim(), industry }); setName(""); setOpen(false); load(); }
    catch (e: any) { setFe(e?.detail ?? "Could not add client."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Add-on" title="Partner portal"
      subtitle={summary ? `${summary.total_clients ?? 0} clients managed.` : "Manage your clients' SafeBase workspaces from one place."}
      toggleLabel="Add client" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "briefcase-outline", title: "No clients", body: "Add your first client workspace to begin." }}
      rowCount={rows.length} rowsEyebrow="Clients" testIDPrefix="pcl"
      formBody={
        <View>
          <Input testID="pcl-name" label="Client name (required)" value={name} onChangeText={setName} accent={accent} />
          <ChipGroup label="Industry" accent={accent} values={[industry]} onChange={(v) => setIndustry(v[0] ?? "trades")} options={INDUSTRIES} singleSelect />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="pcl-add" label="Add client" onPress={save} accent={accent} loading={busy} iconName="add" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.client_id} testID={`pcl-row-${r.client_id}`} style={shellStyles.row}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.name}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{(r.industry ?? "").toUpperCase()}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString("en-AU")}` : ""}</Text>
            </View>
            <Pill label={(r.status ?? "ACTIVE").toUpperCase()} color={r.status === "churned" ? TOKENS.destructive : TOKENS.success} />
          </View>
        </View>
      ))}
    />
  );
}
