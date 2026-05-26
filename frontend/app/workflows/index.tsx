// Workflows hub — lists every workflow type from /api/workflows/catalog and
// shows the user's active instances per type with their step progress.
// Verified types (from /tmp/safebase-src/backend/server.py:1342): new_employee,
// incident_resolution, swms_job_start, annual_review, subcontractor.

import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { WorkflowInstance, WorkflowStepper } from "@/src/components/WorkflowStepper";
import { Card, EmptyState, Eyebrow } from "@/src/components/ui";
import { useAccent, TOKENS } from "@/src/theme/colors";

interface CatalogEntry {
  type: string;
  steps: { key: string; label: string }[];
}

interface SummaryEntry {
  total: number;
  not_started: number;
  in_progress: number;
  complete: number;
}

const TYPE_LABEL: Record<string, string> = {
  new_employee: "New employee onboarding",
  incident_resolution: "Incident resolution",
  swms_job_start: "SWMS job start",
  annual_review: "Annual review",
  subcontractor: "Subcontractor onboarding",
};

export default function Workflows() {
  const accent = useAccent();
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [summary, setSummary] = useState<Record<string, SummaryEntry>>({});
  const [active, setActive] = useState<string | null>(null);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(true);

  const loadCatalog = useCallback(async () => {
    try {
      const [cat, sum] = await Promise.allSettled([
        api.get<CatalogEntry[]>("/workflows/catalog"),
        api.get<Record<string, SummaryEntry>>("/workflows/summary"),
      ]);
      if (cat.status === "fulfilled") {
        setCatalog(cat.value);
        if (!active && cat.value.length) setActive(cat.value[0].type);
      }
      if (sum.status === "fulfilled") setSummary(sum.value);
    } finally {
      setBusy(false);
    }
  }, [active]);

  const loadInstances = useCallback(async (wtype: string) => {
    setLoadingList(true);
    try {
      const rows = await api.get<WorkflowInstance[]>(`/workflows/${wtype}`);
      setInstances(Array.isArray(rows) ? rows : []);
    } catch {
      setInstances([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadCatalog(); }, [loadCatalog]));

  useFocusEffect(useCallback(() => {
    if (active) loadInstances(active);
  }, [active, loadInstances]));

  const createInstance = async () => {
    if (!active) return;
    try {
      const created = await api.post<WorkflowInstance>(`/workflows/${active}`, {
        title: `${TYPE_LABEL[active] ?? active} ${new Date().toLocaleDateString()}`,
      });
      setInstances((prev) => [created, ...prev]);
      loadCatalog(); // refresh summary
    } catch {
      // ignore
    }
  };

  if (busy) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={accent} /></View>
      </SafeAreaView>
    );
  }

  const sum = active ? summary[active] : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadCatalog();
              if (active) await loadInstances(active);
              setRefreshing(false);
            }}
            tintColor={accent}
          />
        }
      >
        <TouchableOpacity testID="workflows-back" style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#525252" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Eyebrow color={accent}>Workflows</Eyebrow>
        <Text style={styles.title}>Multi-step process tracking.</Text>
        <Text style={styles.subtitle}>Step labels come from the SafeBase backend catalog — same as the web app, never hardcoded on the client.</Text>

        <View style={{ height: 18 }} />

        {/* Type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {catalog.map((c) => {
            const isActive = c.type === active;
            const s = summary[c.type];
            return (
              <TouchableOpacity
                key={c.type}
                testID={`wf-type-${c.type}`}
                activeOpacity={0.85}
                onPress={() => setActive(c.type)}
                style={[
                  styles.tab,
                  { borderColor: isActive ? accent : TOKENS.border, backgroundColor: isActive ? `${accent}1A` : TOKENS.background },
                ]}
              >
                <Text style={[styles.tabLabel, { color: isActive ? TOKENS.ink : "#525252" }]}>
                  {TYPE_LABEL[c.type] ?? c.type}
                </Text>
                {s ? <Text style={styles.tabCount}>{s.total} · {s.in_progress} active · {s.complete} done</Text> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {active && sum ? (
          <Card>
            <Eyebrow color={accent}>{TYPE_LABEL[active] ?? active}</Eyebrow>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCell}><Text style={styles.kpiNum}>{sum.total}</Text><Text style={styles.kpiLabel}>Total</Text></View>
              <View style={styles.kpiCell}><Text style={styles.kpiNum}>{sum.not_started}</Text><Text style={styles.kpiLabel}>Not started</Text></View>
              <View style={styles.kpiCell}><Text style={styles.kpiNum}>{sum.in_progress}</Text><Text style={styles.kpiLabel}>In progress</Text></View>
              <View style={styles.kpiCell}><Text style={[styles.kpiNum, { color: TOKENS.success }]}>{sum.complete}</Text><Text style={styles.kpiLabel}>Complete</Text></View>
            </View>
            <TouchableOpacity testID="wf-new" style={[styles.createBtn, { backgroundColor: TOKENS.ink }]} onPress={createInstance} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color={TOKENS.warning} />
              <Text style={styles.createText}>NEW {(TYPE_LABEL[active] ?? active).toUpperCase()}</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {loadingList ? (
          <ActivityIndicator color={accent} style={{ marginTop: 18 }} />
        ) : instances.length === 0 ? (
          <EmptyState
            icon="git-network-outline"
            title="No instances yet"
            body="Tap NEW above to start tracking the first one. Step labels are pulled from the backend catalog."
          />
        ) : (
          instances.map((inst) => (
            <WorkflowStepper
              key={inst.instance_id}
              instance={inst}
              accent={accent}
              onUpdate={(next) => {
                setInstances((prev) => prev.map((p) => (p.instance_id === next.instance_id ? next : p)));
              }}
            />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: "#525252", fontSize: 14 },
  title: { color: TOKENS.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  subtitle: { color: "#525252", fontSize: 14, lineHeight: 20, marginTop: 6 },
  tabsRow: { marginBottom: 12, flexGrow: 0 },
  tab: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, minWidth: 180 },
  tabLabel: { fontSize: 13, fontWeight: "700" },
  tabCount: { fontSize: 11, color: "#737373", marginTop: 4, fontFamily: "monospace" },
  kpiRow: { flexDirection: "row", marginTop: 8 },
  kpiCell: { flex: 1, alignItems: "center" },
  kpiNum: { color: TOKENS.ink, fontSize: 22, fontWeight: "800", fontFamily: "monospace" },
  kpiLabel: { color: "#737373", fontSize: 10, marginTop: 2, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, marginTop: 14 },
  createText: { color: TOKENS.warning, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginLeft: 6 },
});
