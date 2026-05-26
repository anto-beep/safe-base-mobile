// Web-only shim for React Native's Alert.alert.
//
// On react-native-web, Alert.alert is a no-op which silently swallows every
// destructive/OK callback (e.g. logout, "go back after save"). We patch the
// runtime once at app start to forward to the browser's native dialogs:
//
//   • 0 / 1 buttons → window.alert + OK button onPress
//   • 2+ buttons    → window.confirm; OK invokes the non-cancel button's onPress,
//                     Cancel invokes the cancel button's onPress (if any)
//
// Pulled into a side-effect module so the import is cheap and safe to call
// from app/_layout.tsx.

import { Alert, Platform } from "react-native";

let installed = false;

type AlertButton = {
  text?: string;
  onPress?: (value?: string) => void;
  style?: "default" | "cancel" | "destructive";
};

export function installAlertWebShim() {
  if (installed) return;
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined") return;
  installed = true;

  // Preserve any original (no-op) for safety in catch blocks.
  Alert.alert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    _opts?: any,
  ) => {
    const parts = [title, message].filter(Boolean) as string[];
    const text = parts.join("\n\n");

    if (!buttons || buttons.length === 0) {
      try { window.alert(text); } catch { /* noop */ }
      return;
    }

    if (buttons.length === 1) {
      try { window.alert(text); } catch { /* noop */ }
      try { buttons[0]?.onPress?.(); } catch { /* noop */ }
      return;
    }

    // 2+ buttons → confirm. OK runs the non-cancel onPress (prefer destructive
    // / default, fall back to last non-cancel button).
    const cancelBtn = buttons.find((b) => b.style === "cancel");
    const okBtn =
      buttons.find((b) => b.style === "destructive") ??
      buttons.find((b) => b !== cancelBtn) ??
      buttons[buttons.length - 1];

    let confirmed = false;
    try { confirmed = window.confirm(text); } catch { confirmed = true; }

    try {
      if (confirmed) okBtn?.onPress?.();
      else cancelBtn?.onPress?.();
    } catch { /* noop */ }
  };
}
