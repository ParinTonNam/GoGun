"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTripWorkspace } from "@/components/trip-workspace";
import { inviteUrl } from "@/lib/invite";
import { tripPath } from "@/lib/trip-navigation";

export default function SharePage() {
  const { trip } = useTripWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const url = inviteUrl(trip.invite_code);

  async function copyLink() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setMessage("คัดลอกลิงก์แล้ว ส่งให้เพื่อนในกลุ่มแชทได้เลย");
    } catch {
      input.current?.focus();
      input.current?.select();
      input.current?.setSelectionRange(0, url.length);
      setMessage("เลือกลิงก์ไว้ให้แล้ว กดคัดลอกจากเมนูของโทรศัพท์ หรือ Ctrl+C บนคอม");
    }
  }

  async function shareLink() {
    if (!navigator.share) { await copyLink(); return; }
    try {
      await navigator.share({ url, title: `ชวนเข้าทริป ${trip.name}` });
      setMessage("เปิดการแชร์ลิงก์แล้ว");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) await copyLink();
    }
  }

  return <main className="workspace-page">
    <div className="workspace-page-heading"><div><h1>ชวนเพื่อนเข้าทริป</h1><p className="workspace-meta" data-user-content>{trip.name}</p></div><Link className="workspace-link" href={tripPath(trip.id, "/group")}>กลับไปที่กลุ่ม</Link></div>
    <div className="workspace-grid">
      <section className="workspace-card">
        <h2>ส่งลิงก์ให้เพื่อน</h2><p>เพื่อนเลือกล็อกอินหรือ Guest ตั้งชื่อเอง แล้วยืนยันเข้าร่วมทริปได้ทันที</p>
        <label htmlFor="trip-invite-link">ลิงก์เชิญ</label>
        <input ref={input} id="trip-invite-link" value={url} readOnly onFocus={(event) => event.target.select()} className="min-h-[48px] w-full min-w-0 rounded-[12px] border border-[#e5e1d7] bg-white px-[12px] py-[10px]" />
        <div className="workspace-actions"><button className="workspace-button workspace-button-primary" onClick={copyLink}>คัดลอกลิงก์</button><button className="workspace-button" onClick={shareLink}>แชร์ลิงก์</button></div>
        <p role="status" className="workspace-meta">{message}</p>
      </section>
      <section className="workspace-card"><h2>ชวนแล้ว ทำอะไรต่อ</h2><p>เริ่มตอบวันของคุณ แล้วดูว่าเพื่อนว่างตรงกันช่วงไหน</p><Link className="workspace-button" href={tripPath(trip.id, "/availability")}>เลือกวันว่างของฉัน →</Link><Link className="workspace-link" href={tripPath(trip.id, "/plan")}>ไปวางแผนเที่ยว</Link></section>
    </div>
  </main>;
}
