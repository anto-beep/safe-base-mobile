import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { api } from "@/src/api/client";
import { Eyebrow } from "@/src/components/ui";
import { COLORS } from "@/src/theme/colors";

type Industry = "trades" | "hospitality" | "transport" | "healthcare" | "retail";

interface TileProps {
  industry: Industry;
  accent: string;
}

interface WidgetPayload {
  status?: "ok" | "warn" | "critical" | string;
  headline?: string;
  message?: string;
  items?: any[];
  [k: string]: any;
}

const ENDPOINTS: Record<Industry, string> = {
  trades: "/dashboard/widget/credential-expiry",
  hospitality: "/dashboard/widget/temp-alert",
  transport: "/dashboard/widget/fatigue-alert",
  healthcare: "/dashboard/widget/ahpra-expiry",
  retail: "/dashboard/widget/lone-worker",
};

const TILE_COPY: Record<Industry, { eyebrow: string; emptyTitle: string; emptyBody: string }> = {
  trades: {
    eyebrow: "Credential expiry",
    emptyTitle: "All credentials current",
    emptyBody: "No tickets or licences expiring in the next 60 days.",
  },
  hospitality: {
    eyebrow: "Temperature alert",
    emptyTitle: "All units in range",
    emptyBody: "No overdue logs or out-of-range readings.",
  },
  transport: {
    eyebrow: "Fatigue alert",
    emptyTitle: "No drivers near caps",
    emptyBody: "All driver-hour caps within safe limits.",
  },
  healthcare: {
    eyebrow: "AHPRA expiry",
    emptyTitle: "All clinicians registered",
    emptyBody: "No AHPRA registrations expiring in 60 days.",
  },
  retail: {
    eyebrow: "Lone worker",
    emptyTitle: "All shifts checked in",
    emptyBody: "No active shifts with missed check-ins.",
  },
};

export function IndustryAlertTile({ industry, accent }: TileProps) {
  const [data, setData] = useState<WidgetPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const resp = await api.get<WidgetPayload>(ENDPOINTS[industry]);
      setData(resp);
    } catch (e: any) {
      setError(e?.detail ?? "Unable to load alert.");
    } finally {
      setLoading(false);
    }
  }, [industry]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const items: any[] = Array.isArray(data?.items) ? (data!.items as any[]) : [];
  const copy = TILE_COPY[industry];

  const performAction = useCallback(
    async (key: string, path: string, body?: any) => {
      setActionBusy(key);
      try {
        await api.post(path, body ?? {});
        await load();
      } catch (e: any) {
        setError(e?.detail ?? "Action failed.");
      } finally {
        setActionBusy(null);
      }
    },
    [load],
  );

  if (loading) {
    return (
      <View style={[styles.tile, { borderLeftColor: accent }]} testID="industry-alert-tile-loading">
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.tile, { borderLeftColor: accent }]} testID="industry-alert-tile-error">
        <Eyebrow color={accent}>{copy.eyebrow}</Eyebrow>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={load} style={styles.retryBtn} testID="industry-alert-tile-retry">
          <Text style={[styles.retryText, { color: accent }]}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={[styles.tile, { borderLeftColor: COLORS.success }]} testID="industry-alert-tile-empty">
        <Eyebrow color={COLORS.success}>{copy.eyebrow}</Eyebrow>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.title}>{copy.emptyTitle}</Text>
            <Text style={styles.body}>{copy.emptyBody}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tile, { borderLeftColor: accent }]} testID="industry-alert-tile">
      <Eyebrow color={accent}>{copy.eyebrow}</Eyebrow>
      {data?.headline ? <Text style={styles.title}>{data.headline}</Text> : null}
      {data?.message ? <Text style={styles.body}>{data.message}</Text> : null}
      <View style={{ marginTop: 10 }}>
        {items.slice(0, 4).map((item: any, idx: number) => (
          <AlertItemRow
            key={idx}
            item={item}
            industry={industry}
            accent={accent}
            busy={actionBusy}
            onAction={performAction}
            testIdBase={`industry-alert-item-${idx}`}
          />
        ))}
      </View>
    </View>
  );
}

interface RowProps {
  item: any;
  industry: Industry;
  accent: string;
  busy: string | null;
  onAction: (key: string, path: string, body?: any) => Promise<void>;
  testIdBase: string;
}

function AlertItemRow({ item, industry, accent, busy, onAction, testIdBase }: RowProps) {
  const label =
    item.label ?? item.title ?? item.name ?? item.driver_name ?? item.clinician_name ?? item.worker_name ?? "Item";
  const sub =
    item.sub ?? item.subtitle ?? item.detail ?? item.message ?? item.licence_type ?? item.equipment ?? "";

  const action = getInlineAction(industry, item);
  const busyKey = `${testIdBase}-action`;

  return (
    <View style={styles.itemRow} testID={testIdBase}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.itemLabel} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={styles.itemSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {action ? (
        <TouchableOpacity
          testID={`${testIdBase}-btn`}
          onPress={() => onAction(busyKey, action.path, action.body)}
          disabled={busy === busyKey}
          style={[styles.inlineBtn, { borderColor: accent }]}
          activeOpacity={0.7}
        >
          {busy === busyKey ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <Text style={[styles.inlineBtnText, { color: accent }]}>{action.label}</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function getInlineAction(industry: Industry, item: any): { label: string; path: string; body?: any } | null {
  switch (industry) {
    case "transport": {
      const id = item.driver_id ?? item.id ?? item.user_id;
      if (!id) return null;
      return { label: "PAUSE", path: `/transport/drivers/${id}/pause`, body: { reason: "Approaching fatigue cap" } };
    }
    case "healthcare": {
      const id = item.clinician_id ?? item.id;
      if (!id) return null;
      return { label: "REMIND", path: `/healthcare/ahpra-register/${id}/remind` };
    }
    case "trades": {
      const id = item.licence_id ?? item.id;
      if (!id) return null;
      return { label: "REMIND", path: `/licences/${id}/remind` };
    }
    case "retail": {
      const id = item.shift_id ?? item.id;
      if (!id) return null;
      return { label: "ACK", path: `/retail/lone-worker/${id}/acknowledge` };
    }
    case "hospitality": {
      const equip = item.equipment ?? item.name;
      if (!equip) return null;
      return {
        label: "LOG",
        path: `/hospitality/temperature-logs`,
        body: { equipment: equip, temp_c: item.target_min ?? 4 },
      };
    }
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: "row", alignItems: "flex-start", marginTop: 6 },
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "600" },
  itemSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  inlineBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: "center",
  },
  inlineBtnText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  errorText: { color: COLORS.error, fontSize: 14, marginTop: 6 },
  retryBtn: { marginTop: 12, alignSelf: "flex-start", borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8 },
  retryText: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
});
