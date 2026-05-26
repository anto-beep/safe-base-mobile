// Transport — Mass management declarations (GML/CML/HML/PBS).
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { MassDeclaration, TransportApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

const SCHEMES = [
  { value: "GML", label: "GML" }, { value: "CML", label: "CML" },
  { value: "HML", label: "HML" }, { value: "PBS", label: "PBS" },
];

export default function MassScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<MassDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [rego, setRego] = useState("");
  const [scheme, setScheme] = useState("GML");
  const [declared, setDeclared] = useState("");
  const [allowed, setAllowed] = useState("");
  const [route, setRoute] = useState("");
  const [consigner, setConsigner] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TransportApi.listMass(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load declarations."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!rego.trim() || !declared) { setFe("Vehicle rego and declared mass are required."); return; }
    setBusy(true);
    try {
      await TransportApi.createMass({
        vehicle_rego: rego.trim().toUpperCase(), declared_mass_kg: Number(declared),
        allowed_mass_kg: allowed ? Number(allowed) : undefined, scheme,
        route: route.trim() || undefined, consigner: consigner.trim() || undefined,
      });
      setRego(""); setDeclared(""); setAllowed(""); setRoute(""); setConsigner(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save declaration."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Transport" title="Mass declarations"
      subtitle="Mass management scheme declarations. Backend flags any vehicle declared above the allowed scheme mass."
      toggleLabel="New declaration" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "scale-outline", title: "No declarations", body: "Mass declarations are required under NHVAS HML / CML / PBS schemes." }}
      rowCount={rows.length}
      rowsEyebrow="Declarations"
      testIDPrefix="mass"
      formBody={
        <View>
          <Input testID="mass-rego" label="Vehicle rego (required)" value={rego} onChangeText={setRego} accent={accent} autoCapitalize="characters" />
          <ChipGroup label="Scheme" accent={accent} values={[scheme]} onChange={(v) => setScheme(v[0] ?? "GML")} options={SCHEMES} singleSelect />
          <Input testID="mass-declared" label="Declared mass (kg, required)" value={declared} onChangeText={setDeclared} accent={accent} keyboardType="numeric" />
          <Input testID="mass-allowed" label="Allowed mass (kg)" value={allowed} onChangeText={setAllowed} accent={accent} keyboardType="numeric" />
          <Input testID="mass-route" label="Route" value={route} onChangeText={setRoute} accent={accent} />
          <Input testID="mass-consigner" label="Consigner" value={consigner} onChangeText={setConsigner} accent={accent} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="mass-submit" label="Save declaration" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => (
        <View key={r.decl_id} testID={`mass-row-${r.decl_id}`} style={[shellStyles.row, r.overweight && { borderColor: TOKENS.destructive, backgroundColor: "#FEF2F2" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shellStyles.rowTitle}>{r.vehicle_rego} · {r.scheme}</Text>
              <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{r.declared_mass_kg}kg / allowed {r.allowed_mass_kg || "—"}kg</Text>
              {r.route ? <Text style={shellStyles.rowSub}>Route: {r.route}</Text> : null}
              {r.consigner ? <Text style={shellStyles.rowSub}>Consigner: {r.consigner}</Text> : null}
              <Text style={shellStyles.rowSub}>{new Date(r.created_at).toLocaleString("en-AU")}</Text>
            </View>
            <Pill label={r.overweight ? "OVERWEIGHT" : "OK"} color={r.overweight ? TOKENS.destructive : TOKENS.success} />
          </View>
        </View>
      ))}
    />
  );
}
