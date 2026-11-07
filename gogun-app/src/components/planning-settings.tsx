"use client";
import { useState } from "react";
import { updatePlanningSettings, type Trip } from "@/lib/api";
import { TripReuse } from "./trip-reuse";
export function PlanningSettings({ trip, canEdit }: { trip: Trip; canEdit: boolean }) {
  const [date, setDate] = useState(trip.availability_deadline?.slice(0,10) ?? ""), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  return <section className="workspace-card clay-peach m-6"><h2>เตรียมทริปให้ง่ายขึ้น</h2>{canEdit && <form className="w-full" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await updatePlanningSettings(trip.id, { availability_deadline: date || null }); setMessage("บันทึกกำหนดตอบวันแล้ว"); } catch(e) { setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ"); } finally { setBusy(false); } }}><label className="clay-field">ให้เพื่อนตอบวันว่างภายใน<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><p className="workspace-meta">แสดงวันนับถอยหลังในหน้าทริป เว้นว่างเพื่อลบกำหนด</p><button className="workspace-button mt-2" disabled={busy}>บันทึกกำหนดตอบวัน</button></form>}{message && <p role="status">{message}</p>}<TripReuse id={trip.id} name={trip.name} /></section>;
}
