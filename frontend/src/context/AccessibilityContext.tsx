import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

interface Ctx {
  prefs: AccessibilityPrefs;
  setPref: <K extends keyof AccessibilityPrefs>(k: K, v: AccessibilityPrefs[K]) => void;
  reset: () => void;
}

const C = createContext<Ctx | undefined>(undefined);

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
