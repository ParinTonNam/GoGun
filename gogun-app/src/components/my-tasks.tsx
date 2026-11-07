"use client";
import Link from "next/link";
import { useState } from "react";
import { getMyTasks, type MyTask } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
export function MyTasks({ tripId }: { tripId?: string }) {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const { loading, error, retry } = useLoad(async () => setTasks(await getMyTasks()), []);
  const shown = tripId ? tasks.filter(t => t.trip_id === tripId && t.kind === "packing") : tasks;
  return <section className={`workspace-card ${tripId ? "clay-mint" : "clay-lavender"}`}>
    <div className="workspace-page-heading"><h2>{tripId ? "ของที่ฉันรับผิดชอบ" : "งานของฉัน · ทุกทริป"}</h2>{!loading && !error && <span className="clay-badge">{shown.length} งานค้าง</span>}</div>
    {loading ? <p role="status">กำลังรวบรวมงาน…</p> : error ? <div role="alert">{error}<button className="workspace-button" onClick={retry}>ลองใหม่</button></div> : !shown.length ? <p>เรียบร้อยแล้ว ไม่มีงานค้าง{tripId ? "ที่รับไว้" : "ในทริปที่กำลังดำเนินอยู่"} ✓</p> : <ul className="workspace-list">{shown.map((t, i) => <li key={`${t.trip_id}-${i}`}><Link href={`/trips/${t.trip_id}/${t.path}`}><span className="clay-badge">{t.kind === "availability" ? "ตอบวัน" : t.kind === "poll" ? "โหวต" : t.kind === "quest" ? "เควส" : "จัดกระเป๋า"}</span> {t.title}<small className="block mt-1">{t.trip_name} →</small></Link></li>)}</ul>}
  </section>;
}
