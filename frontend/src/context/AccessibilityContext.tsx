import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform, Text, TextInput } from "react-native";

import { api } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

export interface AccessibilityPrefs {
  fontScale: number; // 1.0 default, 1.15, 1.3
  highContrast: boolean;
  reduceMotion: boolean;
  dyslexiaFont: boolean;
  emphasizeLinks: boolean;
}

const DEFAULT: AccessibilityPrefs = {
  fontScale: 1,
  highContrast: false,
  reduceMotion: false,
  dyslexiaFont: false,
  emphasizeLinks: false,
};

const KEY = "safebase.a11y";
const STYLE_TAG_ID = "safebase-a11y-style";

interface Ctx {
  prefs: AccessibilityPrefs;
  setPref: <K extends keyof AccessibilityPrefs>(k: K, v: AccessibilityPrefs[K]) => void;
  reset: () => void;
}

const C = createContext<Ctx | undefined>(undefined);

// --- Apply prefs to Text / TextInput defaults so they affect *every* string
// rendered in the app (RN-style cascade). Explicit per-component fontSize
// will still win, but inherited properties such as fontFamily and
// fontSizeMultiplier (via maxFontSizeMultiplier) are applied globally.
function applyToRNDefaults(prefs: AccessibilityPrefs) {
  const TextAny = Text as any;
  const TextInputAny = TextInput as any;
  TextAny.defaultProps = TextAny.defaultProps || {};
  TextInputAny.defaultProps = TextInputAny.defaultProps || {};

  // Force the OS-level font-scaling pipeline to honour our in-app scale by
  // emulating it through a wrapper style. Text components that don't set
  // their own fontFamily / fontSize will inherit these.
  const dyslexiaFamily =
    Platform.OS === "web"
      ? "'Comic Sans MS', 'OpenDyslexic', 'Comic Neue', sans-serif"
      : Platform.select({ ios: "Marker Felt", android: "monospace", default: undefined });

  const styleBase: any = {
    fontFamily: prefs.dyslexiaFont ? dyslexiaFamily : undefined,
  };

  TextAny.defaultProps.allowFontScaling = true;
  TextAny.defaultProps.maxFontSizeMultiplier = prefs.fontScale;
  TextAny.defaultProps.style = styleBase;

  TextInputAny.defaultProps.allowFontScaling = true;
  TextInputAny.defaultProps.maxFontSizeMultiplier = prefs.fontScale;
  TextInputAny.defaultProps.style = styleBase;
}

// --- On web, inject a stylesheet that scales font-size globally + applies
// high-contrast outlines + dyslexia font + link emphasis. This is the only
// way to affect already-rendered nodes without re-mounting them.
function applyToWebCSS(prefs: AccessibilityPrefs) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  const rules: string[] = [];

  // 1. Font scale via root font-size — affects rem-based text. RN-web emits
  //    px font-sizes so this is a partial win; we also bump every <div> /
  //    <span> baseline as a fallback.
  rules.push(`html { font-size: ${16 * prefs.fontScale}px; }`);
  rules.push(
    `[data-a11y-scaled] * { font-size: calc(1em * ${prefs.fontScale}) !important; }`,
  );

  // 2. Dyslexia font cascade.
  if (prefs.dyslexiaFont) {
    rules.push(
      `body, body * { font-family: 'Comic Sans MS','OpenDyslexic','Comic Neue', sans-serif !important; letter-spacing: 0.02em; }`,
    );
  }

  // 3. High contrast — stronger borders + black/white tone.
  if (prefs.highContrast) {
    rules.push(`body { background: #fff !important; color: #000 !important; }`);
    rules.push(
      `[role="button"], button, a, input, select, textarea { outline: 2px solid #000 !important; outline-offset: 1px; }`,
    );
    rules.push(`* { border-color: #000 !important; }`);
  }

  // 4. Emphasize links.
  if (prefs.emphasizeLinks) {
    rules.push(`a, [role="link"] { text-decoration: underline !important; font-weight: 800 !important; }`);
  }

  // 5. Reduce motion — kill transitions/animations.
  if (prefs.reduceMotion) {
    rules.push(`* { animation-duration: 0s !important; transition: none !important; }`);
  }

  tag.innerHTML = rules.join("\n");

  // Also tag the root so the [data-a11y-scaled] selector matches.
  const root = document.body;
  if (root) {
    if (prefs.fontScale !== 1) root.setAttribute("data-a11y-scaled", String(prefs.fontScale));
    else root.removeAttribute("data-a11y-scaled");
  }
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT);

  // Load cached prefs on boot.
  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(KEY, "");
      if (raw) {
        try {
          setPrefs({ ...DEFAULT, ...JSON.parse(raw) });
        } catch {
          // ignore
        }
      }
    })();
  }, []);

  // Whenever prefs change, push them into the runtime so they actually
  // affect the rendered UI.
  useEffect(() => {
    applyToRNDefaults(prefs);
    applyToWebCSS(prefs);
  }, [prefs]);

  const persist = useCallback(async (next: AccessibilityPrefs) => {
    setPrefs(next);
    await storage.setItem(KEY, JSON.stringify(next));
    // Best-effort push to backend; never block UI.
    api.post("/accessibility/preferences", next).catch(() => null);
  }, []);

  const setPref = useCallback(
    <K extends keyof AccessibilityPrefs>(k: K, v: AccessibilityPrefs[K]) => {
      persist({ ...prefs, [k]: v });
    },
    [prefs, persist],
  );

  const reset = useCallback(() => persist(DEFAULT), [persist]);

  const value = useMemo(() => ({ prefs, setPref, reset }), [prefs, setPref, reset]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useA11y(): Ctx {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useA11y must be inside AccessibilityProvider");
  return ctx;
}
