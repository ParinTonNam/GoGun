"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { copyTrip, savePersonalTemplate, getPersonalTemplates, createTripFromTemplate, deletePersonalTemplate, type PersonalTemplate } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
export function TripReuse({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [editing, setEditing] = useState(false), [title, setTitle] = useState(name);
  return <div className="clay-reuse">
    <div className="flex flex-wrap gap-2"><button disabled={busy} className="workspace-button" onClick={async () => { setBusy(true); setMessage(""); try { const t = await copyTrip(id); router.push(`/trips/${t.id}/settings`); } catch(e) { setMessage(e instanceof Error ? e.message : "คัดลอกไม่สำเร็จ"); setBusy(false); } }}>คัดลอกทริป</button><button disabled={busy} className="workspace-button" onClick={() => setEditing(!editing)}>บันทึกเป็นเทมเพลต</button></div>
    {editing && <form className="mt-3" onSubmit={async e => { e.preventDefault(); setBusy(true); setMessage(""); try { await savePersonalTemplate(id, title); setMessage("บันทึกแล้ว ดูได้ที่เทมเพลตของฉัน"); setEditing(false); window.dispatchEvent(new Event("templates-changed")); } catch(e) { setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ"); } finally { setBusy(false); } }}><label className="clay-field">ชื่อเทมเพลต<input required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} /></label><button className="workspace-button" disabled={busy || !title.trim()}>บันทึก</button></form>}
    {message && <p role="status" className="mt-2">{message}</p>}
  </div>;
}
export function PersonalTemplates() {
  const router = useRouter(); const [items, setItems] = useState<PersonalTemplate[]>([]), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const { loading, error, retry } = useLoad(async () => setItems(await getPersonalTemplates()), []);
  return <section className="workspace-card clay-peach"><div className="workspace-page-heading"><h2>เทมเพลตของฉัน</h2><button className="workspace-button" onClick={retry}>รีเฟรช</button></div><p className="workspace-meta">เก็บแผนและรายการเตรียมตัวไว้ใช้ซ้ำ เริ่มสมาชิก วันเดินทาง และค่าใช้จ่ายใหม่ทุกครั้ง</p>
    {loading ? <p role="status">กำลังโหลด…</p> : error ? <p role="alert">{error}</p> : !items.length ? <p>กด “บันทึกเป็นเทมเพลต” ใต้ทริปที่ต้องการนำกลับมาใช้</p> : <ul className="workspace-list">{items.map(t => <li key={t.id}><p data-user-content>{t.name}</p><div className="flex flex-wrap gap-2 mt-2"><button className="workspace-button workspace-button-primary" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { const trip = await createTripFromTemplate(t.id); router.push(`/trips/${trip.id}/settings`); } catch(e) { setMessage(e instanceof Error ? e.message : "สร้างทริปไม่สำเร็จ"); setBusy(false); } }}>ใช้เทมเพลต</button><button className="workspace-button" disabled={busy} onClick={async () => { if (!window.confirm(`ลบเทมเพลต ${t.name}? ทริปเดิมยังอยู่`)) return; setBusy(true); try { await deletePersonalTemplate(t.id); setItems(prev => prev.filter(i => i.id !== t.id)); } catch(e) { setMessage(e instanceof Error ? e.message : "ลบไม่สำเร็จ"); } finally { setBusy(false); } }}>ลบ</button></div></li>)}</ul>}{message && <p role="alert">{message}</p>}
  </section>;
}
