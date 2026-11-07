"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  notificationStorageKey,
  parseNotifications,
} from "@/lib/notification-store";

export function notifyNotificationsChanged(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export function useNotifications(userId: string | null) {
  const key = userId ? notificationStorageKey(userId) : null;
  const subscribe = useCallback((onChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) onChange();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    };
  }, [key]);
  const getSnapshot = useCallback(() => {
    if (!key) return "[]";
    try { return window.localStorage.getItem(key) ?? "[]"; } catch { return "[]"; }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  return useMemo(() => parseNotifications(raw), [raw]);
}
