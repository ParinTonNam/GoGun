"use client";

import { use, useState } from "react";
import {
  getMyAvailability,
  getAvailability,
  setAvailability,
  getMe,
  getTrip,
  getInitial,
  type AvailabilityDay,
  type MyAvailability,
  type User,
  type Trip,
  type TripMember,
} from "@/lib/api";
import { MemberBottomNav } from "@/components/member-bottom-nav";
import { PageHeader } from "@/components/page-header";
import { LoadError } from "@/components/load-error";
import { useLoad } from "@/lib/use-load";
import { useDragPaint } from "@/lib/use-drag-paint";

type MyStatus = "available" | "uncertain" | "unavailable";

const STATUS_CYCLE: MyStatus[] = ["unavailable", "available", "uncertain"];
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

function isPastDate(year: number, month: number, date: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(year, month, date) < today;
}

// เทียบวันอดีตจาก key "YYYY-MM-DD" ตรง ๆ (สำหรับ drag-paint ที่ทำงานบน key)
function isPastKey(key: string): boolean {
  const t = new Date();
  return key < dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}

function monthRangeKeys(year: number, month: number): { start: string; end: string } {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { start: dateKey(year, month, 1), end: dateKey(year, month, daysInMonth) };
}

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

export default function MemberAvailabilityPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [me, setMe] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [aggr, setAggr] = useState<Record<string, AvailabilityDay>>({});
  const [myStatus, setMyStatus] = useState<Record<string, MyStatus>>({});
  const [savedDates, setSavedDates] = useState<Set<string>>(new Set());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const isSelfSelected = !!(me && selectedUserId === me.id);
  const members: TripMember[] = [...(trip?.members.filter((m) => m.status === "joined") ?? [])].sort(
    (a, b) => (a.user_id === me?.id ? -1 : b.user_id === me?.id ? 1 : 0),
  );

  const { loading, error: mainError, retry: retryMain } = useLoad(async () => {
    const [mine, user, t] = await Promise.all([getMyAvailability(tripId), getMe(), getTrip(tripId)]);
    const statusMap: Record<string, MyStatus> = {};
    const dateSet = new Set<string>();
    for (const m of mine) {
      statusMap[m.date] = m.status === "unavailable" ? "unavailable" : m.status;
      dateSet.add(m.date);
    }
    if (mine.length > 0) {
      const firstDate = new Date(mine[0].date);
      setViewYear(firstDate.getFullYear());
      setViewMonth(firstDate.getMonth());
    }
    setMyStatus(statusMap);
    setSavedDates(dateSet);
    setMe(user);
    setTrip(t);
    setSelectedUserId(user.id);
  }, [tripId]);

  // Aggregate availability is scoped to whichever month is being browsed —
  // refetch whenever the visible month changes.
  const { error: monthError, retry: retryMonth } = useLoad(async () => {
    const all = await getAvailability(tripId, monthRangeKeys(viewYear, viewMonth));
    const aggrMap: Record<string, AvailabilityDay> = {};
    for (const d of all) aggrMap[d.date] = d;
    setAggr((prev) => ({ ...prev, ...aggrMap }));
  }, [tripId, viewYear, viewMonth]);

  const loadError = mainError ?? monthError;
  function retryAll() {
    retryMain();
    retryMonth();
  }

  // ลากทาสีวันว่างได้ทั้งมือถือ/คอม — แตะเดี่ยว = วนสถานะเหมือนเดิม
  const { onCellPointerDown } = useDragPaint<MyStatus>({
    paintable: (key) => isSelfSelected && !isPastKey(key),
    cycleNext: (key) => {
      const cur = myStatus[key] ?? "unavailable";
      return STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
    },
    applyPaint: (key, value) => {
      setJustSaved(false);
      setMyStatus((prev) => ({ ...prev, [key]: value }));
    },
  });

  async function handleSave() {
    setSaving(true);
    try {
      const allDates = new Set([...Object.keys(aggr), ...Object.keys(myStatus), ...savedDates]);
      const entries: MyAvailability[] = [];
      for (const date of allDates) {
        entries.push({ date, status: myStatus[date] ?? "unavailable" });
      }
      await setAvailability(tripId, entries);
      const [mine, all] = await Promise.all([
        getMyAvailability(tripId),
        getAvailability(tripId, monthRangeKeys(viewYear, viewMonth)),
      ]);
      const aggrMap: Record<string, AvailabilityDay> = {};
      for (const d of all) aggrMap[d.date] = d;
      const statusMap: Record<string, MyStatus> = {};
      const dateSet = new Set<string>();
      for (const m of mine) {
        statusMap[m.date] = m.status === "unavailable" ? "unavailable" : m.status;
        dateSet.add(m.date);
      }
      setAggr((prev) => ({ ...prev, ...aggrMap }));
      setMyStatus(statusMap);
      setSavedDates(dateSet);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function getCell(date: number, inMonth: boolean) {
    if (!inMonth) return { bg: "transparent", text: "#b5b0a4", label: null };
    const key = dateKey(viewYear, viewMonth, date);
    const aggrDay = aggr[key];
    const memberCount = aggrDay?.member_count ?? 0;

    if (!isSelfSelected) {
      // Read-only: friends' days come straight from the aggregate roster, no local edits possible.
      const status =
        (aggrDay?.members.find((m) => m.user_id === selectedUserId)?.status as MyStatus | undefined) ??
        "unavailable";
      const available = aggrDay?.available ?? 0;
      if (status === "available") {
        if (memberCount > 0 && available >= memberCount) {
          return { bg: "#2e8b5c", text: "#ffffff", label: "ทุกคน" };
        }
        return { bg: "#e0f0e5", text: "#2e8b5c", label: memberCount > 0 ? `${available}/${memberCount}` : "ว่าง" };
      }
      if (status === "uncertain") {
        return { bg: "#faefcb", text: "#d9a21b", label: memberCount > 0 && available > 0 ? `${available}/${memberCount}` : null };
      }
      return { bg: "#f2efe8", text: "#14110d", label: memberCount > 0 && available > 0 ? `${available}/${memberCount}` : null };
    }

    const status = myStatus[key] ?? "unavailable";
    const baseAvailable = aggrDay?.available ?? 0;
    const wasAvailableOnServer =
      aggrDay?.members.some((m) => m.user_id === me?.id && m.status === "available") ?? false;
    let available = baseAvailable;
    if (status === "available" && !wasAvailableOnServer) available += 1;
    if (status !== "available" && wasAvailableOnServer) available -= 1;

    if (status === "available") {
      if (memberCount > 0 && available >= memberCount) {
        return { bg: "#2e8b5c", text: "#ffffff", label: "ทุกคน" };
      }
      return { bg: "#e0f0e5", text: "#2e8b5c", label: memberCount > 0 ? `${available}/${memberCount}` : "ว่าง" };
    }
    if (status === "uncertain") {
      return { bg: "#faefcb", text: "#d9a21b", label: memberCount > 0 && available > 0 ? `${available}/${memberCount}` : null };
    }
    return { bg: "#f2efe8", text: "#14110d", label: memberCount > 0 && available > 0 ? `${available}/${memberCount}` : null };
  }

  const grid = buildGrid(viewYear, viewMonth);

  if (loadError) {
    return <LoadError message={loadError} onRetry={retryAll} />;
  }

  if (loading || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[100px] pt-[24px]">
        {/* Header */}
        <div className="px-[24px]">
          <PageHeader title="เทียบวันว่าง" user={me} />
        </div>

        {/* Member filter pills — view any member's days, but only your own are editable */}
        {members.length > 0 && (
          <div className="flex flex-col gap-[10px] px-[24px] pt-[6px]">
            <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ใครเลือกอยู่</p>
            <div className="flex flex-wrap gap-[5px]">
              {members.map((m) => {
                const isActive = selectedUserId === m.user_id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedUserId(m.user_id)}
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
        <div className="flex flex-col gap-[2px] px-[24px] pt-[20px]">
          <div className="flex h-[36px] items-center justify-between">
            <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">
              {THAI_MONTHS[viewMonth]} {viewYear + THAI_YEAR_OFFSET}
            </p>
            <div className="flex items-center gap-[5px]">
              <button
                type="button"
                onClick={() => {
                  if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
                  else setViewMonth((m) => m - 1);
                }}
                className="flex size-[36px] items-center justify-center"
              >
                <img src="/images/icon-cal-prev.svg" alt="" className="size-[36px]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
                  else setViewMonth((m) => m + 1);
                }}
                className="flex size-[36px] items-center justify-center"
              >
                <img src="/images/icon-cal-next.svg" alt="" className="size-[36px]" />
              </button>
            </div>
          </div>

          <div className="flex gap-[2px]">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="flex size-[49px] items-center justify-center text-[13px] font-medium tracking-[0.08px] text-[#767168]">
                {d}
              </div>
            ))}
          </div>

          {Array.from({ length: Math.ceil(grid.length / 7) }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex gap-[2px]">
              {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
                const { bg, text, label } = getCell(cell.date, cell.inMonth);
                const key = cell.inMonth ? dateKey(viewYear, viewMonth, cell.date) : null;
                const past = cell.inMonth && isPastDate(viewYear, viewMonth, cell.date);
                return (
                  <button
                    key={colIdx}
                    type="button"
                    data-daykey={key ?? undefined}
                    onPointerDown={key ? onCellPointerDown(key) : undefined}
                    disabled={!cell.inMonth || !isSelfSelected || past}
                    className="flex size-[49px] touch-none select-none flex-col items-center justify-center rounded-[12px]"
                    style={{ backgroundColor: bg, opacity: past ? 0.4 : 1 }}
                  >
                    <span className="text-[13px] font-medium tracking-[0.08px]" style={{ color: text }}>
                      {cell.date}
                    </span>
                    {label && (
                      <span className="text-[9px] font-light uppercase tracking-[1.26px]" style={{ color: text }}>
                        {label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-[8px] px-[24px] pt-[16px]">
          {isSelfSelected ? (
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

        {/* Save button (self) / view-only placeholder (friend) */}
        <div className="px-[24px] pt-[20px]">
          {isSelfSelected ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={
                justSaved && !saving
                  ? "flex h-[48px] w-full items-center justify-center gap-[6px] rounded-[14px] bg-[#2e8b5c] text-[14px] font-medium tracking-[0.14px] text-white transition-colors"
                  : "flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#14110d] text-[14px] font-medium tracking-[0.14px] text-[#f7f5f0] transition-colors disabled:opacity-50"
              }
            >
              {saving ? (
                "กำลังบันทึก..."
              ) : justSaved ? (
                <>
                  บันทึกเรียบร้อย
                  <CheckBadge />
                </>
              ) : (
                "บันทึกวันว่าง"
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex h-[48px] w-full cursor-not-allowed items-center justify-center rounded-[14px] border border-[#e5e1d7] bg-white text-[14px] font-medium tracking-[0.14px] text-[#b5b0a4]"
            >
              สำหรับดูเท่านั้น
            </button>
          )}
        </div>
      </div>

      <MemberBottomNav active="availability" tripId={tripId} />
    </main>
  );
}
