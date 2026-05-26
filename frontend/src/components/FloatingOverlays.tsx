import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Eyebrow } from "@/src/components/ui";
import { useA11y } from "@/src/context/AccessibilityContext";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, TOKENS, accentFor } from "@/src/theme/colors";

// Floating concierge chat + accessibility controls. Mounted globally.
// Visible only while a customer is signed in.
export function FloatingOverlays() {
  const { user } = useAuth();
  const [a11yOpen, setA11yOpen] = useState(false);
  const router = useRouter();
  const accent = accentFor(user?.industry);

  if (!user) return null;

  return (
    <>
      {/* Concierge chat — bottom right, ALWAYS ink bg + warning yellow text.
          The chat surface is industry-neutral by design. */}
      <TouchableOpacity
        testID="concierge-fab"
        onPress={() => router.push("/chat")}
        activeOpacity={0.85}
        style={[styles.chatFab, { backgroundColor: TOKENS.ink }]}
      >
        <Ionicons name="chatbubble-ellipses" size={22} color={TOKENS.warning} />
        <Text style={[styles.chatLabel, { color: TOKENS.warning }]}>TALK TO ME</Text>
      </TouchableOpacity>

      {/* Accessibility — bottom left, ALWAYS authority blue (never industry-themed). */}
      <TouchableOpacity
        testID="a11y-fab"
        onPress={() => setA11yOpen(true)}
        activeOpacity={0.85}
        style={[styles.a11yFab, { backgroundColor: TOKENS.authority }]}
      >
        <Ionicons name="accessibility" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <A11ySheet visible={a11yOpen} onClose={() => setA11yOpen(false)} accent={accent} />
    </>
  );
}

function A11ySheet({ visible, onClose, accent }: { visible: boolean; onClose: () => void; accent: string }) {
  const { prefs, setPref, reset } = useA11y();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet} testID="a11y-sheet">
        <View style={styles.sheetHeader}>
          <Eyebrow color={accent}>Accessibility</Eyebrow>
          <TouchableOpacity testID="a11y-close" onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sheetTitle}>Make SafeBase work for you.</Text>
        <ScrollView style={{ marginTop: 12 }}>
          <Eyebrow color={COLORS.textSecondary}>Text size</Eyebrow>
          <View style={styles.row}>
            {[1, 1.15, 1.3].map((f) => (
              <SelectChip
                key={f}
                testID={`a11y-font-${String(f).replace(".", "_")}`}
                label={f === 1 ? "Default" : f === 1.15 ? "Large" : "Larger"}
                active={prefs.fontScale === f}
                onPress={() => setPref("fontScale", f)}
                accent={accent}
              />
            ))}
          </View>

          <Toggle
            label="High contrast"
            value={prefs.highContrast}
            onChange={(v) => setPref("highContrast", v)}
            accent={accent}
            testID="a11y-hc"
          />
          <Toggle
            label="Reduce motion"
            value={prefs.reduceMotion}
            onChange={(v) => setPref("reduceMotion", v)}
            accent={accent}
            testID="a11y-motion"
          />
          <Toggle
            label="Dyslexia-friendly font"
            value={prefs.dyslexiaFont}
            onChange={(v) => setPref("dyslexiaFont", v)}
            accent={accent}
            testID="a11y-dyslexia"
          />
          <Toggle
            label="Emphasize links"
            value={prefs.emphasizeLinks}
            onChange={(v) => setPref("emphasizeLinks", v)}
            accent={accent}
            testID="a11y-links"
          />

          <TouchableOpacity testID="a11y-reset" onPress={reset} style={styles.resetBtn}>
            <Text style={styles.resetText}>RESET TO DEFAULTS</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function SelectChip({
  label,
  active,
  onPress,
  accent,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent: string;
  testID: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, { borderColor: active ? accent : COLORS.border, backgroundColor: active ? `${accent}1A` : "transparent" }]}
    >
      <Text style={[styles.chipText, { color: active ? COLORS.textPrimary : COLORS.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Toggle({
  label,
  value,
  onChange,
  accent,
  testID,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent: string;
  testID: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={() => onChange(!value)}
      activeOpacity={0.85}
      style={[styles.toggleRow, { borderColor: value ? accent : COLORS.border }]}
    >
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.switchTrack, { backgroundColor: value ? accent : COLORS.border }]}>
        <View
          style={[
            styles.switchThumb,
            { backgroundColor: COLORS.appBg, alignSelf: value ? "flex-end" : "flex-start" },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatFab: {
    position: "absolute",
    right: 16,
    bottom: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 6,
  },
  chatLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.4, marginLeft: 8 },
  a11yFab: {
    position: "absolute",
    left: 16,
    bottom: 80,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
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
    maxHeight: "78%",
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800" },
  row: { flexDirection: "row", marginBottom: 14 },
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: "700" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
  },
  toggleLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "600" },
  switchTrack: { width: 44, height: 22, padding: 2 },
  switchThumb: { width: 18, height: 18 },
  resetBtn: { padding: 14, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: COLORS.border },
  resetText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "800", letterSpacing: 1.3 },
});
