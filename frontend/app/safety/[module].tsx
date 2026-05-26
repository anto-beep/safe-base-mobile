// Phase 1G · Generic Safety stack screen. Backed by /safety/{module}.
// Modules: inspections / first_aid / ppe / plant / substances / toolbox_talks.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { SafetyApi, type SafetyModule } from "@/src/api/safebase";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Card, Eyebrow, Input, MONO, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

interface ModuleConfig { eyebrow: string; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; fields: { key: string; label: string; placeholder?: string; multiline?: boolean; required?: boolean }[]; }

const CONFIG: Record<string, ModuleConfig> = {
  inspections: { eyebrow: "Safety", title: "Inspections", subtitle: "Site, vehicle and equipment inspection register.", icon: "search-outline", fields: [
    { key: "site", label: "Site / location", required: true },
    { key: "inspector", label: "Inspector", required: true },
    { key: "findings", label: "Findings", multiline: true },
    { key: "next_due", label: "Next due (YYYY-MM-DD)" },
  ] },
  first_aid: { eyebrow: "Safety", title: "First aid log", subtitle: "Treatments and consumables used.", icon: "medical-outline", fields: [
    { key: "patient", label: "Patient name / initials", required: true },
    { key: "treatment", label: "Treatment given", required: true, multiline: true },
    { key: "location", label: "Location" },
    { key: "administered_by", label: "Administered by" },
  ] },
  ppe: { eyebrow: "Safety", title: "PPE issue", subtitle: "Hi-vis, hard-hats, gloves, respirators issued to workers.", icon: "shield-outline", fields: [
    { key: "worker", label: "Worker", required: true },
    { key: "item", label: "PPE item", required: true },
    { key: "size", label: "Size / spec" },
    { key: "issued_at", label: "Date issued" },
  ] },
  plant: { eyebrow: "Safety", title: "Plant register", subtitle: "Plant & equipment owned or hired.", icon: "build-outline", fields: [
    { key: "name", label: "Plant name", required: true },
    { key: "serial", label: "Serial number" },
    { key: "last_service", label: "Last service (YYYY-MM-DD)" },
    { key: "next_service", label: "Next service due (YYYY-MM-DD)" },
  ] },
  substances: { eyebrow: "Safety", title: "Hazardous substances", subtitle: "SDS register — chemicals on site with safety data sheets.", icon: "flask-outline", fields: [
    { key: "substance", label: "Substance name", required: true },
    { key: "sds_ref", label: "SDS reference" },
    { key: "location", label: "Stored at" },
    { key: "hazard_class", label: "Hazard class" },
  ] },
  toolbox_talks: { eyebrow: "Safety", title: "Toolbox talks", subtitle: "Pre-start talks with attendance.", icon: "chatbubbles-outline", fields: [
    { key: "topic", label: "Topic", required: true },
    { key: "presenter", label: "Presenter", required: true },
    { key: "attendees", label: "Attendees (comma-separated)", multiline: true },
    { key: "date", label: "Date (YYYY-MM-DD)" },
  ] },
};

export default function SafetyModuleScreen() {
  const accent = useAccent();
  const router = useRouter();
  const { module: rawModule } = useLocalSearchParams<{ module: string }>();
  const moduleKey = String(rawModule ?? "inspections");
  const cfg = CONFIG[moduleKey];
  const moduleKeyTyped = moduleKey as SafetyModule;

  // Hooks always declared (Rules of Hooks). Skipped inside callbacks when cfg
  // is undefined (unmapped slug → friendly "open on web" fallback below).
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cfg) { setLoading(false); return; }
    setError(null);
    try { const r = await SafetyApi.list(moduleKeyTyped); setRows(Array.isArray(r) ? r : []); }
    catch (e: any) { setError(e?.detail ?? `Could not load ${cfg.title}.`); }
    finally { setLoading(false); setRefreshing(false); }
  }, [moduleKeyTyped, cfg]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  // ---- unmapped slug: friendly fallback ----
  if (!cfg) {
    const pretty = moduleKey.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <SafeAreaView style={fallbackStyles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={fallbackStyles.content}>
          <TouchableOpacity onPress={() => router.back()} style={fallbackStyles.back}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <ScreenHeader eyebrow="Safety" title={pretty} subtitle={`Manage your ${pretty.toLowerCase()} on SafeBase web.`} accent={accent} />
          <Card>
            <Eyebrow color={accent}>Available on web</Eyebrow>
            <Text style={fallbackStyles.body}>
              The {pretty.toLowerCase()} module isn't available on mobile yet. Tap below to manage it on SafeBase web — entries you create there appear in your mobile dashboard, reports and notifications.
            </Text>
            <PrimaryButton
              testID={`safety-${moduleKey}-open`}
              label="Open on web"
              onPress={() => Linking.openURL(`https://safe-systems.preview.emergentagent.com/dashboard/safety/${moduleKey}`).catch(() => {})}
              accent={accent}
              iconName="open-outline"
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const save = async () => {
    setFe(null);
    for (const f of cfg.fields) if (f.required && !(form[f.key] ?? "").trim()) { setFe(`${f.label} is required.`); return; }
    setBusy(true);
    try { await SafetyApi.create(moduleKeyTyped, form); setForm({}); setOpen(false); load(); }
    catch (e: any) { setFe(e?.detail ?? "Could not save."); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await SafetyApi.remove(moduleKeyTyped, id); load(); }
    catch (e: any) { Alert.alert("Delete failed", e?.detail ?? ""); }
  };

  return (
    <IndustryListShell
      eyebrow={cfg.eyebrow} title={cfg.title} subtitle={cfg.subtitle}
      toggleLabel={`Add ${cfg.title.toLowerCase()} entry`} formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: cfg.icon, title: `No ${cfg.title.toLowerCase()}`, body: "Add an entry to start building this register." }}
      rowCount={rows.length} rowsEyebrow="Register" testIDPrefix={moduleKey}
      formBody={
        <View>
          {cfg.fields.map(f => (
            <Input
              key={f.key}
              testID={`${moduleKey}-${f.key}`}
              label={`${f.label}${f.required ? " (required)" : ""}`}
              value={form[f.key] ?? ""}
              onChangeText={(v) => setForm(prev => ({ ...prev, [f.key]: v }))}
              accent={accent}
              placeholder={f.placeholder}
              multiline={f.multiline}
              style={f.multiline ? { minHeight: 60, textAlignVertical: "top" } : undefined}
            />
          ))}
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID={`${moduleKey}-submit`} label="Save entry" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r: any) => {
        const id = r.item_id ?? r.id ?? r._id ?? "";
        const primary = cfg.fields[0]?.key;
        return (
          <View key={id} testID={`${moduleKey}-row-${id}`} style={shellStyles.row}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{primary && r[primary] ? r[primary] : id}</Text>
                {cfg.fields.slice(1).filter(f => r[f.key]).slice(0, 3).map(f => (
                  <Text key={f.key} style={shellStyles.rowSub} numberOfLines={2}>{f.label}: {String(r[f.key])}</Text>
                ))}
                {r.created_at ? <Text style={[shellStyles.rowSub, { fontFamily: MONO }]}>{new Date(r.created_at).toLocaleString("en-AU")}</Text> : null}
              </View>
              {id ? (
                <TouchableOpacity onPress={() => Alert.alert("Delete", "Delete this entry?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => remove(id) }])}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      })}
    />
  );
}

const fallbackStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  body: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginVertical: 12 },
});
