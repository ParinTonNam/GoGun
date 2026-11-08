"use client";
import Link from "next/link";
import { useState } from "react";
import { useTripWorkspace } from "@/components/trip-workspace";
import { removeMember, getInitial } from "@/lib/api";

export default function MembersPage() {
  const { trip, permissions, refresh } = useTripWorkspace();
  const [removing, setRemoving] = useState(""), [error, setError] = useState("");
  const members = trip.members.filter(m => m.status === "joined");
  return <main className="workspace-page"><div className="workspace-page-heading"><h1>สมาชิกทริป · {members.length} คน</h1>{permissions.canInvite && <Link className="workspace-button workspace-button-primary" href={`/trips/${trip.id}/share`}>ส่งลิงก์ชวนเพื่อน</Link>}</div>
    <section className="workspace-card clay-mint"><h2>เพื่อนเข้าร่วมและตั้งชื่อเอง</h2><p>ส่งลิงก์ให้เพื่อนเลือกล็อกอินหรือ Guest แล้วยืนยันเข้าร่วม ชื่อจะปรากฏที่นี่ทันที</p><p className="workspace-meta">Guest เลือกเข้าใช้จากลิงก์ได้ ส่วนบัญชีที่ผูกแล้วต้องล็อกอินด้วยบัญชีนั้น</p></section>
    {error && <p role="alert">{error}</p>}
    <ul className="workspace-list">{members.map(m => <li key={m.id} className="flex items-center gap-3"><span className="workspace-avatar" style={{ backgroundColor: m.user.avatar_color }}>{getInitial(m.user.display_name)}</span><div className="min-w-0 flex-1"><p className="break-words" data-user-content>{m.user.display_name}</p><p className="workspace-meta">{m.role === "organizer" ? "ผู้จัดทริป" : "เข้าร่วมแล้ว"}{m.user.is_guest !== undefined && ` · ${m.user.is_guest ? "Guest" : "บัญชีล็อกอิน"}`}</p></div>
      {permissions.isOrganizer && m.role !== "organizer" && <button className="workspace-button" disabled={!!removing} onClick={async () => { if (!window.confirm(`นำ ${m.user.display_name} ออกจากทริป?`)) return; setRemoving(m.id); setError(""); try { await removeMember(trip.id, m.user_id); refresh(); } catch(e) { setError(e instanceof Error ? e.message : "นำสมาชิกออกไม่สำเร็จ"); } finally { setRemoving(""); } }}>{removing === m.id ? "กำลังนำออก…" : "นำออก"}</button>}
    </li>)}</ul>
  </main>;
}
