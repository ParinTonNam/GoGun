"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DEMO_USER } from "@/components/page-header";

type Activity = { id: string; time: string; title: string };
type Day = { id: string; label: string; activities: Activity[] };

const INITIAL_DAYS: Day[] = [
  {
    id: "d1",
    label: "ลงเครื่อง · Tokyo",
    activities: [
      { id: "a1", time: "06:30", title: "Bangkok → Narita (TG676)" },
      { id: "a2", time: "16:00", title: "Check-in โรงแรม Shinjuku" },
      { id: "a3", time: "19:00", title: "เดินเล่น Shinjuku, Omoide Yokocho" },
    ],
  },
  {
    id: "d2",
    label: "Tokyo · เก่า → ใหม่",
    activities: [
      { id: "a4", time: "09:00", title: "Asakusa, Senso-ji" },
      { id: "a5", time: "13:00", title: "TeamLab Planets" },
      { id: "a6", time: "19:00", title: "Akihabara — ดู gachapon" },
    ],
  },
  {
    id: "d3",
    label: "Tokyo → Kyoto",
    activities: [
      { id: "a7", time: "08:30", title: "Shinkansen สาย Nozomi" },
      { id: "a8", time: "12:30", title: "Check-in machiya · Gion" },
      { id: "a9", time: "17:00", title: "เดินเล่น Pontocho" },
    ],
  },
  {
    id: "d4",
    label: "Kyoto · วัด, ป่าไผ่",
    activities: [
      { id: "a10", time: "07:00", title: "Fushimi Inari (ก่อนคนเยอะ)" },
      { id: "a11", time: "11:30", title: "Arashiyama, ป่าไผ่" },
      { id: "a12", time: "18:00", title: "Kaiseki dinner — จองแล้ว" },
    ],
  },
  {
    id: "d5",
    label: "บินกลับ",
    activities: [
      { id: "a13", time: "10:30", title: "Kyoto → Kansai Airport" },
      { id: "a14", time: "15:20", title: "Osaka → Bangkok (TG623)" },
    ],
  },
];

function padDay(n: number): string {
  return String(n).padStart(2, "0");
}

export default function ItineraryPage() {
  const router = useRouter();

  const [days, setDays] = useState<Day[]>(INITIAL_DAYS);

  // per-day add-activity form
  const [addDayId, setAddDayId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState("09:00");
  const [newTitle, setNewTitle] = useState("");

  // per-day label editing
  const [editLabelId, setEditLabelId] = useState<string | null>(null);
  const [editLabelText, setEditLabelText] = useState("");

  // add new day
  const [addingDay, setAddingDay] = useState(false);
  const [newDayLabel, setNewDayLabel] = useState("");

  // ── reorder ────────────────────────────────────────────────────────────────
  function moveUp(idx: number) {
    if (idx === 0) return;
    setDays((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    if (idx === days.length - 1) return;
    setDays((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  // ── label editing ──────────────────────────────────────────────────────────
  function startEditLabel(day: Day) {
    setEditLabelId(day.id);
    setEditLabelText(day.label);
  }

  function saveLabel(dayId: string) {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, label: editLabelText.trim() || d.label } : d))
    );
    setEditLabelId(null);
  }

  // ── add activity ───────────────────────────────────────────────────────────
  function openAddActivity(dayId: string) {
    setAddDayId(dayId);
    setNewTime("09:00");
    setNewTitle("");
  }

  function saveActivity(dayId: string) {
    if (!newTitle.trim()) return;
    const act: Activity = { id: `act-${Date.now()}`, time: newTime, title: newTitle.trim() };
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              activities: [...d.activities, act].sort((a, b) =>
                a.time.localeCompare(b.time)
              ),
            }
          : d
      )
    );
    setNewTitle("");
    setNewTime("09:00");
    setAddDayId(null);
  }

  // ── add day ────────────────────────────────────────────────────────────────
  function confirmAddDay() {
    if (!newDayLabel.trim()) return;
    const newDay: Day = {
      id: `day-${Date.now()}`,
      label: newDayLabel.trim(),
      activities: [],
    };
    setDays((prev) => [...prev, newDay]);
    setNewDayLabel("");
    setAddingDay(false);
    // auto-open add activity for the new day
    setAddDayId(newDay.id);
    setNewTime("09:00");
    setNewTitle("");
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[40px] pt-[24px]">

        {/* Header */}
        <div className="px-[24px]">
          <PageHeader
            title="แก้แผนเดินทาง"
            backHref="/trips/demo"
            user={DEMO_USER}
            right={
              <button
                type="button"
                onClick={() => router.push("/trips/demo")}
                className="py-[8.5px] text-[13px] font-medium tracking-[0.08px] text-[#e85a2c]"
              >
                บันทึก
              </button>
            }
          />
        </div>

        {/* Days timeline */}
        <div className="flex flex-col pl-[44px] pr-[24px]">
          {days.map((day, idx) => (
            <div
              key={day.id}
              className="relative flex gap-[12px] border-b border-[#e5e1d7] pb-[15px] pt-[14px]"
            >
              {/* Reorder arrows — absolute left */}
              <div className="absolute left-[-34px] top-[14px] flex flex-col gap-[1px]">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className={`flex size-[16px] items-center justify-center rounded-[4px] transition-opacity ${
                    idx === 0 ? "opacity-15" : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
                    <path d="M1 5L4.5 1.5L8 5" stroke="#14110d" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === days.length - 1}
                  className={`flex size-[16px] items-center justify-center rounded-[4px] transition-opacity ${
                    idx === days.length - 1 ? "opacity-15" : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
                    <path d="M1 1L4.5 4.5L8 1" stroke="#14110d" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Day number column */}
              <div className="w-[40px] shrink-0">
                <p className="text-[9.5px] uppercase tracking-[1.71px] text-[#767168]">DAY</p>
                <p className="text-[28px] font-light leading-[28px] tracking-[-0.56px] text-[#14110d]">
                  {padDay(idx + 1)}
                </p>
              </div>

              {/* Day content */}
              <div className="flex flex-1 flex-col pb-[2px]">
                {/* Editable day label */}
                <div className="mb-[8px] flex h-[32px] items-center">
                  {editLabelId === day.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editLabelText}
                      onChange={(e) => setEditLabelText(e.target.value)}
                      onBlur={() => saveLabel(day.id)}
                      onKeyDown={(e) => e.key === "Enter" && saveLabel(day.id)}
                      className="flex-1 border-b border-[#8a8275] bg-transparent pb-[3px] text-[15px] font-medium text-[#14110d] outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditLabel(day)}
                      className="text-left text-[15px] font-medium text-[#14110d]"
                    >
                      {day.label}
                    </button>
                  )}
                </div>

                {/* Activities */}
                {day.activities.map((act) => (
                  <div key={act.id} className="flex items-center gap-[8px] py-[6px]">
                    <div className="w-[44px] shrink-0">
                      <p className="text-[11.5px] text-[#767168]">{act.time}</p>
                    </div>
                    <p className="flex-1 text-[13px] text-[#14110d]">{act.title}</p>
                  </div>
                ))}

                {/* Inline add-activity form */}
                {addDayId === day.id && (
                  <div className="flex items-center gap-[8px] py-[6px]">
                    {/* Time picker */}
                    <div className="w-[44px] shrink-0 border-b border-[#8a8275]">
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-transparent pb-[3px] pt-[2px] text-[11.5px] text-[#767168] outline-none [&::-webkit-calendar-picker-indicator]:hidden"
                      />
                    </div>
                    {/* Title input */}
                    <div className="flex flex-1 items-center gap-[6px] border-b border-[#8a8275]">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="เพิ่มกิจกรรม..."
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && saveActivity(day.id)}
                        className="flex-1 bg-transparent pb-[3px] pt-[2px] text-[13px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
                      />
                      {/* Save */}
                      <button
                        type="button"
                        onClick={() => saveActivity(day.id)}
                        disabled={!newTitle.trim()}
                        className={`shrink-0 pb-[3px] text-[12px] font-medium transition-opacity ${
                          newTitle.trim() ? "text-[#e85a2c] opacity-100" : "text-[#b5b0a4] opacity-50"
                        }`}
                      >
                        เพิ่ม
                      </button>
                      {/* Cancel */}
                      <button
                        type="button"
                        onClick={() => setAddDayId(null)}
                        className="shrink-0 pb-[3px] text-[12px] text-[#b5b0a4]"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* "เพิ่มกิจกรรม" link */}
                {addDayId !== day.id && (
                  <button
                    type="button"
                    onClick={() => openAddActivity(day.id)}
                    className="flex items-center gap-[6px] py-[4px] text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-50">
                      <path d="M7 1V13M1 7H13" stroke="#14110d" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                      เพิ่มกิจกรรม
                    </p>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add day area */}
        <div className="px-[24px] pt-[6px]">
          {addingDay ? (
            <div className="flex items-center gap-[10px] rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] py-[13px]">
              <div className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1V10M1 5.5H10" stroke="#14110d" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="หัวข้อวัน เช่น Osaka · ช้อปปิ้ง"
                value={newDayLabel}
                onChange={(e) => setNewDayLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmAddDay()}
                className="flex-1 bg-transparent text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
              />
              <button
                type="button"
                onClick={confirmAddDay}
                disabled={!newDayLabel.trim()}
                className={`shrink-0 text-[13px] font-medium transition-opacity ${
                  newDayLabel.trim() ? "text-[#e85a2c]" : "text-[#b5b0a4] opacity-50"
                }`}
              >
                เพิ่ม
              </button>
              <button
                type="button"
                onClick={() => { setAddingDay(false); setNewDayLabel(""); }}
                className="shrink-0 text-[13px] text-[#b5b0a4]"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingDay(true)}
              className="flex w-full items-center gap-[10px] rounded-[14px] border border-dashed border-[#d4cfc2] px-[16px] py-[14px] transition-colors hover:border-[#14110d]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-50">
                <path d="M7 1V13M1 7H13" stroke="#14110d" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <p className="text-[13px] font-light tracking-[0.08px] text-[#767168]">เพิ่มวัน</p>
            </button>
          )}
        </div>

      </div>
    </main>
  );
}
