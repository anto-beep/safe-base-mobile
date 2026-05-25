import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Eyebrow } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS, INDUSTRY_ACCENT, INDUSTRY_LABEL, Industry } from "@/src/theme/colors";

// Compact industry switcher shown in the home header for accounts with
// more than one industry. Tap → opens a sheet → PATCH /auth/me/industry.
export function IndustrySwitcher({ testID = "industry-switcher" }: { testID?: string }) {
  const { user, setActiveIndustry } = useAuth();
  const [open, setOpen] = useState(false);

  const industries: Industry[] =
    Array.isArray(user?.industries) && user!.industries!.length
      ? (user!.industries as Industry[])
      : (user?.industry ? [user.industry as Industry] : []);

  if (industries.length <= 1) return null;

  const active = (user?.industry as Industry | undefined) ?? industries[0];
  const accent = accentFor(active);

  return (
    <>
      <TouchableOpacity
        testID={testID}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        style={[styles.pill, { borderColor: accent }]}
      >
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.pillLabel} numberOfLines={1}>
          {INDUSTRY_LABEL[active].split(" ")[0]}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet} testID="industry-switcher-sheet">
          <View style={styles.header}>
            <Eyebrow color={accent}>Switch industry</Eyebrow>
            <TouchableOpacity testID="industry-switcher-close" onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ marginTop: 12 }}>
            {industries.map((i) => {
              const a = INDUSTRY_ACCENT[i];
              const isActive = i === active;
              return (
                <TouchableOpacity
                  key={i}
                  testID={`industry-switcher-${i}`}
                  onPress={async () => {
                    await setActiveIndustry(i);
                    setOpen(false);
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.row,
                    { borderColor: isActive ? a : COLORS.border, backgroundColor: isActive ? `${a}1A` : "transparent" },
                  ]}
                >
                  <View style={[styles.rowDot, { backgroundColor: a }]} />
                  <Text style={[styles.rowLabel, { color: isActive ? COLORS.textPrimary : COLORS.textSecondary }]}>
                    {INDUSTRY_LABEL[i]}
                  </Text>
                  {isActive ? <Ionicons name="checkmark" size={18} color={a} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 160,
  },
  dot: { width: 8, height: 8, marginRight: 8 },
  pillLabel: { color: COLORS.textPrimary, fontSize: 12, fontWeight: "700", marginRight: 6 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 20,
    maxHeight: "70%",
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 8 },
  rowDot: { width: 10, height: 10, marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
});
