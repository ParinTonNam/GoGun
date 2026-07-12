"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTrip,
  getItinerary,
  addDay,
  updateDay,
  swapDays,
  addActivity,
  deleteActivity,
  formatShortDate,
  type Trip,
  type ItineraryDay,
} from "@/lib/api";

export default function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Add activity
  const [activeAddDayId, setActiveAddDayId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState("09:00");
  const [newTitle, setNewTitle] = useState("");
  const [savingAct, setSavingAct] = useState(false);

  // Edit day label
  const [editLabelId, setEditLabelId] = useState<string | null>(null);
  const [editLabelText, setEditLabelText] = useState("");

  // Add day
  const [addingDay, setAddingDay] = useState(false);
  const [newDayLabel, setNewDayLabel] = useState("");
  const [savingDay, setSavingDay] = useState(false);

  useEffect(() => {
    Promise.all([getTrip(tripId), getItinerary(tripId)])
      .then(([t, d]) => { setTrip(t); setDays(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tripId]);

  async function refresh() {
    setDays(await getItinerary(tripId));
  }

  // ── Reorder days ──────────────────────────────────────────────
  async function moveDay(idx: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= days.length) return;
    const dayA = days[idx];
    const dayB = days[targetIdx];

    // Optimistic update
    setDays((prev) => {
      const next = [...prev];
      next[idx] = { ...dayA, day_number: dayB.day_number };
      next[targetIdx] = { ...dayB, day_number: dayA.day_number };
      return next.sort((a, b) => a.day_number - b.day_number);
    });

    try {
      await swapDays(tripId, dayA.id, dayB.id);
    } catch (err) {
      console.error(err);
      await refresh();
    }
  }

  // ── Add activity ──────────────────────────────────────────────
  function openAdd(dayId: string) {
    setActiveAddDayId(dayId);
    setNewTime("09:00");
    setNewTitle("");
  }

  async function handleAddActivity(dayId: string) {
    const title = newTitle.trim();
    if (!title || savingAct) return;
    setSavingAct(true);
    try {
      await addActivity(tripId, dayId, { time: newTime, title });
      await refresh();
      setActiveAddDayId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAct(false);
    }
  }

  async function handleDeleteActivity(actId: string) {
    try {
      await deleteActivity(tripId, actId);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }

  // ── Edit day label ─────────────────────────────────────────────
  function startEditLabel(day: ItineraryDay) {
    setEditLabelId(day.id);
    setEditLabelText(day.label);
  }

  async function saveLabel(dayId: string) {
    const text = editLabelText.trim();
    setEditLabelId(null);
    if (!text) return;
    try {
      await updateDay(tripId, dayId, { label: text });
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }

  // ── Add day ────────────────────────────────────────────────────
  async function handleAddDay() {
    const label = newDayLabel.trim();
    if (!label || savingDay) return;
    setSavingDay(true);
    try {
      const dayNumber = days.length + 1;
      const baseIso = trip?.confirmed_start_date ?? trip?.proposed_start_date;
      const base = baseIso ? new Date(baseIso) : new Date();
      base.setDate(base.getDate() + dayNumber - 1);
      const date = base.toISOString().slice(0, 10);

      const newDay = await addDay(tripId, { day_number: dayNumber, date, label });
      await refresh();
      setNewDayLabel("");
      setAddingDay(false);
      setActiveAddDayId(newDay.id);
      setNewTime("09:00");
      setNewTitle("");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDay(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[40px] pt-[64px]">
        {/* Header */}
        <div className="flex items-center gap-[12px] pb-[18px] pt-[4px] px-[20px]">
          <button
            type="button"
            onClick={() => router.push(`/trips/${tripId}`)}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px]" />
          </button>
          <p className="flex-1 text-[22px] font-medium tracking-[0.08px] text-[#14110d]">
            แก้แผนเดินทาง
          </p>
        </div>

        {/* Days timeline */}
        <div className="flex flex-col pl-[44px] pr-[20px]">
          {days.map((day, idx) => (
            <div
              key={day.id}
              className="relative flex gap-[12px] border-b border-[#e5e1d7] pb-[15px] pt-[14px]"
            >
              {/* Reorder arrows — absolute left */}
              <div className="absolute left-[-34px] top-[14px] flex flex-col gap-[1px]">
                <button
                  type="button"
                  onClick={() => moveDay(idx, "up")}
                  disabled={idx === 0}
                  className={`flex size-[16px] items-center justify-center rounded-[4px] transition-opacity ${
                    idx === 0 ? "opacity-15" : "opacity-50 active:opacity-100"
                  }`}
                >
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
                    <path d="M1 5L4.5 1.5L8 5" stroke="#14110d" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveDay(idx, "down")}
                  disabled={idx === days.length - 1}
                  className={`flex size-[16px] items-center justify-center rounded-[4px] transition-opacity ${
                    idx === days.length - 1 ? "opacity-15" : "opacity-50 active:opacity-100"
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
                  {String(day.day_number).padStart(2, "0")}
                </p>
                <p className="text-[10px] tracking-[0.08px] text-[#b5b0a4]">
                  {formatShortDate(day.date)}
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
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(act.id)}
                      className="shrink-0 opacity-25 active:opacity-80"
                    >
                      <img src="/images/icon-close.svg" alt="" className="size-[11px]" />
                    </button>
                  </div>
                ))}

                {/* Inline add activity form */}
                {activeAddDayId === day.id && (
                  <div className="flex items-center gap-[8px] py-[6px]">
                    <div className="w-[44px] shrink-0 border-b border-[#8a8275]">
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-transparent pb-[3px] pt-[2px] text-[11.5px] text-[#767168] outline-none [&::-webkit-calendar-picker-indicator]:hidden"
                      />
                    </div>
                    <div className="flex flex-1 items-center gap-[6px] border-b border-[#8a8275]">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddActivity(day.id); }}
                        placeholder="เพิ่มกิจกรรม..."
                        autoFocus
                        className="flex-1 bg-transparent pb-[3px] pt-[2px] text-[13px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTitle.trim()) handleAddActivity(day.id);
                          else setActiveAddDayId(null);
                        }}
                        disabled={savingAct}
                        className={`shrink-0 pb-[3px] text-[12px] font-medium ${
                          newTitle.trim() ? "text-[#e85a2c]" : "text-[#b5b0a4] opacity-50"
                        }`}
                      >
                        {savingAct ? "..." : newTitle.trim() ? "เพิ่ม" : "✕"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Add activity link */}
                {activeAddDayId !== day.id && (
                  <button
                    type="button"
                    onClick={() => openAdd(day.id)}
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
        <div className="px-[20px] pt-[6px]">
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
                onKeyDown={(e) => e.key === "Enter" && handleAddDay()}
                className="flex-1 bg-transparent text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
              />
              <button
                type="button"
                onClick={handleAddDay}
                disabled={!newDayLabel.trim() || savingDay}
                className={`shrink-0 text-[13px] font-medium transition-opacity ${
                  newDayLabel.trim() ? "text-[#e85a2c]" : "text-[#b5b0a4] opacity-50"
                }`}
              >
                {savingDay ? "..." : "เพิ่ม"}
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
              className="flex w-full items-center gap-[10px] rounded-[14px] border border-dashed border-[#d4cfc2] px-[16px] py-[14px]"
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
