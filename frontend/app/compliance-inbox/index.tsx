// Phase 1F · Compliance Inbox — richer alerts view. /compliance-inbox.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { InboxApi, InboxItem } from "@/src/api/extras";
import { Card, EmptyState, Eyebrow, MONO, Pill, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

const TONE_COLOR: Record<string, string> = { info: COLORS.textSecondary, warning: TOKENS.warnInk, critical: TOKENS.destructive };

export default function ComplianceInboxScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [rows, setRows] = useState<InboxItem[]>([]);
  const [summary, setSummary] = useState<{ unread: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, su] = await Promise.all([InboxApi.list(), InboxApi.summary().catch(() => null)]);
      setRows(Array.isArray(r) ? r : []);
      setSummary(su as any);
    } catch (e: any) { setError(e?.detail ?? "Could not load inbox."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Alerts" title="Compliance inbox" subtitle={summary ? `${summary.unread} unread items` : "Action queue across all your modules."} accent={accent} />
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          rows.length === 0 ? <EmptyState icon="checkmark-circle-outline" title="Inbox zero" body="Nothing requires your attention right now. Good work." /> :
          rows.map((r) => (
            <TouchableOpacity key={r.id} testID={`inbox-${r.id}`} onPress={() => r.link && router.push(r.link as any)} style={s.row}>
              <View style={[s.tone, { backgroundColor: TONE_COLOR[r.tone ?? "info"] }]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.title}>{r.title}</Text>
                {r.body ? <Text style={s.body} numberOfLines={2}>{r.body}</Text> : null}
                <Text style={[s.meta, { fontFamily: MONO }]}>{r.created_at ? new Date(r.created_at).toLocaleString("en-AU") : ""}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: TOKENS.border, padding: 12, marginBottom: 10 },
  tone: { width: 4, alignSelf: "stretch" },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  body: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  meta: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
});
