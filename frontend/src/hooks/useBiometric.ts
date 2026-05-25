import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";

import { api, clearToken, getToken, setToken } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

const BIO_ENABLED_KEY = "safebase.biometric.enabled";
const BIO_SECRET_KEY = "safebase.biometric.secret_jwt";

export interface BiometricCapability {
  available: boolean;
  enrolled: boolean;
  type: "face" | "fingerprint" | "iris" | "unknown" | "none";
}

export async function biometricCapability(): Promise<BiometricCapability> {
  const has = await LocalAuthentication.hasHardwareAsync();
  if (!has) return { available: false, enrolled: false, type: "none" };
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  let type: BiometricCapability["type"] = "unknown";
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) type = "face";
  else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) type = "fingerprint";
  else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) type = "iris";
  return { available: true, enrolled, type };
}

export async function isBiometricEnabled(): Promise<boolean> {
  const v = await storage.secureGet<string>(BIO_ENABLED_KEY, "");
  return v === "1";
}

export async function enableBiometric(): Promise<{ ok: boolean; reason?: string }> {
  const cap = await biometricCapability();
  if (!cap.available || !cap.enrolled) {
    return { ok: false, reason: "Device biometrics aren't set up." };
  }
  const auth = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirm to enable biometric sign-in",
    fallbackLabel: "Use password",
    disableDeviceFallback: false,
  });
  if (!auth.success) return { ok: false, reason: "Cancelled or failed." };
  const token = await getToken();
  if (!token) return { ok: false, reason: "Not signed in." };
  // Stash the current JWT behind the biometric-only key so we can unlock it later.
  await storage.secureSet(BIO_SECRET_KEY, token);
  await storage.secureSet(BIO_ENABLED_KEY, "1");
  return { ok: true };
}

export async function disableBiometric(): Promise<void> {
  await storage.secureRemove(BIO_ENABLED_KEY);
  await storage.secureRemove(BIO_SECRET_KEY);
}

export async function unlockWithBiometric(): Promise<{ ok: boolean; reason?: string }> {
  const enabled = await isBiometricEnabled();
  if (!enabled) return { ok: false, reason: "Biometric sign-in isn't enabled." };
  const auth = await LocalAuthentication.authenticateAsync({
    promptMessage: "Sign in with biometrics",
    fallbackLabel: "Use password",
    disableDeviceFallback: false,
  });
  if (!auth.success) return { ok: false, reason: "Biometric check failed." };
  const stashed = await storage.secureGet<string>(BIO_SECRET_KEY, "");
  if (!stashed) return { ok: false, reason: "No saved session — sign in once first." };
  await setToken(stashed);
  // Validate it still works server-side.
  try {
    await api.get("/auth/me");
    return { ok: true };
  } catch (e: any) {
    if (e?.status === 401) {
      await clearToken();
      await disableBiometric();
      return { ok: false, reason: "Saved session expired. Sign in with your password." };
    }
    // Network errors don't invalidate biometric — leave session intact.
    return { ok: true };
  }
}

export function useBiometricCapability() {
  const [cap, setCap] = useState<BiometricCapability | null>(null);
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      setCap(await biometricCapability());
      setEnabled(await isBiometricEnabled());
    })();
  }, []);

  return { cap, enabled, setEnabled };
}
