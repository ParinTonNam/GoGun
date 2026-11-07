"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, getMe, getTrip, type Trip, type User } from "@/lib/api";
import { getDemoTrip, getDemoUser } from "@/lib/demo-trip-data";
import { getTripPhase, getTripSection, PHASE_LABELS, TRIP_SECTIONS, tripPath, tripPermissions } from "@/lib/trip-navigation";

type Workspace = {
  trip: Trip;
  me: User;
  permissions: ReturnType<typeof tripPermissions>;
  refresh: () => void;
};

const TripWorkspaceContext = createContext<Workspace | null>(null);

export function useOptionalTripWorkspace() {
  return useContext(TripWorkspaceContext);
}

export function useTripWorkspace() {
  const workspace = useOptionalTripWorkspace();
  if (!workspace) throw new Error("Trip page must be inside TripWorkspace");
  return workspace;
}

export function TripWorkspace({ tripId, children }: { tripId: string; children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<{ trip: Trip; me: User } | null>(() => tripId === "demo" ? { trip: getDemoTrip(), me: getDemoUser() } : null);
  const [failure, setFailure] = useState<{ message: string; denied: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const current = data?.trip.id === tripId ? data : null;


  useEffect(() => {
    if (tripId === "demo") return;
    let active = true;
    let request = 0;
    async function load() {
      const currentRequest = ++request;
      try {
        const [trip, me] = await Promise.all([getTrip(tripId), getMe()]);
        if (active && currentRequest === request) { setData({ trip, me }); setFailure(null); }
      } catch (error) {
        if (!active || currentRequest !== request) return;
        const denied = error instanceof ApiError && [401, 403, 404].includes(error.status);
        if (denied) setData(null);
        setFailure({ denied, message: denied ? "ไม่สามารถเปิดทริปนี้ได้ กรุณาตรวจสอบบัญชีหรือลิงก์เชิญ" : "เชื่อมต่อไม่สำเร็จ ลองโหลดข้อมูลทริปอีกครั้ง" });
      }
    }
    void load();
    const onFocus = () => { void load(); };
    window.addEventListener("focus", onFocus);
    return () => { active = false; window.removeEventListener("focus", onFocus); };
  }, [tripId, pathname, attempt]);

  const retry = () => {
    if (tripId === "demo") { setData({ trip: getDemoTrip(), me: getDemoUser() }); setFailure(null); return; }
    setFailure(null);
    setAttempt((value) => value + 1);
  };
  if (!current || failure?.denied) {
    return (
      <main className="maew-home-scene">
        <section className="maew-home-card" style={{ marginTop: 24 }}>
          {failure ? (
            <div className="maew-home-empty" role="alert">
              <p className="maew-home-empty-title">ไม่สามารถเปิดทริปได้</p>
              <p className="maew-home-empty-sub">{failure.message}</p>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="maew-home-retry-btn" onClick={retry}>
                  ลองใหม่
                </button>
                <Link
                  className="maew-home-retry-btn"
                  href="/trips"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  กลับหน้าทริป
                </Link>
              </div>
            </div>
          ) : (
            <div className="maew-home-empty" role="status">
              <p className="maew-home-empty-sub">กำลังเปิดทริป…</p>
            </div>
          )}
        </section>
      </main>
    );
  }

  const { trip, me } = current;
  const permissions = tripPermissions(trip, me);
  const section = getTripSection(pathname, tripId);
  const href = (path = "") => tripPath(tripId, path);
  const sectionLinks: { label: string; path: string }[] = section === "plan" ? [
    { label: "สรุปแผน", path: "/plan" }, { label: "วันของฉัน", path: "/availability" },
    { label: "วันของกลุ่ม", path: "/availability/compare" }, { label: "แผนรายวัน", path: "/itinerary" },
    { label: "เตรียมตัว", path: "/tools/checklist" }, { label: "จัดกระเป๋า", path: "/tools/packing" },
  ] : section === "expenses" ? [
    { label: "บิลและส่วนแบ่ง", path: "/expenses" },
    ...(permissions.canEditExpenses ? [{ label: "เพิ่มค่าใช้จ่าย", path: "/expenses/add" }] : []),
  ] : section === "group" ? [
    { label: "เควส", path: "/tools/quests" },
    { label: "สมาชิก", path: "/group" }, { label: "โหวต", path: "/tools/vote" },
    { label: "สุ่มตัวเลือก", path: "/tools/wheel" },
    ...(permissions.canInvite ? [{ label: "ชวนเพื่อน", path: "/share" }] : []),
    ...(permissions.isOrganizer ? [{ label: "จัดการสมาชิก", path: "/members" }] : []),
    ...(permissions.isOrganizer ? [{ label: "ตั้งค่า", path: "/settings" }] : []),
  ] : [];
  const organizerPage = [href("/settings"), href("/members")].includes(pathname);
  const blocked = (organizerPage && !permissions.isOrganizer)
    || (pathname === href("/expenses/add") && !permissions.canEditExpenses)
    || (pathname === href("/share") && !permissions.canInvite);
  const renderNav = () => TRIP_SECTIONS.map((item) => <Link
    key={item.id} href={href(item.path)} className="workspace-nav-item"
    aria-current={section === item.id ? "page" : undefined}>
    <span className="workspace-nav-icon" aria-hidden="true" style={{ WebkitMaskImage: `url(/images/${item.icon})`, maskImage: `url(/images/${item.icon})` }} />
    <span>{item.label}</span>
  </Link>);

  const isRedesignedRoute =
    pathname === href() ||
    pathname === href("/trip") ||
    pathname === href("/recommend") ||
    pathname === href("/plan") ||
    pathname === href("/availability") ||
    pathname === href("/availability/compare") ||
    pathname === href("/expenses") ||
    pathname === href("/expenses/add") ||
    pathname === href("/settings") ||
    pathname === href("/profile") ||
    pathname === href("/notifications") ||
    pathname === href("/group") ||
    pathname === href("/tools/quests") ||
    pathname === href("/tools/wheel") ||
    pathname === href("/tools/vote") ||
    pathname === href("/tools/checklist");

  return <TripWorkspaceContext.Provider value={{ trip, me, permissions, refresh: retry }}>
    {isRedesignedRoute ? (
      children
    ) : (
      <div className="trip-workspace">
        <a className="workspace-skip" href="#trip-content">ข้ามไปเนื้อหา</a>
        <aside className="workspace-sidebar" aria-label="เมนูทริป">
          <Link href="/trips" className="workspace-brand"><img src="/images/logo.svg" alt="" width={24} height={24} /> GoGun · ไปกัน</Link>
          <Link href="/trips" className="workspace-link">← ทริปของฉัน</Link>
          <div className="workspace-trip-name"><span aria-hidden="true">{trip.icon || "✈"}</span><strong>{trip.name}</strong></div>
          <nav aria-label="เมนูทริป">{renderNav()}</nav>
          {sectionLinks.length > 0 && <nav className="workspace-sidebar-subnav" aria-label="เมนูย่อยของทริป">
            {sectionLinks.map((link) => <Link key={link.path} href={href(link.path)} aria-current={pathname === href(link.path) ? "page" : undefined}>{link.label}</Link>)}
          </nav>}
          <Link href="/profile" className="workspace-profile"><span className="workspace-avatar" style={{ backgroundColor: me.avatar_color }}>{me.display_name.trim().slice(0, 1)}</span><span>{me.display_name}<small>{permissions.isOrganizer ? "คนจัดทริป" : "สมาชิก"}</small></span></Link>
        </aside>
        <div className="workspace-main">
          <header className="workspace-header">
            <div className="min-w-0"><Link href="/trips" className="workspace-mobile-back">← ทริปของฉัน</Link><p className="workspace-heading">{trip.name}</p><p className="workspace-meta">{PHASE_LABELS[getTripPhase(trip)]} · {trip.duration_days} วัน{trip.destination ? ` · ${trip.destination}` : ""}</p></div>
            <Link href="/profile" className="workspace-avatar" aria-label={`โปรไฟล์ ${me.display_name}`} style={{ backgroundColor: me.avatar_color }}>{me.display_name.trim().slice(0, 1)}</Link>
          </header>
          {sectionLinks.length > 0 && <nav className="workspace-subnav" aria-label="เมนูย่อย">{sectionLinks.map((link) => <Link key={link.path} href={href(link.path)} aria-current={pathname === href(link.path) ? "page" : undefined}>{link.label}</Link>)}</nav>}
          {failure && <div className="workspace-notice" role="alert">{failure.message} <button className="workspace-button" onClick={retry}>ลองใหม่</button></div>}
          <div id="trip-content" tabIndex={-1}>
            {blocked ? <main className="workspace-page"><h1>หน้านี้ต้องได้รับสิทธิ์จากคนจัดทริป</h1><p>คุณยังดูข้อมูลทริปและใช้เมนูอื่นได้</p><Link className="workspace-button" href={href("/group")}>กลับไปที่กลุ่ม</Link></main> : children}
          </div>
        </div>
        <nav className="workspace-bottom-nav" aria-label="เมนูหลักของทริป">{renderNav()}</nav>
      </div>
    )}
  </TripWorkspaceContext.Provider>;
}
