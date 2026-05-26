// Phase 1I · TradeCheck / VenueCheck — verified credentials marketplace.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { TradeCheckApi, TradeListing } from "@/src/api/extras";
import { Card, EmptyState, Eyebrow, MONO, Pill, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function TradeCheckScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [stats, setStats] = useState<{ verified_count: number; total: number } | null>(null);
  const [my, setMy] = useState<TradeListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [l, st, m] = await Promise.all([
        TradeCheckApi.listings(),
        TradeCheckApi.stats().catch(() => null),
        TradeCheckApi.my().catch(() => null),
      ]);
      setListings(Array.isArray(l) ? l : []); setStats(st); setMy(m);
    } catch (e: any) { setError(e?.detail ?? "Could not load TradeCheck."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Add-on" title="TradeCheck / VenueCheck" subtitle={stats ? `${stats.verified_count} of ${stats.total} businesses verified.` : "Verified credentials marketplace."} accent={accent} />
        {my ? (
          <Card>
            <Eyebrow color={accent}>Your listing</Eyebrow>
            <Text style={s.title}>{my.business_name}</Text>
            <Text style={[s.meta, { fontFamily: MONO }]}>{my.trade ?? ""}{my.state ? ` · ${my.state}` : ""}{my.rating ? ` · ★ ${my.rating}` : ""}</Text>
            <Pill label={my.verified ? "VERIFIED" : "PENDING"} color={my.verified ? TOKENS.success : TOKENS.warnInk} />
          </Card>
        ) : null}
        <Eyebrow color={accent}>Public listings</Eyebrow>
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          listings.length === 0 ? <EmptyState icon="checkmark-done-outline" title="No listings" body="Marketplace listings will appear here." /> :
          listings.map((l) => (
            <View key={l.listing_id} testID={`tc-${l.listing_id}`} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{l.business_name}</Text>
                <Text style={[s.meta, { fontFamily: MONO }]}>{l.trade ?? ""}{l.state ? ` · ${l.state}` : ""}{l.rating ? ` · ★ ${l.rating}` : ""}</Text>
              </View>
              {l.verified ? <Pill label="VERIFIED" color={TOKENS.success} /> : null}
            </View>
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
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
});
