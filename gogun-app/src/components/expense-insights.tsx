"use client";
import { useState } from "react";
import { type Expense, type Trip, type Settlement, updatePlanningSettings } from "@/lib/api";
import { expenseInsights } from "@/lib/trip-insights";
import { downloadShareImage } from "@/lib/share-image";
export function ExpenseInsights({ trip, expenses, settlements, userId }: { trip: Trip; expenses: Expense[]; settlements: Settlement[]; userId: string }) {
  const data = expenseInsights(expenses, trip, userId);
  const [archived, setArchived] = useState(!!trip.archived_at), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const amount = (n: number) => `${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })} ${trip.currency}`;
  return <section className="workspace-card expense-insights">
    <div className="workspace-page-heading"><h2>ภาพรวมการใช้จ่าย</h2><span className="clay-badge">{archived ? "เก็บประวัติแล้ว" : "อัปเดตจากบิลในทริป"}</span></div>
    <p className="clay-total">{amount(data.total)}</p>
    {data.mixedCurrency && <p>กราฟและงบรวมเฉพาะบิลสกุล {trip.currency} เพื่อไม่บวกเงินต่างสกุลเข้าด้วยกัน</p>}
    {!data.categories.length ? <p className="workspace-meta">เพิ่มบิลแรกเพื่อดูสัดส่วนค่าใช้จ่าย</p> : <ul className="clay-category-list">{data.categories.map(([category, value], i) => <li key={category}><div className="workspace-page-heading"><span>{category}</span><span>{amount(value)} · {data.total ? Math.round(value / data.total * 100) : 0}%</span></div><div className="clay-track"><span className={`clay-${["peach", "lavender", "mint", "ochre"][i % 4]}`} style={{ width: `${data.total ? value / data.total * 100 : 0}%` }} /></div></li>)}</ul>}
    {data.budget > 0 ? <div className={`clay-budget ${data.ratio >= .8 ? "clay-ochre" : "clay-mint"}`} role={data.ratio >= .8 ? "status" : undefined}>
      <h3>{data.ratio >= 1 ? "ส่วนแบ่งของคุณถึงงบแล้ว" : data.ratio >= .8 ? "ใกล้ถึงงบของคุณแล้ว" : "ยังอยู่ในงบ"}</h3><p>ส่วนแบ่งของฉัน {amount(data.share)} / งบ {amount(data.budget)}</p><p>{data.ratio > 1 ? `เกินงบ ${amount(data.share - data.budget)}` : `เหลืออีก ${amount(data.budget - data.share)}`} · เตือนตั้งแต่ 80%</p>
    </div> : <p className="workspace-meta">ตั้งงบต่อคนในตั้งค่าทริปเพื่อดูคำเตือนเมื่อส่วนแบ่งถึง 80%</p>}
    <div className="flex flex-wrap gap-2">
      {trip.organizer_id === userId && <button className="workspace-button" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { await updatePlanningSettings(trip.id, { archived: !archived }); setArchived(!archived); setMessage(archived ? "นำทริปกลับมาแล้ว" : "เก็บประวัติแล้ว ดาวน์โหลดสรุปเพื่อส่งให้กลุ่มได้เลย"); } catch(e) { setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ"); } finally { setBusy(false); } }}>{archived ? "นำทริปกลับมา" : "เก็บประวัติทริป"}</button>}
      <button className="workspace-button workspace-button-primary" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { await downloadShareImage(trip.name, [archived ? "สรุปท้ายทริป · เก็บประวัติแล้ว" : "สรุปค่าใช้จ่ายปัจจุบัน", `ยอดรวม ${amount(data.total)}`, ...data.categories.map(([c, n]) => `${c} · ${amount(n)}`), "", "ยอดค้างโอน (หักรายการโอนที่ยืนยันแล้ว)", ...(!settlements.length ? ["ไม่มีรายการค้างโอน"] : settlements.map(s => `${s.from_user.display_name} → ${s.to_user.display_name}  ${Number(s.amount).toLocaleString("th-TH")} ${s.currency}`))], "gogun-expenses"); setMessage("ดาวน์โหลดภาพแล้ว ส่งรูปใน LINE ได้เลย"); } catch(e) { setMessage(e instanceof Error ? e.message : "สร้างภาพไม่สำเร็จ"); } finally { setBusy(false); } }}>ดาวน์โหลดภาพสรุป</button>
    </div><p className="workspace-meta">ภาพมีชื่อผู้จ่ายและผู้รับ เหมาะสำหรับแชร์ในกลุ่มทริป</p>{message && <p role="status">{message}</p>}
  </section>;
}
