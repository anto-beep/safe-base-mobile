// Generic module browser. Maps each slug to a list endpoint on the SafeBase
// backend. Renders the JSON list as a simple, scannable rows view.
// For full per-record CRUD: deep-link out to the web app (matches web parity
// without rebuilding 30+ specialised screens).

import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { EmptyState, Eyebrow, ScreenHeader } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS } from "@/src/theme/colors";

const SAFEBASE_WEB = (process.env.EXPO_PUBLIC_SAFEBASE_API ?? "").replace(/\/+$/, "");

// slug → { label, endpoint, webPath, primary, sub, tail }
// `webPath` lets us deep-link out to the web app for full CRUD.
interface ModuleSpec {
  label: string;
  endpoint: string;
  webPath: string;
  primary: (item: any) => string;
  sub: (item: any) => string;
  tail?: (item: any) => string | null;
}

const MAP: Record<string, ModuleSpec> = {
  incidents: { label: "Incidents", endpoint: "/incidents", webPath: "/dashboard/incidents",
    primary: (x) => x.title ?? x.summary ?? `Incident ${x.incident_id ?? x.id ?? ""}`,
    sub: (x) => [x.severity, x.category, x.location].filter(Boolean).join(" · "),
    tail: (x) => x.status?.toUpperCase() ?? null,
  },
  workers: { label: "Workers", endpoint: "/workers", webPath: "/dashboard/team",
    primary: (x) => x.name ?? x.full_name ?? x.email ?? "Worker",
    sub: (x) => [x.role, x.email].filter(Boolean).join(" · "),
  },
  documents: { label: "Documents", endpoint: "/documents", webPath: "/dashboard/documents",
    primary: (x) => x.title ?? x.name ?? "Document",
    sub: (x) => [x.doc_type, x.industry].filter(Boolean).join(" · "),
  },
  inductions: { label: "Inductions", endpoint: "/tradeinduct/programs", webPath: "/dashboard/inductions",
    primary: (x) => x.title ?? x.name ?? "Induction",
    sub: (x) => [x.industry, x.status].filter(Boolean).join(" · "),
  },
  safety: { label: "Safety register", endpoint: "/safety/summary", webPath: "/dashboard/safety",
    primary: (x) => x.module ?? x.label ?? "Safety",
    sub: (x) => `${x.count ?? 0} records`,
  },
  risks: { label: "Risks", endpoint: "/safety/risks", webPath: "/dashboard/safety/risks",
    primary: (x) => x.title ?? x.hazard ?? "Risk",
    sub: (x) => `Likelihood ${x.likelihood ?? "—"} · Consequence ${x.consequence ?? "—"}`,
    tail: (x) => x.rating?.toUpperCase?.() ?? null,
  },
  reports: { label: "Reports", endpoint: "/reports", webPath: "/dashboard/reports",
    primary: (x) => x.title ?? x.name ?? "Report",
    sub: (x) => x.industry ?? "",
  },
  "compliance-inbox": { label: "Compliance inbox", endpoint: "/compliance-inbox", webPath: "/dashboard/compliance-inbox",
    primary: (x) => x.title ?? "Action",
    sub: (x) => x.due_at ?? x.created_at ?? "",
    tail: (x) => x.status?.toUpperCase?.() ?? null,
  },
  automations: { label: "Automations", endpoint: "/automations", webPath: "/dashboard/automations",
    primary: (x) => x.name ?? "Automation",
    sub: (x) => [x.trigger, x.action].filter(Boolean).join(" → "),
    tail: (x) => (x.enabled ? "ON" : "OFF"),
  },
  "regulator-pipeline": { label: "Regulator pipeline", endpoint: "/regulator-pipeline/pending", webPath: "/dashboard/regulator-pipeline",
    primary: (x) => x.title ?? `Case ${x.case_id ?? ""}`,
    sub: (x) => [x.regulator, x.status].filter(Boolean).join(" · "),
  },
  "api-keys": { label: "API keys", endpoint: "/api-keys", webPath: "/dashboard/api-keys",
    primary: (x) => x.name ?? x.label ?? "Key",
    sub: (x) => x.last_used_at ? `Last used ${x.last_used_at}` : "Never used",
  },
  addons: { label: "Add-ons", endpoint: "/addons/active", webPath: "/dashboard/addons",
    primary: (x) => x.name ?? x.slug ?? "Add-on",
    sub: (x) => x.status ?? "",
  },
  "hospitality/food-safety": { label: "Food safety", endpoint: "/hospitality/haccp-ccp", webPath: "/dashboard/haccp",
    primary: (x) => x.label ?? x.ccp_name ?? "CCP",
    sub: (x) => `Last check: ${x.last_checked_at ?? "—"}`,
  },
  "hospitality/temperature": { label: "Temperature logs", endpoint: "/hospitality/temperature-logs", webPath: "/dashboard/temperature",
    primary: (x) => x.equipment ?? "Equipment",
    sub: (x) => `${x.temp_c ?? "—"}°C · ${x.created_at ?? ""}`,
    tail: (x) => x.in_range === false ? "OUT" : null,
  },
  "hospitality/allergens": { label: "Allergens", endpoint: "/hospitality/allergens", webPath: "/dashboard/allergens",
    primary: (x) => x.menu_item ?? x.name ?? "Item",
    sub: (x) => (x.allergens ?? []).join(", "),
  },
  "transport/fleet": { label: "Fleet vehicles", endpoint: "/transport/vehicles", webPath: "/dashboard/fleet",
    primary: (x) => x.rego ?? "Vehicle",
    sub: (x) => `${x.make ?? ""} ${x.model ?? ""}`.trim(),
    tail: (x) => x.rego_expiry ?? null,
  },
  "transport/fatigue": { label: "Fatigue breaches", endpoint: "/transport/fatigue-logs/breaches", webPath: "/dashboard/fatigue",
    primary: (x) => x.driver_name ?? "Driver",
    sub: (x) => `${x.scheme ?? ""} · ${x.hours ?? "—"}h`,
  },
  "transport/pretrip": { label: "Pre-trip log", endpoint: "/transport/pretrip-inspections", webPath: "/dashboard/pretrip",
    primary: (x) => x.rego ?? "Inspection",
    sub: (x) => `${x.created_at ?? ""} · ${x.odometer_km ?? "—"} km`,
  },
  "healthcare/care": { label: "Care minutes", endpoint: "/healthcare/care-minutes", webPath: "/dashboard/care",
    primary: (x) => x.resident ?? x.facility ?? "Facility",
    sub: (x) => `Target ${x.target_min ?? "—"} · Actual ${x.actual_min ?? "—"}`,
  },
  "healthcare/ahpra": { label: "AHPRA register", endpoint: "/healthcare/ahpra-register", webPath: "/dashboard/ahpra",
    primary: (x) => x.clinician_name ?? x.name ?? "Clinician",
    sub: (x) => `${x.registration_number ?? ""} · ${x.expiry_date ?? ""}`,
  },
  "healthcare/sirs": { label: "SIRS incidents", endpoint: "/healthcare/sirs-incidents", webPath: "/dashboard/sirs",
    primary: (x) => x.title ?? "Incident",
    sub: (x) => x.category ?? "",
  },
  "retail/lone-worker": { label: "Lone worker", endpoint: "/retail/lone-worker/active", webPath: "/dashboard/lone-worker",
    primary: (x) => x.worker_name ?? "Worker",
    sub: (x) => `${x.location ?? ""} · next ${x.next_checkin_at ?? "—"}`,
  },
  "retail/store-incidents": { label: "Store incidents", endpoint: "/retail/customer-incidents", webPath: "/dashboard/store-incidents",
    primary: (x) => x.title ?? "Incident",
    sub: (x) => [x.severity, x.location].filter(Boolean).join(" · "),
  },
  "trades/swms": { label: "SWMS library", endpoint: "/swms", webPath: "/dashboard/swms",
    primary: (x) => x.title ?? "SWMS",
    sub: (x) => x.site_name ?? x.industry ?? "",
  },
  "trades/tradecheck": { label: "TradeCheck", endpoint: "/tradecheck/listings", webPath: "/dashboard/tradecheck",
    primary: (x) => x.worker_name ?? "Worker",
    sub: (x) => (x.credentials ?? []).map((c: any) => c.type ?? c).join(", "),
  },
};

export default function ModulePage() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = decodeURIComponent(String(params.slug ?? ""));
  const spec = MAP[slug];
  const { user } = useAuth();
  const accent = accentFor(user?.industry);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!spec) return;
    setError(null);
    try {
      const resp = await api.get<any>(spec.endpoint);
      const list = Array.isArray(resp)
        ? resp
        : (resp?.items ?? resp?.results ?? resp?.data ?? Object.values(resp ?? {}).find((v: any) => Array.isArray(v)) ?? []);
      setData(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.detail ?? "Couldn't load this module.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [spec]);

  useEffect(() => {
    load();
  }, [load]);

  if (!spec) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState icon="help-circle-outline" title="Unknown module" body={`No mapping for "${slug}".`} />
      </SafeAreaView>
    );
  }

  const openOnWeb = () => {
    if (!SAFEBASE_WEB) return;
    Linking.openURL(`${SAFEBASE_WEB}${spec.webPath}`).catch(() => null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerPad}>
        <TouchableOpacity testID="module-back" style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Modules</Text>
        </TouchableOpacity>
        <ScreenHeader
          eyebrow="Module"
          title={spec.label}
          subtitle={data?.length ? `${data.length} record${data.length === 1 ? "" : "s"}` : "Tap any record to open on the web app."}
          accent={accent}
          right={
            <TouchableOpacity testID="module-open-web" onPress={openOnWeb} style={[styles.webBtn, { borderColor: accent }]}>
              <Ionicons name="open-outline" size={16} color={accent} />
              <Text style={[styles.webBtnText, { color: accent }]}>WEB</Text>
            </TouchableOpacity>
          }
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={accent} />
        </View>
      ) : (
        <FlatList
          testID="module-list"
          data={data ?? []}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
              tintColor={accent}
            />
          }
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title="Couldn't load" body={error} />
            ) : (
              <EmptyState icon="checkmark-circle-outline" title="Nothing here yet" body="Records you add on the web will appear here instantly." />
            )
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              testID={`module-item-${index}`}
              style={styles.row}
              activeOpacity={0.85}
              onPress={openOnWeb}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.primary} numberOfLines={1}>{spec.primary(item)}</Text>
                {spec.sub(item) ? <Text style={styles.sub} numberOfLines={2}>{spec.sub(item)}</Text> : null}
              </View>
              {spec.tail?.(item) ? (
                <View style={[styles.tail, { borderColor: accent }]}>
                  <Text style={[styles.tailText, { color: accent }]}>{spec.tail!(item)}</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  headerPad: { padding: 20, paddingBottom: 0 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  webBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center" },
  webBtnText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginLeft: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primary: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  tail: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  tailText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
});
