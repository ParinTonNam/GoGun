"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAvailability,
  getMemberAvailability,
  setMemberAvailability,
  getTrip,
  updateTrip,
  getMe,
  getInitial,
  formatShortDate,
  type AvailabilityDay,
  type Trip,
  type TripMember,
  type MyAvailability,
  type User,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { LoadError } from "@/components/load-error";
import { useLoad } from "@/lib/use-load";

type MyStatus = "available" | "uncertain" | "unavailable";

const STATUS_CYCLE: MyStatus[] = ["unavailable", "available", "uncertain"];

const STYLE: Record<string, { bg: string; text: string }> = {
  all:       { bg: "#2e8b5c", text: "#ffffff" },
  some:      { bg: "#e0f0e5", text: "#2e8b5c" },
  uncertain: { bg: "#faefcb", text: "#d9a21b" },
  default:   { bg: "#f2efe8", text: "#14110d" },
};

function CheckBadge() {
  return (
    <div className="flex size-[17px] shrink-0 items-center justify-center rounded-[8.5px] bg-[#e0f0e5]">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <path
          d="M1.5 4.5L3.5 6.5L7.5 2"
          stroke="#2e8b5c"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const THAI_YEAR_OFFSET = 543;
const DAY_HEADERS = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function buildGrid(year: number, month: number): Array<{ date: number; inMonth: boolean }> {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { date: number; inMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: daysInPrev - i, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: d, inMonth: true });
  const remaining = 7 - (cells.length % 7 === 0 ? 7 : cells.length % 7);
  for (let d = 1; d <= remaining && remaining < 7; d++) cells.push({ date: d, inMonth: false });
  return cells;
}

function dateKey(year: number, month: number, date: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

function monthRangeKeys(year: number, month: number): { start: string; end: string } {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { start: dateKey(year, month, 1), end: dateKey(year, month, daysInMonth) };
}

// key เป็นรูปแบบ YYYY-MM-DD (แพ็ดศูนย์) เทียบสตริงได้ตรงกับวันปัจจุบัน
function todayKey(): string {
  const t = new Date();
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}
function isPastKey(key: string): boolean {
  return key < todayKey();
}

function daysBetweenInclusive(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

// Groups a sorted list of ISO dates into runs of consecutive days,
// e.g. ["11-14","11-15","11-16","11-20"] -> [{14-16 range}, {20}]
function groupConsecutiveDays(dates: string[]): Array<{ start: string; end: string }> {
  const sorted = [...dates].sort();
  const groups: Array<{ start: string; end: string }> = [];
  for (const d of sorted) {
    const last = groups[groups.length - 1];
    if (last) {
      const expectedNext = new Date(last.end);
      expectedNext.setDate(expectedNext.getDate() + 1);
      if (expectedNext.toISOString().slice(0, 10) === d) {
        last.end = d;
        continue;
      }
    }
    groups.push({ start: d, end: d });
  }
  return groups;
}

function formatRangeLabel(start: string, end: string): string {
  if (start === end) return formatShortDate(start);
  return `${new Date(start).getDate()}–${formatShortDate(end)}`;
}

function ConfirmDateSheet({
  presets,
  initialYear,
  initialMonth,
  onClose,
  onConfirm,
}: {
  presets: Array<{ start: string; end: string }>;
  initialYear: number;
  initialMonth: number;
  onClose: () => void;
  onConfirm: (start: string, end: string) => void;
}) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(presets.length > 0 ? 0 : null);
  const [customMode, setCustomMode] = useState(false);
  const [view, setView] = useState({ year: initialYear, month: initialMonth });
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const canConfirm =
    (!customMode && selectedPreset !== null) ||
    (customMode && rangeStart !== null && rangeEnd !== null);

  function handleDayTap(key: string) {
    if (isPastKey(key)) return; // ยืนยันวันทริปในอดีตไม่ได้
    if (rangeStart === null || rangeEnd !== null) {
      setRangeStart(key);
      setRangeEnd(null);
    } else if (key >= rangeStart) {
      setRangeEnd(key);
    } else {
      setRangeStart(key);
      setRangeEnd(null);
    }
  }

  function dayStyle(key: string): { bg: string; text: string; rounded: string } {
    if (rangeStart !== null && rangeEnd === null && key === rangeStart)
      return { bg: "#e85a2c", text: "#ffffff", rounded: "rounded-[5px]" };
    if (rangeStart !== null && rangeEnd !== null) {
      if (key === rangeStart && key === rangeEnd) return { bg: "#e85a2c", text: "#ffffff", rounded: "rounded-[5px]" };
      if (key === rangeStart) return { bg: "#e85a2c", text: "#ffffff", rounded: "rounded-l-[5px]" };
      if (key === rangeEnd) return { bg: "#e85a2c", text: "#ffffff", rounded: "rounded-r-[5px]" };
      if (key > rangeStart && key < rangeEnd) return { bg: "#fcede3", text: "#e85a2c", rounded: "" };
    }
    return { bg: "transparent", text: "#14110d", rounded: "" };
  }

  const grid = buildGrid(view.year, view.month);

  function handleConfirmClick() {
    if (!customMode && selectedPreset !== null) {
      onConfirm(presets[selectedPreset].start, presets[selectedPreset].end);
    } else if (customMode && rangeStart && rangeEnd) {
      onConfirm(rangeStart, rangeEnd);
    }
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[420px] -translate-x-1/2 overflow-hidden rounded-tl-[25px] rounded-tr-[25px] bg-[#f7f5f0] shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
      <div className="flex justify-center pt-[10px]">
        <div className="h-[4px] w-[36px] rounded-[2px] bg-[#d4cfc2]" />
      </div>
      <div className="flex max-h-[88vh] flex-col gap-[10px] overflow-y-auto px-[20px] pb-[36px] pt-[20px]">
        <div className="flex h-[36px] shrink-0 items-center justify-between">
          <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">ยืนยันวันที่</p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#e5e1d7]"
          >
            <img src="/images/icon-close.svg" alt="" className="size-[14px]" />
          </button>
        </div>

        {presets.length > 0 ? (
          presets.map((p, i) => (
            <button
              key={`${p.start}-${p.end}`}
              type="button"
              onClick={() => { setSelectedPreset(i); setCustomMode(false); }}
              className="flex shrink-0 items-center justify-between rounded-[18px] bg-white px-[20px] py-[15px]"
              style={{ border: !customMode && selectedPreset === i ? "2px solid #c1440e" : "1px solid #e5e1d7" }}
            >
              <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                {formatRangeLabel(p.start, p.end)}
              </p>
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                ที่ว่างพร้อมกันทุกคน
              </p>
            </button>
          ))
        ) : (
          <div className="flex items-center justify-center rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[20px]">
            <p className="text-[13px] font-light text-[#767168]">ยังไม่มีวันที่ทุกคนว่างพร้อมกัน</p>
          </div>
        )}

        {!customMode ? (
          <button
            type="button"
            onClick={() => { setCustomMode(true); setSelectedPreset(null); }}
            className="flex shrink-0 items-center rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]"
          >
            <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">เลือกด้วยตัวเอง</p>
          </button>
        ) : (
          <div className="shrink-0 rounded-[16px] border-2 border-[#c1440e] bg-white p-[15px]">
            <p className="mb-[10px] text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
              เลือกด้วยตัวเอง
            </p>

            <div className="flex items-center justify-between px-[4px] pb-[8px]">
              <button
                type="button"
                onClick={() =>
                  setView(({ year, month }) => (month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }))
                }
                className="flex size-[26px] items-center justify-center rounded-[13px] border border-[#e5e1d7]"
              >
                <img src="/images/icon-chevron-left.svg" alt="" className="size-[10px]" />
              </button>
              <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">
                {THAI_MONTHS[view.month]}{view.year + THAI_YEAR_OFFSET}
              </p>
              <button
                type="button"
                onClick={() =>
                  setView(({ year, month }) => (month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }))
                }
                className="flex size-[26px] items-center justify-center rounded-[13px] border border-[#e5e1d7]"
              >
                <img src="/images/icon-chevron-left.svg" alt="" className="size-[10px] rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-x-[2px]">
              {DAY_HEADERS.map((h) => (
                <div key={h} className="flex h-[24px] items-center justify-center">
                  <p className="text-[9px] font-light uppercase tracking-[0.9px] text-[#b5b0a4]">{h}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-x-[2px] gap-y-px py-px">
              {grid.map((cell, idx) => {
                const key = cell.inMonth ? dateKey(view.year, view.month, cell.date) : null;
                const s = key ? dayStyle(key) : { bg: "transparent", text: "#b5b0a4", rounded: "" };
                const past = !!key && isPastKey(key);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!cell.inMonth || past}
                    onClick={() => key && handleDayTap(key)}
                    className={`flex h-[45px] items-center justify-center text-[12px] font-light ${s.rounded}`}
                    style={{ backgroundColor: s.bg, color: s.text, opacity: past ? 0.4 : 1 }}
                  >
                    {cell.date}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirmClick}
          disabled={!canConfirm}
          className="flex h-[48px] w-full shrink-0 items-center justify-center rounded-[14px] bg-[#14110d] text-[14px] font-medium tracking-[0.14px] text-[#f7f5f0] transition-opacity disabled:opacity-40"
        >
          ยืนยันวันไป
        </button>
        <p className="shrink-0 text-[11px] tracking-[0.08px] text-[#767168]">
          * สามารถเปลี่ยนวันที่ภายหลังได้
        </p>
      </div>
    </div>
  );
}

export default function AvailabilityPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const viewYear = view.year;
  const viewMonth = view.month;
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Record<string, MyStatus>>({});
  const [editSavedDates, setEditSavedDates] = useState<Set<string>>(new Set());
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFriend, setEditingFriend] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  function selectMember(userId: string) {
    setSelectedUserId(userId);
    setEditingFriend(false);
    setJustSaved(false);
  }

  const { loading, error: mainError, retry: retryMain } = useLoad(async () => {
    const [t, user] = await Promise.all([getTrip(tripId), getMe()]);
    setTrip(t);
    setMe(user);
    const startIso = t.confirmed_start_date || t.proposed_start_date;
    if (startIso) {
      const d = new Date(startIso);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    }
    setSelectedUserId(user.id);
  }, [tripId]);

  // Aggregate availability is scoped to whichever month is being browsed,
  // not just the trip's originally proposed window — refetch on navigation.
  const { error: monthError, retry: retryMonth } = useLoad(async () => {
    setDays(await getAvailability(tripId, monthRangeKeys(viewYear, viewMonth)));
  }, [tripId, viewYear, viewMonth]);

  const isOrganizer = !!(me && trip && me.id === trip.organizer_id);
  const members: TripMember[] = [...(trip?.members.filter((m) => m.status === "joined") ?? [])].sort(
    (a, b) => (a.user_id === me?.id ? -1 : b.user_id === me?.id ? 1 : 0),
  );
  const isSelfSelected = !!(me && selectedUserId === me.id);
  const canEditDays = isOrganizer && (isSelfSelected || editingFriend);

  const { error: editError, retry: retryEdit } = useLoad(async () => {
    if (!isOrganizer || !selectedUserId) return;
    setEditLoading(true);
    try {
      const entries: MyAvailability[] = await getMemberAvailability(tripId, selectedUserId);
      const statusMap: Record<string, MyStatus> = {};
      const dateSet = new Set<string>();
      for (const e of entries) {
        statusMap[e.date] = e.status;
        dateSet.add(e.date);
      }
      setEditStatus(statusMap);
      setEditSavedDates(dateSet);
    } finally {
      setEditLoading(false);
    }
  }, [tripId, selectedUserId, isOrganizer]);

  const loadError = mainError ?? monthError ?? editError;
  function retryAll() {
    retryMain();
    retryMonth();
    retryEdit();
  }

  function toggleDay(key: string) {
    if (!canEditDays) return;
    if (isPastKey(key)) return; // กันเลือกวันที่ผ่านมาแล้ว
    setJustSaved(false);
    setEditStatus((prev) => {
      const cur = prev[key] ?? "unavailable";
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
      return { ...prev, [key]: next };
    });
  }

  async function handleSaveEdits() {
    if (!selectedUserId) return;
    const wasSelf = isSelfSelected;
    setSaving(true);
    try {
      const allKeys = new Set([...Object.keys(editStatus), ...editSavedDates]);
      const entries: MyAvailability[] = [...allKeys].map((date) => ({
        date,
        status: editStatus[date] ?? "unavailable",
      }));
      await setMemberAvailability(tripId, selectedUserId, entries);
      const [avDays, mine] = await Promise.all([
        getAvailability(tripId, monthRangeKeys(viewYear, viewMonth)),
        getMemberAvailability(tripId, selectedUserId),
      ]);
      setDays(avDays);
      const statusMap: Record<string, MyStatus> = {};
      const dateSet = new Set<string>();
      for (const e of mine) {
        statusMap[e.date] = e.status;
        dateSet.add(e.date);
      }
      setEditStatus(statusMap);
      setEditSavedDates(dateSet);
      setJustSaved(true);
      setTimeout(() => {
        setJustSaved(false);
        if (!wasSelf) setEditingFriend(false);
      }, 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(startDate: string, endDate: string) {
    setConfirming(true);
    try {
      await updateTrip(tripId, {
        confirmed_start_date: startDate,
        date_status: "confirmed",
        duration_days: daysBetweenInclusive(startDate, endDate),
      } as Partial<Trip>);
      setShowConfirmSheet(false);
      router.push(`/trips/${tripId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  }

  const dayMap: Record<string, AvailabilityDay> = {};
  for (const d of days) dayMap[d.date] = d;

  const grid = buildGrid(viewYear, viewMonth);

  const allDays = days.filter((d) => d.variant === "all");
  const presets = groupConsecutiveDays(allDays.map((d) => d.date));

  if (loadError) {
    return <LoadError message={loadError} onRetry={retryAll} />;
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
      <div className="flex w-full max-w-[420px] flex-col pb-[30px] pt-[24px]">
        {/* Header */}
        <div className="px-[24px]">
          <PageHeader title="เทียบวันว่าง" backHref={`/trips/${tripId}`} user={me} />
        </div>

        <div className="flex flex-col gap-[20px]">
          {/* Member filter pills — organizer only, editing on behalf of a member */}
          {isOrganizer && members.length > 0 && (
            <div className="flex flex-col gap-[10px] px-[24px]">
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ใครเลือกอยู่</p>
              <div className="flex flex-wrap gap-[5px]">
                {members.map((m) => {
                  const isActive = selectedUserId === m.user_id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMember(m.user_id)}
                      className="flex h-[33px] items-center gap-[8px] rounded-[48px] border p-[7px]"
                      style={{
                        backgroundColor: isActive ? "#14110d" : "#ffffff",
                        borderColor: isActive ? "#14110d" : "#e5e1d7",
                      }}
                    >
                      <span
                        className="flex size-[22px] items-center justify-center rounded-[31px] text-[12px] font-medium text-white"
                        style={{ backgroundColor: m.user.avatar_color }}
                      >
                        {getInitial(m.user.display_name)}
                      </span>
                      <span
                        className="text-[12px] font-medium tracking-[0.08px]"
                        style={{ color: isActive ? "#ffffff" : "#14110d" }}
                      >
                        {m.user.display_name}
                      </span>
                      {m.user_id === me?.id && (
                        <span className="text-[10px] font-light tracking-[0.08px]" style={{ color: isActive ? "#f0b79a" : "#c44211" }}>
                          YOU
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="flex flex-col gap-[2px] px-[24px]">
            <div className="flex h-[36px] items-center justify-between">
              <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">
                {THAI_MONTHS[viewMonth]} {viewYear + THAI_YEAR_OFFSET}
              </p>
              <div className="flex items-center gap-[5px]">
                <button
                  type="button"
                  onClick={() => {
                    setView(({ year, month }) =>
                      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
                    );
                  }}
                  className="flex size-[36px] items-center justify-center"
                >
                  <img src="/images/icon-cal-prev.svg" alt="" className="size-[36px]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView(({ year, month }) =>
                      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
                    );
                  }}
                  className="flex size-[36px] items-center justify-center"
                >
                  <img src="/images/icon-cal-next.svg" alt="" className="size-[36px]" />
                </button>
              </div>
            </div>

            <div className="flex gap-[2px]">
              {DAY_HEADERS.map((h) => (
                <div key={h} className="flex size-[49px] items-center justify-center rounded-[12px]">
                  <p className="text-[13px] font-medium text-[#767168]">{h}</p>
                </div>
              ))}
            </div>

            {Array.from({ length: Math.ceil(grid.length / 7) }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex gap-[2px]">
                {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
                  const key = cell.inMonth ? dateKey(viewYear, viewMonth, cell.date) : null;
                  const avDay = key ? dayMap[key] : null;

                  let variant = avDay?.variant ?? "default";
                  let badge: string | null = null;

                  if (isOrganizer && key) {
                    const myStatus = editStatus[key] ?? "unavailable";
                    const memberCount = avDay?.member_count ?? 0;
                    const baseAvailable = avDay?.available ?? 0;
                    const wasAvailableOnServer =
                      avDay?.members.some((m) => m.user_id === selectedUserId && m.status === "available") ?? false;
                    let effectiveAvailable = baseAvailable;
                    if (myStatus === "available" && !wasAvailableOnServer) effectiveAvailable += 1;
                    if (myStatus !== "available" && wasAvailableOnServer) effectiveAvailable -= 1;

                    if (myStatus === "available" && memberCount > 0 && effectiveAvailable >= memberCount) {
                      variant = "all";
                      badge = "ทุกคน";
                    } else if (myStatus === "available") {
                      variant = "some";
                      badge = memberCount > 0 ? `${effectiveAvailable}/${memberCount}` : "ว่าง";
                    } else if (myStatus === "uncertain") {
                      variant = "uncertain";
                      badge = memberCount > 0 && effectiveAvailable > 0 ? `${effectiveAvailable}/${memberCount}` : null;
                    } else {
                      variant = "default";
                      badge = memberCount > 0 && effectiveAvailable > 0 ? `${effectiveAvailable}/${memberCount}` : null;
                    }
                  } else if (avDay) {
                    badge =
                      variant === "all"
                        ? "ทุกคน"
                        : avDay.member_count > 0 && avDay.available > 0
                        ? `${avDay.available}/${avDay.member_count}`
                        : null;
                  }

                  const s = cell.inMonth ? STYLE[variant] : { bg: "transparent", text: "#767168" };
                  const past = !!key && isPastKey(key);

                  return (
                    <button
                      key={colIdx}
                      type="button"
                      disabled={!cell.inMonth || !canEditDays || editLoading || past}
                      onClick={() => key && toggleDay(key)}
                      className="flex size-[49px] shrink-0 flex-col items-center justify-center rounded-[12px]"
                      style={{ backgroundColor: s.bg, opacity: past ? 0.4 : 1 }}
                    >
                      <span className="text-[13px] font-medium tracking-[0.08px]" style={{ color: s.text }}>
                        {cell.date}
                      </span>
                      {badge && (
                        <span className="text-[9px] uppercase tracking-[1.26px]" style={{ color: s.text }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-[8px] px-[24px]">
            {canEditDays ? (
              <div className="flex flex-wrap items-center gap-[8px] text-[12px] font-light tracking-[0.08px]">
                <span className="text-[#767168]">แตะวันเพื่อสลับ:</span>
                <span className="inline-flex items-center gap-[4px]">
                  <span className="size-[14px] rounded-[3px] bg-[#f2efe8]" />
                  <span className="text-[#14110d]">ไม่ว่าง</span>
                </span>
                <span className="text-[#14110d]">→</span>
                <span className="inline-flex items-center gap-[4px]">
                  <span className="size-[14px] rounded-[3px] bg-[#e0f0e5]" />
                  <span className="text-[#2e8b5c]">ว่าง</span>
                </span>
                <span className="text-[#14110d]">→</span>
                <span className="inline-flex items-center gap-[4px]">
                  <span className="size-[14px] rounded-[3px] bg-[#faefcb]" />
                  <span className="text-[#d9a21b]">ไม่แน่ใจ</span>
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-[8px] text-[12px] font-light tracking-[0.08px]">
                <span className="text-[#767168]">ดูวันของเพื่อน:</span>
                <span className="inline-flex items-center gap-[4px]">
                  <span className="size-[14px] rounded-[3px] bg-[#f2efe8]" />
                  <span className="text-[#14110d]">ไม่ว่าง</span>
                </span>
                <span className="inline-flex items-center gap-[4px]">
                  <span className="size-[14px] rounded-[3px] bg-[#e0f0e5]" />
                  <span className="text-[#2e8b5c]">ว่าง</span>
                </span>
                <span className="inline-flex items-center gap-[4px]">
                  <span className="size-[14px] rounded-[3px] bg-[#faefcb]" />
                  <span className="text-[#d9a21b]">ไม่แน่ใจ</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-[8px] text-[12px] font-light tracking-[0.08px]">
              <span className="size-[14px] shrink-0 rounded-[3px] bg-[#2e8b5c]" />
              <span className="text-[#14110d]">ทุกคนว่างตรงกัน</span>
            </div>
          </div>

          {/* Recommendation */}
          {presets.length > 0 && (
            <div className="px-[24px]">
              <div className="flex items-center gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]">
                <div className="flex flex-1 flex-col gap-[5px]">
                  <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                    มี {allDays.length} วัน
                  </p>
                  <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                    ที่ว่างพร้อมกันทุกคน
                  </p>
                </div>
                <div className="flex flex-col items-end gap-[5px]">
                  <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">แนะนำ</p>
                  <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                    {formatRangeLabel(presets[0].start, presets[0].end)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save + Confirm */}
          <div className="flex flex-col gap-[5px] px-[24px]">
            {isOrganizer && !isSelfSelected && !editingFriend && (
              <button
                type="button"
                onClick={() => setEditingFriend(true)}
                className="flex h-[48px] w-full items-center justify-center rounded-[14px] border border-[#d4cfc2] bg-white text-[14px] font-medium tracking-[0.14px] text-[#14110d]"
              >
                แก้ไขวันของเพื่อน
              </button>
            )}
            {isOrganizer && (isSelfSelected || editingFriend) && (
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={saving || editLoading}
                className={
                  justSaved && !saving
                    ? "flex h-[48px] w-full items-center justify-center gap-[6px] rounded-[14px] bg-[#2e8b5c] text-[14px] font-medium tracking-[0.14px] text-white transition-colors"
                    : "flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#14110d] text-[14px] font-medium tracking-[0.14px] text-white transition-colors disabled:opacity-50"
                }
              >
                {saving ? (
                  "กำลังบันทึก..."
                ) : justSaved ? (
                  <>
                    บันทึกเรียบร้อย
                    <CheckBadge />
                  </>
                ) : isSelfSelected ? (
                  "บันทึกวันว่าง"
                ) : (
                  "บันทึกวันว่างของเพื่อน"
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowConfirmSheet(true)}
              className="flex h-[48px] w-full items-center justify-center rounded-[14px] border border-[#e85a2c] bg-white text-[14px] font-medium tracking-[0.14px] text-[#e85a2c]"
            >
              ยืนยันวันไป
            </button>
          </div>
        </div>
      </div>

      {showConfirmSheet && (
        <>
          <div className="fixed inset-0 z-10 bg-black/30" onClick={() => setShowConfirmSheet(false)} />
          <ConfirmDateSheet
            presets={presets}
            initialYear={viewYear}
            initialMonth={viewMonth}
            onClose={() => setShowConfirmSheet(false)}
            onConfirm={handleConfirm}
          />
        </>
      )}
    </main>
  );
}
