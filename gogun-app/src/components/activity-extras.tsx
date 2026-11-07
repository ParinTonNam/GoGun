"use client";
import { useState } from "react";
import { updateActivity, type ItineraryActivity, type ItineraryDay } from "@/lib/api";
import { ItemComments } from "./item-comments";
import { downloadShareImage } from "@/lib/share-image";
const TAGS = ["ต้องจองล่วงหน้า", "มีค่าใช้จ่ายเพิ่ม", "จุดนัดพบ"];
export function ActivityExtras({ tripId, activity, canEdit, onUpdate }: { tripId: string; activity: ItineraryActivity; canEdit: boolean; onUpdate: (tags: string[]) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <div className="w-full">
    <div className="flex flex-wrap gap-2">{(activity.tags ?? []).map(tag => <span className="clay-badge clay-peach" key={tag}>{tag}</span>)}</div>
    {canEdit && <details className="activity-tags"><summary>แก้ไขแท็กกิจกรรม</summary><div className="flex flex-wrap gap-2">{TAGS.map(tag => canEdit ? <button key={tag} type="button" className="clay-tag" aria-pressed={activity.tags?.includes(tag) ?? false} disabled={busy} onClick={async () => { const tags = activity.tags?.includes(tag) ? activity.tags.filter(t => t !== tag) : [...activity.tags ?? [], tag]; setBusy(true); setError(""); try { await updateActivity(tripId, activity.id, { tags }); onUpdate(tags); } catch(e) { setError(e instanceof Error ? e.message : "บันทึกแท็กไม่สำเร็จ"); } finally { setBusy(false); } }}>{tag}</button> : <span className="clay-badge clay-peach" key={tag}>{tag}</span>)}</div></details>}
    {error && <p role="alert">{error}</p>}<ItemComments tripId={tripId} type="activity" id={activity.id} />
  </div>;
}
export function ShareDay({ day, tripName, confirmed }: { day: ItineraryDay; tripName: string; confirmed: boolean }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  return <div><button type="button" className="day-share" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { await downloadShareImage(tripName, [`วันที่ ${day.day_number} · ${day.label}`, confirmed ? new Date(day.date).toLocaleDateString("th-TH") : "ยังไม่ยืนยันวันเดินทาง", "", ...[...day.activities].sort((a,b) => a.time.localeCompare(b.time)).flatMap(a => [`${a.time}  ${a.title}`, ...(a.tags?.length ? [a.tags.join(" · ")] : [])])], `gogun-day-${day.day_number}`); setMessage("ดาวน์โหลดภาพแล้ว พร้อมส่งให้คนมารับ–ส่ง"); } catch(e) { setMessage(e instanceof Error ? e.message : "สร้างภาพไม่สำเร็จ"); } finally { setBusy(false); } }}>แชร์แผนวันนี้เป็นภาพ</button>{message && <p role="status" className="workspace-meta">{message}</p>}</div>;
}
