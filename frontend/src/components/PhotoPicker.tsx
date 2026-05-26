// PhotoPicker — wraps expo-image-picker for camera + library and stores
// base64-encoded JPEG data URIs (so the same string can be POSTed to the
// backend's photos: List[str] field without a separate upload endpoint).
//
// Permissions are requested contextually on first tap (handle_permissions_contract).
// On denial we surface a friendly message + offer Linking.openSettings().

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Eyebrow } from "@/src/components/ui";
import { TOKENS } from "@/src/theme/colors";

interface Props {
  values: string[];
  onChange: (next: string[]) => void;
  accent: string;
  label?: string;
  maxPhotos?: number;
}

async function ensureCameraPermission(): Promise<"ok" | "denied" | "blocked"> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return "ok";
  if (!current.canAskAgain) return "blocked";
  const res = await ImagePicker.requestCameraPermissionsAsync();
  if (res.granted) return "ok";
  return res.canAskAgain ? "denied" : "blocked";
}

async function ensureLibraryPermission(): Promise<"ok" | "denied" | "blocked"> {
  if (Platform.OS === "web") return "ok"; // browser file picker handles its own grant.
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return "ok";
  if (!current.canAskAgain) return "blocked";
  const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (res.granted) return "ok";
  return res.canAskAgain ? "denied" : "blocked";
}

function openSettings() {
  try { Linking.openSettings(); } catch { /* noop */ }
}

export function PhotoPicker({ values, onChange, accent, label = "Photos", maxPhotos = 8 }: Props) {
  const [busy, setBusy] = useState(false);

  const handleResult = (assets?: ImagePicker.ImagePickerAsset[] | null) => {
    if (!assets || assets.length === 0) return;
    const added: string[] = [];
    for (const a of assets) {
      // Prefer base64 (we asked for it). Fall back to uri if missing.
      if (a.base64) {
        const mime = a.mimeType || "image/jpeg";
        added.push(`data:${mime};base64,${a.base64}`);
      } else if (a.uri) {
        added.push(a.uri);
      }
    }
    const next = [...values, ...added].slice(0, maxPhotos);
    onChange(next);
  };

  const launchCamera = async () => {
    if (busy || values.length >= maxPhotos) return;
    const status = await ensureCameraPermission();
    if (status === "blocked") {
      Alert.alert(
        "Camera blocked",
        "SafeBase needs camera access to attach an incident photo. Open Settings to enable it.",
        [{ text: "Cancel", style: "cancel" }, { text: "Open Settings", onPress: openSettings }],
      );
      return;
    }
    if (status === "denied") {
      Alert.alert("Camera unavailable", "Permission was not granted — you can try again or pick from your library.");
      return;
    }
    setBusy(true);
    try {
      const r = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"] as any,
        quality: 0.6,
        base64: true,
        allowsEditing: false,
      });
      if (!r.canceled) handleResult(r.assets);
    } catch (e: any) {
      Alert.alert("Couldn't open the camera", e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const launchLibrary = async () => {
    if (busy || values.length >= maxPhotos) return;
    const status = await ensureLibraryPermission();
    if (status === "blocked") {
      Alert.alert(
        "Photos blocked",
        "SafeBase needs access to your library to attach photos. Open Settings to enable it.",
        [{ text: "Cancel", style: "cancel" }, { text: "Open Settings", onPress: openSettings }],
      );
      return;
    }
    if (status === "denied") {
      Alert.alert("Library unavailable", "Permission was not granted — try again or use the camera.");
      return;
    }
    setBusy(true);
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as any,
        quality: 0.6,
        base64: true,
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, maxPhotos - values.length),
      });
      if (!r.canceled) handleResult(r.assets);
    } catch (e: any) {
      Alert.alert("Couldn't open the library", e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <View style={{ marginBottom: 16 }} testID="photo-picker">
      <Eyebrow color={accent}>{label}</Eyebrow>
      <View style={styles.actionRow}>
        <TouchableOpacity
          testID="photo-picker-camera"
          activeOpacity={0.85}
          onPress={launchCamera}
          disabled={busy || values.length >= maxPhotos}
          style={[styles.actionBtn, { borderColor: accent, opacity: values.length >= maxPhotos ? 0.4 : 1 }]}
        >
          {busy ? <ActivityIndicator color={accent} size="small" /> : <Ionicons name="camera" size={18} color={accent} />}
          <Text style={[styles.actionLabel, { color: accent }]}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="photo-picker-library"
          activeOpacity={0.85}
          onPress={launchLibrary}
          disabled={busy || values.length >= maxPhotos}
          style={[styles.actionBtn, { borderColor: TOKENS.border, opacity: values.length >= maxPhotos ? 0.4 : 1 }]}
        >
          <Ionicons name="images" size={18} color={TOKENS.ink} />
          <Text style={[styles.actionLabel, { color: TOKENS.ink }]}>Library</Text>
        </TouchableOpacity>
      </View>
      {values.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {values.map((src, i) => (
            <View key={i} style={styles.thumbWrap}>
              <Image source={{ uri: src }} style={styles.thumb} />
              <TouchableOpacity
                testID={`photo-picker-remove-${i}`}
                onPress={() => remove(i)}
                style={styles.removeBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={14} color={"#FFFFFF"} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>{`No photos yet · up to ${maxPhotos}`}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 },
  actionLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginLeft: 6, textTransform: "uppercase" },
  thumbWrap: { width: 84, height: 84, position: "relative" },
  thumb: { width: 84, height: 84, borderWidth: 1, borderColor: TOKENS.border },
  removeBtn: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(10,10,10,0.7)", alignItems: "center", justifyContent: "center" },
  empty: { color: "#737373", fontSize: 12, marginTop: 8 },
});
