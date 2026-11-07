"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getMe, type User } from "@/lib/api";
import { getDemoUser } from "@/lib/demo-trip-data";
import {
  addTestNotification,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notification-store";
import { notifyNotificationsChanged, useNotifications } from "@/lib/use-notifications";
import { HomeBottomNav, MaewTopbar } from "@/components/trip-ticket-selector";

function NotificationIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

async function showDeviceNotification(item: AppNotification): Promise<"shown" | "denied" | "unavailable"> {
  if (!window.isSecureContext || !("Notification" in window)) return "unavailable";
  try {
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/notification-sw.js");
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(item.title, {
        body: item.message,
        icon: "/images/figma-gogun-mark.svg",
        tag: item.id,
        data: { url: window.location.pathname },
      });
    } else {
      new Notification(item.title, { body: item.message, icon: "/images/figma-gogun-mark.svg" });
    }
    return "shown";
  } catch {
    return "unavailable";
  }
}

export function NotificationsView({ demoMode = false }: { demoMode?: boolean }) {
  const [user, setUser] = useState<User | null>(() => demoMode ? getDemoUser() : null);
  const [testStatus, setTestStatus] = useState("");
  const preferenceKey = demoMode ? "gogun_notif_demo" : "gogun_notif";
  const subscribePreference = useCallback((onChange: () => void) => {
    const onStorage = (event: StorageEvent) => { if (event.key === preferenceKey) onChange(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [preferenceKey]);
  const getPreference = useCallback(() => {
    try { return localStorage.getItem(preferenceKey) !== "false"; } catch { return true; }
  }, [preferenceKey]);
  const enabled = useSyncExternalStore(subscribePreference, getPreference, () => true);
  const notifications = useNotifications(user?.id ?? null);
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const profileHref = demoMode ? "/trips/demo/profile" : "/profile";
  const backHref = demoMode ? "/trips/demo" : "/trips";

  useEffect(() => {
    if (demoMode) return;
    const controller = new AbortController();
    getMe({ signal: controller.signal }).then(setUser).catch(() => {});
    return () => controller.abort();
  }, [demoMode]);

  function markRead(id: string) {
    if (!user) return;
    try {
      markNotificationRead(localStorage, user.id, id, new Date().toISOString());
      notifyNotificationsChanged();
    } catch {
      setTestStatus("อัปเดตสถานะการอ่านไม่สำเร็จ");
    }
  }

  function markAllRead() {
    if (!user) return;
    try {
      markAllNotificationsRead(localStorage, user.id, new Date().toISOString());
      notifyNotificationsChanged();
    } catch {
      setTestStatus("อัปเดตสถานะการอ่านไม่สำเร็จ");
    }
  }

  async function sendTestNotification() {
    if (!user || !enabled) return;
    let item: AppNotification;
    try {
      item = addTestNotification(
        localStorage,
        user.id,
        typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `test-${Date.now()}`,
        new Date().toISOString(),
      );
      notifyNotificationsChanged();
      setTestStatus("เพิ่มแจ้งเตือนทดสอบในแอปแล้ว");
    } catch {
      setTestStatus("สร้างแจ้งเตือนทดสอบไม่สำเร็จ");
      return;
    }
    const deviceResult = await showDeviceNotification(item);
    if (deviceResult === "shown") setTestStatus("ส่งแจ้งเตือนทดสอบในแอปและบนอุปกรณ์แล้ว");
    if (deviceResult === "denied") setTestStatus("เพิ่มแจ้งเตือนในแอปแล้ว เบราว์เซอร์ยังไม่อนุญาตการแจ้งเตือนบนอุปกรณ์");
    if (deviceResult === "unavailable") setTestStatus("เพิ่มแจ้งเตือนในแอปแล้ว อุปกรณ์หรือการเชื่อมต่อนี้ยังไม่รองรับการแจ้งเตือนระบบ");
  }

  return (
    <main className="maew-home-scene maew-app-fixed-scene maew-notifications-scene">
      <MaewTopbar me={user} />
      <div className="maew-trip-scroll-content">
        <div className="maew-notifications-heading">
          <Link href={backHref} className="maew-notifications-back" aria-label="กลับไปหน้าทริป">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <h1>การแจ้งเตือน</h1>
          {unreadCount > 0 && <span className="maew-notifications-count">{unreadCount}</span>}
        </div>

        <section className="maew-notifications-card" aria-label="รายการแจ้งเตือน">
          <div className="maew-notifications-card-header">
            <div>
              <h2>รายการแจ้งเตือน</h2>
              <p>{unreadCount > 0 ? `ยังไม่อ่าน ${unreadCount} รายการ` : "อ่านครบแล้ว"}</p>
            </div>
            {unreadCount > 0 && <button type="button" onClick={markAllRead}>อ่านทั้งหมด</button>}
          </div>

          {notifications.length === 0 ? (
            <div className="maew-notifications-empty">
              <span className="maew-notifications-empty-icon"><NotificationIcon size={32} /></span>
              <h3>ยังไม่มีการแจ้งเตือน</h3>
              <p>เมื่อมีเรื่องใหม่เกี่ยวกับทริป จะแสดงที่นี่</p>
            </div>
          ) : (
            <ul className="maew-notifications-list">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button type="button" className={`maew-notifications-item${item.readAt ? " is-read" : ""}`} onClick={() => markRead(item.id)} aria-label={`${item.title}${item.readAt ? " อ่านแล้ว" : " ยังไม่อ่าน"}`}>
                    <span className="maew-notifications-item-icon"><NotificationIcon size={20} /></span>
                    <span className="maew-notifications-item-copy">
                      <span className="maew-notifications-item-title">{item.title}</span>
                      <span className="maew-notifications-item-message">{item.message}</span>
                      <time dateTime={item.createdAt}>{formatNotificationTime(item.createdAt)}</time>
                    </span>
                    {!item.readAt && <span className="maew-notifications-unread-dot" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="maew-notifications-test">
            <div>
              <h3>ทดสอบแจ้งเตือน</h3>
              <p>ส่งข้อความทดสอบมาที่หน้านี้และบนอุปกรณ์ที่รองรับ</p>
            </div>
            {enabled ? (
              <button type="button" onClick={() => void sendTestNotification()} disabled={!user} className="maew-notifications-test-button">ส่งแจ้งเตือนทดสอบ</button>
            ) : (
              <Link href={profileHref} className="maew-notifications-test-button">เปิดแจ้งเตือนที่โปรไฟล์</Link>
            )}
            {testStatus && <p className="maew-notifications-status" role="status">{testStatus}</p>}
          </div>
        </section>
      </div>
      <HomeBottomNav />
    </main>
  );
}
