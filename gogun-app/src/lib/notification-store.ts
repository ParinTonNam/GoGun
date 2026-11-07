export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  kind: "test";
};

export type NotificationStorage = Pick<Storage, "getItem" | "setItem">;

export const NOTIFICATIONS_CHANGED_EVENT = "maew-notifications-changed";

export function notificationStorageKey(userId: string): string {
  return `maew_notifications_${userId}`;
}

export function parseNotifications(raw: string | null): AppNotification[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is AppNotification =>
      item !== null &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.message === "string" &&
      typeof item.createdAt === "string" &&
      (item.readAt === null || typeof item.readAt === "string") &&
      item.kind === "test"
    );
  } catch {
    return [];
  }
}

export function readNotifications(storage: NotificationStorage, userId: string): AppNotification[] {
  return parseNotifications(storage.getItem(notificationStorageKey(userId)));
}

export function addTestNotification(
  storage: NotificationStorage,
  userId: string,
  id: string,
  now: string,
): AppNotification {
  const item: AppNotification = {
    id,
    title: "แจ้งเตือนทดสอบ",
    message: "ระบบแจ้งเตือนของแมวเที่ยวพร้อมใช้งานแล้ว 🐱",
    createdAt: now,
    readAt: null,
    kind: "test",
  };
  storage.setItem(notificationStorageKey(userId), JSON.stringify([item, ...readNotifications(storage, userId)].slice(0, 50)));
  return item;
}

export function markNotificationRead(storage: NotificationStorage, userId: string, id: string, now: string): void {
  const items = readNotifications(storage, userId).map((item) =>
    item.id === id && !item.readAt ? { ...item, readAt: now } : item
  );
  storage.setItem(notificationStorageKey(userId), JSON.stringify(items));
}

export function markAllNotificationsRead(storage: NotificationStorage, userId: string, now: string): void {
  const items = readNotifications(storage, userId).map((item) =>
    item.readAt ? item : { ...item, readAt: now }
  );
  storage.setItem(notificationStorageKey(userId), JSON.stringify(items));
}
