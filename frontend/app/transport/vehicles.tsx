// Transport — Fleet vehicle register. Backend GET/POST /api/transport/vehicles.
// Highlights upcoming service / rego expiry.

import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { FleetVehicle, TransportApi } from "@/src/api/industry";
import { ChipGroup } from "@/src/components/ChipGroup";
import { IndustryListShell, shellStyles } from "@/src/components/IndustryListShell";
import { Input, MONO, Pill, PrimaryButton } from "@/src/components/ui";
import { TOKENS, useAccent } from "@/src/theme/colors";

const CLASSES = [
  { value: "LR", label: "LR" }, { value: "MR", label: "MR" }, { value: "HR", label: "HR" },
  { value: "HC", label: "HC" }, { value: "MC", label: "MC" }, { value: "B-Double", label: "B-Double" },
];

function expiryStatus(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "REGO EXPIRED", color: TOKENS.destructive };
  if (days <= 30) return { label: `${days}D LEFT`, color: TOKENS.warnInk };
  return null;
}

export default function VehiclesScreen() {
  const accent = useAccent();
  const [rows, setRows] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [rego, setRego] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vclass, setVclass] = useState("HR");
  const [gvm, setGvm] = useState("");
  const [gcm, setGcm] = useState("");
  const [lastSvc, setLastSvc] = useState("");
  const [nextSvc, setNextSvc] = useState("");
  const [regoExp, setRegoExp] = useState("");
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await TransportApi.listVehicles(); setRows(r.rows ?? []); }
    catch (e: any) { setError(e?.detail ?? "Could not load fleet."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    setFe(null);
    if (!rego.trim()) { setFe("Rego is required."); return; }
    setBusy(true);
    try {
      await TransportApi.createVehicle({
        rego: rego.trim().toUpperCase(), make: make.trim() || undefined, model: model.trim() || undefined,
        vehicle_class: vclass,
        gvm_kg: gvm ? Number(gvm) : undefined, combo_gcm_kg: gcm ? Number(gcm) : undefined,
        last_service_at: lastSvc || undefined, next_service_due: nextSvc || undefined,
        rego_expires_at: regoExp || undefined,
      });
      setRego(""); setMake(""); setModel(""); setGvm(""); setGcm(""); setLastSvc(""); setNextSvc(""); setRegoExp(""); setOpen(false); load();
    } catch (e: any) { setFe(e?.detail ?? "Could not save vehicle."); }
    finally { setBusy(false); }
  };

  return (
    <IndustryListShell
      eyebrow="Transport" title="Fleet vehicles"
      subtitle="NHVAS / NHVR-compliant fleet register. GVM, GCM, rego expiry and service interval per vehicle."
      toggleLabel="Add vehicle" formOpen={open} onToggleForm={() => setOpen(o => !o)}
      loading={loading} error={error} refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      empty={{ icon: "car-outline", title: "No vehicles yet", body: "Add at least one vehicle so pre-trips, fatigue and mass declarations can reference rego." }}
      rowCount={rows.length}
      rowsEyebrow="Fleet"
      testIDPrefix="veh"
      formBody={
        <View>
          <Input testID="veh-rego" label="Rego (required)" value={rego} onChangeText={setRego} accent={accent} autoCapitalize="characters" />
          <Input testID="veh-make" label="Make" value={make} onChangeText={setMake} accent={accent} />
          <Input testID="veh-model" label="Model" value={model} onChangeText={setModel} accent={accent} />
          <ChipGroup label="Class" accent={accent} values={[vclass]} onChange={(v) => setVclass(v[0] ?? "HR")} options={CLASSES} singleSelect />
          <Input testID="veh-gvm" label="GVM (kg)" value={gvm} onChangeText={setGvm} accent={accent} keyboardType="numeric" />
          <Input testID="veh-gcm" label="Combo GCM (kg)" value={gcm} onChangeText={setGcm} accent={accent} keyboardType="numeric" />
          <Input testID="veh-lastsvc" label="Last service (YYYY-MM-DD)" value={lastSvc} onChangeText={setLastSvc} accent={accent} />
          <Input testID="veh-nextsvc" label="Next service due (YYYY-MM-DD)" value={nextSvc} onChangeText={setNextSvc} accent={accent} />
          <Input testID="veh-regoexp" label="Rego expires (YYYY-MM-DD)" value={regoExp} onChangeText={setRegoExp} accent={accent} />
          {fe ? <Text style={{ color: TOKENS.destructive, marginBottom: 8 }}>{fe}</Text> : null}
          <PrimaryButton testID="veh-submit" label="Save vehicle" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
        </View>
      }
      rows={rows.map((r) => {
        const status = expiryStatus(r.rego_expires_at);
        return (
          <View key={r.vehicle_id} testID={`veh-row-${r.vehicle_id}`} style={shellStyles.row}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={shellStyles.rowTitle}>{r.rego}</Text>
                <Text style={[shellStyles.rowMeta, { fontFamily: MONO }]}>{[r.make, r.model, r.vehicle_class].filter(Boolean).join(" · ")}</Text>
                <Text style={shellStyles.rowSub}>{r.gvm_kg ? `GVM ${r.gvm_kg}kg` : ""}{r.combo_gcm_kg ? ` · GCM ${r.combo_gcm_kg}kg` : ""}</Text>
                {r.next_service_due ? <Text style={shellStyles.rowSub}>Next service {new Date(r.next_service_due).toLocaleDateString("en-AU")}</Text> : null}
                {r.rego_expires_at ? <Text style={shellStyles.rowSub}>Rego {new Date(r.rego_expires_at).toLocaleDateString("en-AU")}</Text> : null}
              </View>
              {status ? <Pill label={status.label} color={status.color} /> : null}
            </View>
          </View>
        );
      })}
    />
  );
}
