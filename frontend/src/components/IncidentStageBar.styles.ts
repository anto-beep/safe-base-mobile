// Tiny indirection so IncidentStageBar can co-locate its style tokens without
// pulling the full ui.tsx (avoids cyclical re-exports during tests).
import { Platform } from "react-native";
import { TOKENS as ThemeTokens } from "@/src/theme/colors";

export const TOKENS = ThemeTokens;
export const MONO_OK = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
