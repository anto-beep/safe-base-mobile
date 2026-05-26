// Phase 1F · Settings: Team & invites. /team endpoints.
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { TeamApi, TeamMember } from "@/src/api/extras";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const ROLES = [
  { value: "owner", label: "Owner" }, { value: "manager", label: "Manager" },
  { value: "safety_lead", label: "Safety lead" }, { value: "worker", label: "Worker" }, { value: "viewer", label: "Viewer" },
];

export default function TeamSettingsScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("worker");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TeamApi.list(); setRows(Array.isArray(r) ? r : []); }
    catch (e: any) { setError(e?.detail ?? "Could not load team."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const invite = async () => {
    setFe(null);
    if (!email.includes("@")) { setFe("Valid email required."); return; }
    setBusy(true);
    try { await TeamApi.invite({ email: email.trim(), role }); setEmail(""); setOpen(false); load(); }
    catch (e: any) { setFe(e?.detail ?? "Could not send invite."); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await TeamApi.remove(id); load(); }
    catch (e: any) { Alert.alert("Remove failed", e?.detail ?? "Could not remove."); }
  };

  return (
    <IndustryListShell
      eyebrow="Settings" title="Team & invites"
      subtitle="Invite teammates and manage roles. Invitees receive a magic-link email."
      toggleLabel="Send invite" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "people-outline", title: "No team members", body: "Invite people by email so they can access this workspace." }}
      rowCount={rows.length} rowsEyebrow="Members" testIDPrefix="team"
      formBody={
        <View>
          <Input testID="team-email" label="Email (required)" value={email} onChangeText={setEmail} accent={accent} autoCapitalize="none" keyboardType="email-address" />
          <ChipGroup label="Role" accent={accent} values={[role]} onChange={(v) => setRole(v[0] ?? "worker")} options={ROLES} singleSelect />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="team-invite" label="Send invite" onPress={invite} accent={accent} loading={busy} iconName="mail" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.invite_id} testID={`team-row-${r.invite_id}`} style={shellStyles.row}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.email}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{(r.role ?? "worker").toUpperCase()} · {(r.status ?? "pending").toUpperCase()}</Text>
            </View>
            <Pill label={r.status === "active" ? "ACTIVE" : "PENDING"} color={r.status === "active" ? TOKENS.success : TOKENS.warnInk} />
            <TouchableOpacity testID={`team-del-${r.invite_id}`} onPress={() => Alert.alert("Remove", `Remove ${r.email}?`, [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => remove(r.invite_id) }])} style={{ marginLeft: 12 }}>
              <Ionicons name="close-circle-outline" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    />
  );
}
