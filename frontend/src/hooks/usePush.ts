// Expo push registration — call once the user is authenticated.
// 1. Requests notification permission (contextually, after the user has signed in).
// 2. Fetches the Expo push token.
// 3. Registers it with the SafeBase backend at POST /api/device-tokens/register.
// 4. Soft-deactivates the token on logout via DELETE /api/device-tokens/{token_id}.

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { api } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

const TOKEN_ID_KEY = "safebase.push.token_id";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

async function ensurePermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;
  if (!existing.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.status === "granted";
}

async function getExpoToken(): Promise<string | null> {
  try {
    // For Expo Go / managed builds, the basic token works without projectId.
    // For production EAS builds, projectId from app config is required.
    const t = await Notifications.getExpoPushTokenAsync().catch(() => null as any);
    return t?.data ?? null;
  } catch {
    return null;
  }
}

export function usePushRegistration(isAuthenticated: boolean) {
  const didRun = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || didRun.current) return;
    didRun.current = true;
    (async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "SafeBase",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FFCC00",
          });
        }
        const granted = await ensurePermission();
        if (!granted) return;
        const token = await getExpoToken();
        if (!token) return;
        const resp = await api.post<{ ok: boolean; token_id: string }>(
          "/device-tokens/register",
          { token, platform: Platform.OS },
        );
        if (resp?.token_id) {
          await storage.setItem(TOKEN_ID_KEY, resp.token_id);
        }
      } catch {
        // Push registration is best-effort — never block the user.
      }
    })();
  }, [isAuthenticated]);
}

export async function deregisterPush(): Promise<void> {
  const id = await storage.getItem<string>(TOKEN_ID_KEY, "");
  if (!id) return;
  try {
    await api.del(`/device-tokens/${id}`);
  } catch {
    // ignore
  }
  await storage.removeItem(TOKEN_ID_KEY);
}
