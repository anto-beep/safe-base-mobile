// Single-report viewer — GET /api/reports/{type}. Renders the payload
// generically: top-level number/string KVs, nested arrays as tables.
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReportsApi } from "@/src/api/safebase";
import { Card, EmptyState, Eyebrow, MONO } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

export default function ReportViewer() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const accent = useAccent();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!type) return;
    setError(null);
    try { setData(await ReportsApi.get(type)); }
    catch (e: any) { setError(e?.detail ?? "Could not load report."); }
    finally { setLoading(false); }
  }, [type]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const title = data?.title ?? type?.replace(/_/g, " ").replace(/^./, (c: string) => c.toUpperCase());

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity testID="report-back" style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Reports</Text>
        </TouchableOpacity>
        <Eyebrow color={accent}>Report</Eyebrow>
        <Text style={styles.h1}>{title}</Text>
        <View style={{ height: 14 }} />

        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 30 }} /> : error ? <Card><Text style={styles.err}>{error}</Text></Card> : !data ? (
          <EmptyState icon="document-outline" title="No report data" body="Try again or contact your admin." />
        ) : (
          <RenderReport data={data} accent={accent} />
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RenderReport({ data, accent }: { data: any; accent: string }) {
  if (Array.isArray(data)) {
    return (
      <Card>
        <Eyebrow color={accent}>{data.length} rows</Eyebrow>
        {data.slice(0, 50).map((row: any, i: number) => (
          <View key={i} style={styles.row}>
            {Object.entries(row).slice(0, 5).map(([k, v]) => (
              <View key={k} style={styles.kv}>
                <Text style={styles.kvLabel}>{k}</Text>
                <Text style={styles.kvValue} numberOfLines={2}>{String(v ?? "—")}</Text>
              </View>
            ))}
          </View>
        ))}
        {data.length > 50 ? <Text style={styles.foot}>Showing first 50 of {data.length}. Export from the web for the full list.</Text> : null}
      </Card>
    );
  }
  // Object: split into scalars (KV card) and nested arrays (separate cards).
  const entries = Object.entries(data || {});
  const scalars = entries.filter(([, v]) => v == null || typeof v !== "object");
  const arrays = entries.filter(([, v]) => Array.isArray(v));
  const objects = entries.filter(([, v]) => v && typeof v === "object" && !Array.isArray(v));
  return (
    <>
      {scalars.length > 0 ? (
        <Card>
          <Eyebrow color={accent}>Summary</Eyebrow>
          {scalars.map(([k, v]) => (
            <View key={k} style={styles.kv}>
              <Text style={styles.kvLabel}>{k}</Text>
              <Text style={styles.kvValue} numberOfLines={3}>{String(v ?? "—")}</Text>
            </View>
          ))}
        </Card>
      ) : null}
      {objects.map(([k, v]) => (
        <Card key={k}>
          <Eyebrow color={accent}>{k}</Eyebrow>
          {Object.entries(v as object).map(([kk, vv]) => (
            <View key={kk} style={styles.kv}>
              <Text style={styles.kvLabel}>{kk}</Text>
              <Text style={styles.kvValue} numberOfLines={3}>{typeof vv === "object" ? JSON.stringify(vv) : String(vv ?? "—")}</Text>
            </View>
          ))}
        </Card>
      ))}
      {arrays.map(([k, v]) => (
        <Card key={k}>
          <Eyebrow color={accent}>{k} · {(v as any[]).length} rows</Eyebrow>
          {(v as any[]).slice(0, 25).map((row: any, i: number) => (
            <View key={i} style={styles.row}>
              {typeof row === "object" && row !== null ?
                Object.entries(row).slice(0, 4).map(([rk, rv]) => (
                  <View key={rk} style={styles.kv}>
                    <Text style={styles.kvLabel}>{rk}</Text>
                    <Text style={styles.kvValue} numberOfLines={2}>{String(rv ?? "—")}</Text>
                  </View>
                ))
                : <Text style={styles.kvValue}>{String(row)}</Text>}
            </View>
          ))}
          {(v as any[]).length > 25 ? <Text style={styles.foot}>Showing first 25 of {(v as any[]).length}.</Text> : null}
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 4 },
  h1: { color: TOKENS.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  row: { borderTopWidth: 1, borderTopColor: TOKENS.border, paddingVertical: 8 },
  kv: { flexDirection: "row", paddingVertical: 4 },
  kvLabel: { color: COLORS.textMuted, fontSize: 12, width: 140, fontFamily: MONO, letterSpacing: 0.4 },
  kvValue: { flex: 1, color: TOKENS.ink, fontSize: 13, fontWeight: "500" },
  foot: { color: COLORS.textMuted, fontSize: 11, marginTop: 8, fontStyle: "italic" },
  err: { color: TOKENS.destructive, fontSize: 14, fontFamily: MONO },
});
