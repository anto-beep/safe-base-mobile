// New worker form — POST /api/workers with WorkerIn shape.
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkersApi } from "@/src/api/safebase";
import { ChipGroup } from "@/src/components/ChipGroup";
import { Card, Eyebrow, Input, PrimaryButton } from "@/src/components/ui";
import { COLORS, TOKENS, useAccent } from "@/src/theme/colors";

const ROLES = [
  { value: "worker", label: "Worker" },
  { value: "supervisor", label: "Supervisor" },
  { value: "safety_manager", label: "Safety Manager" },
  { value: "admin", label: "Admin" },
] as const;

export default function NewWorker() {
  const accent = useAccent();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("worker");
  const [trade, setTrade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }
    setBusy(true);
    try {
      await WorkersApi.create({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, role, trade: trade.trim() || undefined });
      Alert.alert("Worker added", `${name.trim()} is on the register.`, [
        { text: "OK", onPress: () => router.replace("/workers") },
      ]);
    } catch (e: any) { setError(e?.detail ?? e?.message ?? "Could not save."); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="new-worker-back" style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Workers</Text>
          </TouchableOpacity>
          <Eyebrow color={accent}>People</Eyebrow>
          <Text style={styles.h1}>Add worker</Text>
          <View style={{ height: 14 }} />
          <Card>
            <Input testID="worker-name" label="Name (required)" value={name} onChangeText={setName} accent={accent} />
            <Input testID="worker-email" label="Email" value={email} onChangeText={setEmail} accent={accent} placeholder="jack@example.com" autoCapitalize="none" />
            <Input testID="worker-phone" label="Phone" value={phone} onChangeText={setPhone} accent={accent} placeholder="0400 000 000" />
            <ChipGroup label="Role" accent={accent} values={[role]} onChange={(v) => setRole((v[0] as string) ?? "worker")} options={ROLES as any} singleSelect testIDPrefix="role" />
            <Input testID="worker-trade" label="Trade" value={trade} onChangeText={setTrade} accent={accent} placeholder="e.g. electrician, plumber, general" />
          </Card>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton testID="worker-submit" label="Save worker" onPress={save} accent={accent} loading={busy} iconName="checkmark" />
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: COLORS.textSecondary, fontSize: 14, marginLeft: 4 },
  h1: { color: TOKENS.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  error: { color: TOKENS.destructive, fontSize: 13, marginVertical: 8 },
});
