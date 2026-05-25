import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

import { api } from "@/src/api/client";

interface PollState {
  unreadCount: number;
  lastFetched: number | null;
}

const POLL_MS = 60_000;

export function useNotificationPolling(enabled: boolean): PollState {
  const [state, setState] = useState<PollState>({ unreadCount: 0, lastFetched: null });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    const fetchOnce = async () => {
      try {
        const resp = await api.get<any>("/notifications");
        const list = resp?.items ?? resp?.notifications ?? resp ?? [];
        const unread = Array.isArray(list)
          ? list.filter((x: any) => x.unread || !x.read).length
          : 0;
        setState({ unreadCount: unread, lastFetched: Date.now() });
      } catch {
        // ignore — polling should never break the UI
      }
    };

    const start = () => {
      fetchOnce();
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(fetchOnce, POLL_MS);
    };
    const stop = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };

    start();
    const sub = AppState.addEventListener("change", (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        start();
      } else if (next.match(/inactive|background/)) {
        stop();
      }
      appState.current = next;
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [enabled]);

  return state;
}
