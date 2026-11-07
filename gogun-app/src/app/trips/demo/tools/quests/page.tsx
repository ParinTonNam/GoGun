"use client";

import { useEffect, useState } from "react";
import { PageHeader, DEMO_USER } from "@/components/page-header";

const KEY = "demo_quests";
const QUESTS = [
  { id: "tickets", title: "จองตั๋วรถไปพัทยา", detail: "ต้นน้ำ · ก่อน 15 พ.ย." },
  { id: "hotel", title: "ยืนยันที่พักบนเกาะล้าน", detail: "เจมส์ · ก่อน 18 พ.ย." },
  { id: "snorkel", title: "เตรียมหน้ากากดำน้ำ", detail: "นาย · วันเดินทาง" },
  { id: "sunscreen", title: "เตรียมครีมกันแดด", detail: "อาติฟ · วันเดินทาง" },
];

export default function DemoQuestsPage() {
  const [done, setDone] = useState<string[]>(["tickets", "hotel"]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
        if (Array.isArray(saved)) setDone(saved.filter((id): id is string => typeof id === "string"));
      } catch {}
    });
    return () => { active = false; };
  }, []);
  function toggle(id: string) {
    setDone((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="demo-page-content flex w-full max-w-[960px] flex-col gap-6 px-6 pb-24 pt-6">
        <PageHeader title="ภารกิจทริป" subtitle="ช่วยกันเตรียมทริปเกาะล้านให้พร้อม" backHref="/trips/demo/tools" user={DEMO_USER} />
        <p className="text-sm text-[#767168]">ทำแล้ว {done.length} จาก {QUESTS.length} ภารกิจ</p>
        <div className="flex flex-col gap-2">
          {QUESTS.map((quest) => {
            const checked = done.includes(quest.id);
            return <button key={quest.id} onClick={() => toggle(quest.id)} className="flex items-center gap-3 rounded-2xl border border-[#e5e1d7] bg-white p-4 text-left">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${checked ? "border-[#e85a2c] bg-[#e85a2c] text-white" : "border-[#b5b0a4]"}`}>{checked ? "✓" : ""}</span>
              <span className="flex flex-col"><span className={checked ? "text-sm text-[#767168] line-through" : "text-sm text-[#14110d]"}>{quest.title}</span><span className="text-xs text-[#767168]">{quest.detail}</span></span>
            </button>;
          })}
        </div>
      </div>
    </main>
  );
}
