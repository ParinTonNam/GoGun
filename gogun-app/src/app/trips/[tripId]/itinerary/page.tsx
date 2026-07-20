"use client";

import { use, useState } from "react";
import {
  getTrip,
  getItinerary,
  getMe,
  addDay,
  updateDay,
  deleteDay,
  swapDays,
  addActivity,
  updateActivity,
  deleteActivity,
  formatShortDate,
  type Trip,
  type ItineraryDay,
  type ItineraryActivity,
  type User,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { LoadError } from "@/components/load-error";
import { useLoad } from "@/lib/use-load";

// เวลาถัดไป = เวลาล่าสุดของวันนั้น + 1 ชม. (สูงสุด 23:00) ถ้ายังไม่มีกิจกรรมเริ่ม 09:00
function nextActivityTime(day: ItineraryDay): string {
  if (day.activities.length === 0) return "09:00";
  const latest = day.activities.reduce((a, b) => (a.time > b.time ? a : b)).time;
  const [h, m] = latest.split(":").map(Number);
  const nh = Math.min((Number.isNaN(h) ? 9 : h) + 1, 23);
  const mm = Number.isNaN(m) ? 0 : m;
  return `${String(nh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Add activity
  const [activeAddDayId, setActiveAddDayId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState("09:00");
  const [newTitle, setNewTitle] = useState("");
  const [savingAct, setSavingAct] = useState(false);

  // Edit activity
  const [editActId, setEditActId] = useState<string | null>(null);
  const [editActTime, setEditActTime] = useState("09:00");
  const [editActTitle, setEditActTitle] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit day label
  const [editLabelId, setEditLabelId] = useState<string | null>(null);
  const [editLabelText, setEditLabelText] = useState("");

  // Add day
  const [addingDay, setAddingDay] = useState(false);
  const [newDayLabel, setNewDayLabel] = useState("");
  const [savingDay, setSavingDay] = useState(false);

  const { loading, error: loadError, retry } = useLoad(async () => {
    const [t, d, user] = await Promise.all([getTrip(tripId), getItinerary(tripId), getMe()]);
    setTrip(t);
    setDays(d);
    setMe(user);
  }, [tripId]);

  async function refresh() {
    setDays(await getItinerary(tripId));
  }

  // organizer แก้ได้เสมอ; สมาชิกแก้ได้เมื่อทริปเปิดสิทธิ์ allow_member_itinerary_edit
  const isOrganizer = !!(me && trip && me.id === trip.organizer_id);
  const canEdit = isOrganizer || !!trip?.allow_member_itinerary_edit;

  function toggleEditMode() {
    setEditMode((on) => {
      if (on) {
        // ออกจากโหมดแก้ไข — เคลียร์ฟอร์ม/สถานะแก้ที่ค้างอยู่
        setEditActId(null);
        setActiveAddDayId(null);
        setEditLabelId(null);
        setAddingDay(false);
      }
      return !on;
    });
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
  function openAdd(day: ItineraryDay) {
    setEditActId(null);
    setActiveAddDayId(day.id);
    setNewTime(nextActivityTime(day)); // เวลารันต่อ +1 ชม. จากกิจกรรมล่าสุด
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

  // ── Delete day ────────────────────────────────────────────────
  async function handleDeleteDay(day: ItineraryDay) {
    const count = day.activities.length;
    const msg = count > 0
      ? `ลบ "${day.label}" และกิจกรรม ${count} รายการ?`
      : `ลบ "${day.label}"?`;
    if (!window.confirm(msg)) return;
    try {
      await deleteDay(tripId, day.id);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }

  // ── Edit activity ─────────────────────────────────────────────
  function startEditActivity(act: ItineraryActivity) {
    setActiveAddDayId(null);
    setEditActId(act.id);
    setEditActTime(act.time);
    setEditActTitle(act.title);
  }

  async function handleSaveActivity(actId: string) {
    const title = editActTitle.trim();
    if (!title || savingEdit) return;
    setSavingEdit(true);
    try {
      await updateActivity(tripId, actId, { time: editActTime, title });
      await refresh();
      setEditActId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
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

  if (loadError) {
    return <LoadError message={loadError} onRetry={retry} />;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  // ยังไม่กำหนดวันเดินทาง → ไม่โชว์วันที่ใต้เลข DAY (กันเลขวันที่หลอก)
  const hasTripDate = Boolean(trip?.confirmed_start_date || trip?.proposed_start_date);

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[40px] pt-[24px]">
        {/* Header */}
        <div className="px-[24px]">
          <PageHeader
            title="แผนเดินทาง"
            backHref={`/trips/${tripId}`}
            user={me}
            right={
              canEdit ? (
                <button
                  type="button"
                  onClick={toggleEditMode}
                  className={`flex h-[32px] items-center gap-[6px] rounded-[10px] px-[12px] text-[12px] font-medium tracking-[0.08px] transition-colors ${
                    editMode
                      ? "bg-[#14110d] text-[#f7f5f0]"
                      : "border border-[#e5e1d7] bg-white text-[#14110d]"
                  }`}
                >
                  {editMode ? (
                    "เสร็จ"
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 2.5l2 2L5 11l-2.5.5L3 9l6.5-6.5Z" stroke="#14110d" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                      แก้ไข
                    </>
                  )}
                </button>
              ) : undefined
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
              {/* Reorder arrows — absolute left (โหมดแก้ไขเท่านั้น) */}
              {editMode && (
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
              )}

              {/* Day number column */}
              <div className="w-[40px] shrink-0">
                <p className="text-[9.5px] uppercase tracking-[1.71px] text-[#767168]">DAY</p>
                <p className="text-[28px] font-light leading-[28px] tracking-[-0.56px] text-[#14110d]">
                  {String(day.day_number).padStart(2, "0")}
                </p>
                {hasTripDate && (
                  <p className="text-[10px] tracking-[0.08px] text-[#b5b0a4]">
                    {formatShortDate(day.date)}
                  </p>
                )}
              </div>

              {/* Day content */}
              <div className="flex flex-1 flex-col pb-[2px]">
                {/* Day label — แก้/ลบ ได้เฉพาะโหมดแก้ไข */}
                <div className="mb-[8px] flex h-[32px] items-center gap-[8px]">
                  {!editMode ? (
                    <p className="flex-1 text-left text-[15px] font-medium text-[#14110d]">
                      {day.label}
                    </p>
                  ) : editLabelId === day.id ? (
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
                      className="flex-1 text-left text-[15px] font-medium text-[#14110d]"
                    >
                      {day.label}
                    </button>
                  )}
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDay(day)}
                      className="shrink-0 p-[6px] opacity-30 active:opacity-80"
                      aria-label="ลบวัน"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 3.5h9M5.5 3.5V2.2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.3M3.5 3.5l.5 8a1 1 0 0 0 1 .95h4a1 1 0 0 0 1-.95l.5-8" stroke="#c0392b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Activities — เรียงตามเวลาเสมอ */}
                {[...day.activities]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((act) =>
                    !editMode ? (
                      // Read-only row (โหมดดู)
                      <div key={act.id} className="flex items-center gap-[8px] py-[6px]">
                        <span className="w-[44px] shrink-0 text-[11.5px] text-[#767168]">{act.time}</span>
                        <span className="flex-1 text-[13px] text-[#14110d]">{act.title}</span>
                      </div>
                    ) : editActId === act.id ? (
                      // Inline edit form
                      <div key={act.id} className="flex items-center gap-[8px] py-[6px]">
                        <div className="w-[52px] shrink-0 border-b border-[#8a8275]">
                          <input
                            type="time"
                            value={editActTime}
                            onChange={(e) => setEditActTime(e.target.value)}
                            className="w-full bg-transparent pb-[3px] pt-[2px] text-[11.5px] text-[#767168] outline-none [&::-webkit-calendar-picker-indicator]:hidden"
                          />
                        </div>
                        <div className="flex flex-1 items-center gap-[6px] border-b border-[#8a8275]">
                          <input
                            type="text"
                            value={editActTitle}
                            onChange={(e) => setEditActTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveActivity(act.id);
                              if (e.key === "Escape") setEditActId(null);
                            }}
                            autoFocus
                            className="flex-1 bg-transparent pb-[3px] pt-[2px] text-[13px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveActivity(act.id)}
                            disabled={!editActTitle.trim() || savingEdit}
                            className={`shrink-0 px-[6px] pb-[3px] text-[12px] font-medium ${
                              editActTitle.trim() ? "text-[#e85a2c]" : "text-[#b5b0a4] opacity-50"
                            }`}
                          >
                            {savingEdit ? "..." : "บันทึก"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditActId(null)}
                            className="shrink-0 px-[4px] pb-[3px] text-[12px] text-[#b5b0a4]"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      // แตะที่แถวเพื่อแก้ไข + ปุ่มลบแยก
                      <div key={act.id} className="flex items-center gap-[8px] py-[6px]">
                        <button
                          type="button"
                          onClick={() => startEditActivity(act)}
                          className="flex flex-1 items-center gap-[8px] text-left active:opacity-60"
                        >
                          <span className="w-[44px] shrink-0 text-[11.5px] text-[#767168]">{act.time}</span>
                          <span className="flex-1 text-[13px] text-[#14110d]">{act.title}</span>
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0 opacity-30">
                            <path d="M9.5 2.5l2 2L5 11l-2.5.5L3 9l6.5-6.5Z" stroke="#14110d" strokeWidth="1.2" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act.id)}
                          className="shrink-0 p-[4px] opacity-25 active:opacity-80"
                          aria-label="ลบกิจกรรม"
                        >
                          <img src="/images/icon-close.svg" alt="" className="size-[11px]" />
                        </button>
                      </div>
                    ),
                  )}

                {/* Inline add activity form */}
                {editMode && activeAddDayId === day.id && (
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
                        onClick={() => handleAddActivity(day.id)}
                        disabled={!newTitle.trim() || savingAct}
                        className={`shrink-0 rounded-[8px] px-[10px] py-[5px] text-[12px] font-medium ${
                          newTitle.trim() ? "bg-[#e85a2c] text-white" : "text-[#b5b0a4] opacity-50"
                        }`}
                      >
                        {savingAct ? "..." : "เพิ่ม"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveAddDayId(null)}
                        className="shrink-0 px-[4px] pb-[3px] text-[12px] text-[#b5b0a4]"
                        aria-label="ปิด"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Add activity link — แตะง่ายขึ้น (แถวเต็มความกว้าง) */}
                {editMode && activeAddDayId !== day.id && (
                  <button
                    type="button"
                    onClick={() => openAdd(day)}
                    className="mt-[2px] flex w-full items-center gap-[8px] rounded-[10px] border border-dashed border-[#d4cfc2] px-[12px] py-[10px] text-left active:bg-[#f2efe8]"
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

        {/* Add day area — โหมดแก้ไขเท่านั้น */}
        {editMode && (
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
        )}
      </div>
    </main>
  );
}
