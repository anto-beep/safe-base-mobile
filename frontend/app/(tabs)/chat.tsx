import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { Eyebrow, MONO } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { accentFor, COLORS } from "@/src/theme/colors";
import { storage } from "@/src/utils/storage";

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

const SESSION_KEY = "safebase.concierge.session";

export default function Chat() {
  const { user } = useAuth();
  const accent = accentFor(user?.industry);

  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: "assistant",
      text:
        "G'day. I'm the SafeBase concierge. Ask me about your obligations, a regulator deadline or a piece of paperwork — I'll point you to what to do next.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const cached = await storage.getItem<string>(SESSION_KEY, "");
      if (cached) setSessionId(cached);
    })();
  }, []);

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const send = async () => {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    setDraft("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setBusy(true);
    scrollToEnd();
    try {
      const resp = await api.post<{ session_id?: string; reply?: string; message?: string }>(
        "/concierge/chat",
        { message: trimmed, session_id: sessionId, industry: user?.industry },
      );
      if (resp?.session_id && resp.session_id !== sessionId) {
        setSessionId(resp.session_id);
        await storage.setItem(SESSION_KEY, resp.session_id);
      }
      const reply = resp?.reply ?? resp?.message ?? "I didn't catch that — could you rephrase?";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            e?.status === 0
              ? "I can't reach SafeBase right now. Check your connection and try again."
              : `Sorry, something went wrong (${e?.detail ?? e?.message ?? "unknown"}).`,
        },
      ]);
    } finally {
      setBusy(false);
      scrollToEnd();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Eyebrow color={accent}>SafeBase concierge</Eyebrow>
        <Text style={styles.title}>Ask me anything compliance.</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <FlatList
          ref={listRef}
          testID="chat-list"
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View
              testID={`chat-bubble-${index}`}
              style={[
                styles.bubble,
                item.role === "user"
                  ? { alignSelf: "flex-end", backgroundColor: accent, borderColor: accent }
                  : { alignSelf: "flex-start", backgroundColor: COLORS.surface, borderColor: COLORS.border },
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.role === "user" ? { color: COLORS.appBg } : { color: COLORS.textPrimary },
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
          ListFooterComponent={
            busy ? (
              <View style={[styles.bubble, { alignSelf: "flex-start", backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
                <ActivityIndicator color={accent} size="small" />
              </View>
            ) : null
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            testID="chat-input"
            style={styles.input}
            placeholder="Type a question…"
            placeholderTextColor={COLORS.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!busy}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity
            testID="chat-send-button"
            style={[styles.sendBtn, { backgroundColor: accent, opacity: busy || !draft.trim() ? 0.5 : 1 }]}
            onPress={send}
            disabled={busy || !draft.trim()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up" size={22} color={COLORS.appBg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.appBg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 2 },
  list: { padding: 16 },
  bubble: {
    maxWidth: "82%",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.appBg,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 48,
    marginRight: 8,
  },
  sendBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
});
