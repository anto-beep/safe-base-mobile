// Phase 1I · Webhooks — subscriptions + recent deliveries.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { WebhooksApi, WebhookSub, WebhookDelivery } from "@/src/api/extras";
import { Card, EmptyState, Eyebrow, MONO, Pill, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function WebhooksScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [subs, setSubs] = useState<WebhookSub[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [su, dv] = await Promise.all([WebhooksApi.list(), WebhooksApi.deliveries().catch(() => [])]);
      setSubs(Array.isArray(su) ? su : []); setDeliveries(Array.isArray(dv) ? dv : []);
    } catch (e: any) { setError(e?.detail ?? "Could not load webhooks."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const test = async (sid: string) => {
    try { await WebhooksApi.test(sid); Alert.alert("Sent", "Test delivery dispatched."); load(); }
    catch (e: any) { Alert.alert("Failed", e?.detail ?? ""); }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Add-on" title="Webhooks" subtitle="Outbound event hooks. Create on web; test deliveries from mobile." accent={accent} />
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          (
          <>
            <Eyebrow color={accent}>Subscriptions</Eyebrow>
            {subs.length === 0 ? <EmptyState icon="share-social-outline" title="No subscriptions" body="Add webhook subscriptions on the SafeBase web app." /> :
              subs.map((sb) => (
                <Card key={sb.sid} testID={`wh-${sb.sid}`}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.title} numberOfLines={1}>{sb.url}</Text>
                      <Text style={[s.meta, { fontFamily: MONO }]}>{sb.events.join(", ")}</Text>
                    </View>
                    <Pill label={sb.enabled !== false ? "ON" : "OFF"} color={sb.enabled !== false ? TOKENS.success : COLORS.textMuted} />
                  </View>
                  <TouchableOpacity testID={`wh-test-${sb.sid}`} onPress={() => test(sb.sid)} style={s.btn}><Text style={[s.btnText, { color: accent }]}>FIRE TEST</Text></TouchableOpacity>
                </Card>
              ))}
            <View style={{ height: 14 }} />
            <Eyebrow color={accent}>Recent deliveries</Eyebrow>
            {deliveries.slice(0, 20).map((d) => (
              <View key={d.delivery_id} style={s.delivery}>
                <Text style={[s.meta, { fontFamily: MONO, flex: 1 }]}>{d.event} · {d.status}</Text>
                <Text style={s.meta}>{d.created_at ? new Date(d.created_at).toLocaleTimeString("en-AU") : ""}</Text>
              </View>
            ))}
          </>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  title: { color: TOKENS.ink, fontSize: 14, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  btn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, alignSelf: "flex-start" },
  btnText: { fontWeight: "800", fontSize: 12, letterSpacing: 1.2 },
  delivery: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: TOKENS.border },
});
