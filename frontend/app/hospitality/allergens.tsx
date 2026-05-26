// Hospitality — Allergen Register. Backend uses upsert by item_id (menu_item).
// 14 priority allergens per FSANZ Standard 1.2.3 / PEAL.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { Allergen, HospitalityApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

const ALLERGENS = [
  { value: "peanut", label: "Peanut" }, { value: "tree_nut", label: "Tree nut" },
  { value: "egg", label: "Egg" }, { value: "milk", label: "Milk" },
  { value: "fish", label: "Fish" }, { value: "crustacean", label: "Crustacean" },
  { value: "mollusc", label: "Mollusc" }, { value: "soy", label: "Soy" },
  { value: "sesame", label: "Sesame" }, { value: "lupin", label: "Lupin" },
  { value: "wheat_gluten", label: "Wheat / gluten" }, { value: "barley_gluten", label: "Barley / gluten" },
  { value: "rye_gluten", label: "Rye / gluten" }, { value: "oats_gluten", label: "Oats / gluten" },
  { value: "sulphites", label: "Sulphites ≥10mg/kg" },
];

export default function AllergensScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [item, setItem] = useState("");
  const [contains, setContains] = useState<string[]>([]);
  const [mayContain, setMayContain] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await HospitalityApi.listAllergens(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load allergen register."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!item.trim()) { setFe("Menu item name is required."); return; }
    setBusy(true);
    try {
      await HospitalityApi.upsertAllergen({ menu_item: item.trim(), contains, may_contain: mayContain, notes: notes.trim() || undefined });
      setItem(""); setContains([]); setMayContain([]); setNotes(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save allergen entry."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Hospitality" title="Allergen register"
      subtitle="PEAL & FSANZ Std 1.2.3 — declare all 14 priority allergens contained or possibly cross-contacted."
      toggleLabel="Add / update menu item" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "alert-outline", title: "No menu items declared", body: "Declare at least the high-risk items (mains, sauces, desserts)." }}
      rowCount={rows.length}
      rowsEyebrow="Menu items"
      testIDPrefix="allergen"
      formBody={
        <View>
          <Input testID="allergen-item" label="Menu item (required)" value={item} onChangeText={setItem} accent={accent} placeholder="e.g. Pad Thai with prawn" />
          <ChipGroup label="CONTAINS" accent={accent} values={contains} onChange={setContains} options={ALLERGENS} testIDPrefix="contains" />
          <ChipGroup label="MAY CONTAIN (cross-contact)" accent={accent} values={mayContain} onChange={setMayContain} options={ALLERGENS} testIDPrefix="may" />
          <Input testID="allergen-notes" label="Notes" value={notes} onChangeText={setNotes} accent={accent} multiline style={{ minHeight: 60, textAlignVertical: "top" }} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="allergen-submit" label="Save menu item" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.item_id} testID={`allergen-row-${r.item_id}`} style={shellStyles.row}>
          <Text style={shellStyles.rowTitle}>{r.menu_item}</Text>
          {r.contains?.length ? <Text style={[shellStyles.rowMeta, { color: TOKENS.destructive }]}>CONTAINS: {r.contains.map(a => a.replace(/_/g, " ").toUpperCase()).join(", ")}</Text> : null}
          {r.may_contain?.length ? <Text style={shellStyles.rowMeta}>MAY CONTAIN: {r.may_contain.map(a => a.replace(/_/g, " ").toUpperCase()).join(", ")}</Text> : null}
          {r.updated_at ? <Text style={[shellStyles.rowSub, { fontFamily: MONO }]}>Updated {new Date(r.updated_at).toLocaleString("en-AU")}</Text> : null}
          {r.notes ? <Text style={shellStyles.rowSub}>{r.notes}</Text> : null}
        </View>
      ))}
    />
  );
}
