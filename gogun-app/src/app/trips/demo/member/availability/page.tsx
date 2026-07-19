"use client";

import { useState } from "react";
import { MemberBottomNav } from "@/components/member-bottom-nav";
import { PageHeader, DEMO_USER } from "@/components/page-header";

// ─── types ────────────────────────────────────────────────────────────────────
type Status = "none" | "available" | "maybe"; // current user's own status
type MemberId = "ton" | "james" | "nai" | "atif";

const MEMBER_INFO: Record<MemberId, { initial: string; color: string; name: string }> = {
  ton:   { initial: "ต", color: "#c0613e", name: "ต้นน้ำ" },
  james: { initial: "จ", color: "#4f6e7a", name: "เจมส์" },
  nai:   { initial: "น", color: "#7b8b57", name: "นาย" },
  atif:  { initial: "อ", color: "#8a6e9e", name: "อาตีฟ" },
};
const MEMBERS = Object.keys(MEMBER_INFO) as MemberId[];

// Other members' available days for Nov 2026 (1-indexed)
const OTHERS_AVAILABLE: Record<"james" | "nai" | "atif", Set<number>> = {
  james: new Set([14, 15, 16, 20]),
  nai:   new Set([14, 15, 16, 20, 21, 22, 23, 24]),
  atif:  new Set([14, 15, 16, 20, 21, 22, 23, 24]),
};

// Current user (ต้นน้ำ) initial status for Nov 2026
const TON_INITIAL: Record<number, Status> = {
  7: "maybe", 8: "maybe", 13: "maybe", 25: "maybe", 28: "maybe",
  14: "available", 15: "available", 16: "available",
  17: "available", 18: "available", 19: "available",
  20: "available", 21: "available", 22: "available", 23: "available", 24: "available",
};

// ─── calendar helpers ─────────────────────────────────────────────────────────
const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
const THAI_YEAR_OFFSET = 543;
const DAY_HEADERS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function buildGrid(year: number, month: number): Array<{ date: number; inMonth: boolean }> {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { date: number; inMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: daysInPrev - i, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: d, inMonth: true });
  }
  const remaining = 7 - (cells.length % 7 === 0 ? 7 : cells.length % 7);
  for (let d = 1; d <= remaining && remaining < 7; d++) {
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}

function computeCell(
  date: number,
  inMonth: boolean,
  tonStatus: Status,
  isNov2026: boolean,
) {
  if (!inMonth) return { bg: "transparent", text: "#b5b0a4", label: null };

  const othersCount = isNov2026
    ? (["james", "nai", "atif"] as const).filter((m) => OTHERS_AVAILABLE[m].has(date)).length
    : 0;
  const tonAvail = tonStatus === "available" ? 1 : 0;
  const total = tonAvail + othersCount; // out of 4

  if (total === 4) {
    return { bg: "#2e8b5c", text: "white", label: "ทุกคน" };
  }
  if (total >= 2) {
    return { bg: "#e0f0e5", text: "#2e8b5c", label: `${total}/4` };
  }
  if (total === 1) {
    return { bg: "#f2efe8", text: "#14110d", label: "1/4" };
  }
  if (tonStatus === "maybe") {
    return { bg: "#faefcb", text: "#d9a21b", label: null };
  }
  return { bg: "#f2efe8", text: "#14110d", label: null };
}

const STATUS_CYCLE: Status[] = ["none", "available", "maybe"];


// ─── component ────────────────────────────────────────────────────────────────
export default function MemberAvailabilityPage() {

  // Viewing month (0-indexed)
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10); // November = 10

  // Which member's availability is currently shown
  const [viewingMember, setViewingMember] = useState<MemberId>("ton");

  // Ton's status per day-key "YYYY-MM-DD"
  const [tonStatus, setTonStatus] = useState<Record<string, Status>>(() => {
    const init: Record<string, Status> = {};
    Object.entries(TON_INITIAL).forEach(([d, s]) => {
      init[`2026-11-${String(d).padStart(2, "0")}`] = s;
    });
    return init;
  });

  const isNov2026 = viewYear === 2026 && viewMonth === 10;

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  function toggleDay(date: number, inMonth: boolean) {
    if (!inMonth || viewingMember !== "ton") return;
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    setTonStatus((prev) => {
      const cur = prev[key] ?? "none";
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
      return { ...prev, [key]: next };
    });
  }

  function getMemberStatus(id: MemberId, date: number): Status {
    if (id === "ton") {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      return tonStatus[key] ?? "none";
    }
    if (isNov2026) return OTHERS_AVAILABLE[id as "james" | "nai" | "atif"].has(date) ? "available" : "none";
    return "none";
  }

  const grid = buildGrid(viewYear, viewMonth);

  // Summary for current month
  const allDays4 = isNov2026
    ? [14, 15, 16].filter((d) => {
        const key = `2026-11-${String(d).padStart(2, "0")}`;
        return (tonStatus[key] ?? "none") === "available";
      }).length === 3
    : false;

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[96px] pt-[24px]">

        {/* Header */}
        <div className="px-[24px]">
          <PageHeader user={DEMO_USER} />
        </div>

        {/* Title + subtitle */}
        <div className="flex flex-col gap-[8px] px-[24px] pt-[20px]">
          <p className="text-[26px] font-medium tracking-[0.08px] text-[#14110d]">เทียบวันว่าง</p>
          <div className="flex items-center gap-[5px] text-[13px] tracking-[0.08px]">
            <span className="text-[#767168]">4/4 คนเลือกแล้ว</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">ทุกคนว่าง 14–16 พ.ย.</span>
          </div>
        </div>

        {/* Member filter pills */}
        <div className="flex flex-col gap-[10px] px-[24px] pt-[20px]">
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ใครเลือกอยู่</p>
          <div className="flex flex-wrap gap-[5px]">
            {MEMBERS.map((id) => {
              const m = MEMBER_INFO[id];
              const isSelected = viewingMember === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewingMember(id)}
                  className={`flex h-[33px] items-center gap-[8px] rounded-[48px] border p-[7px] ${
                    isSelected ? "border-[#14110d] bg-[#14110d]" : "border-[#e5e1d7] bg-white"
                  }`}
                >
                  <div
                    className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[12px] font-medium text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initial}
                  </div>
                  <span
                    className={`text-[12px] font-medium tracking-[0.08px] ${
                      isSelected ? "text-white" : "text-[#14110d]"
                    }`}
                  >
                    {m.name}
                  </span>
                  {id === "ton" && (
                    <span className={`text-[10px] font-light tracking-[0.08px] ${isSelected ? "text-[#e85a2c]" : "text-[#767168]"}`}>
                      YOU
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar */}
        <div className="px-[10px] pt-[20px]">
          {/* Month header */}
          <div className="flex items-center justify-between px-[14px] pb-[4px]">
            <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">
              {THAI_MONTHS[viewMonth]} {viewYear + THAI_YEAR_OFFSET}
            </p>
            <div className="flex items-center gap-[5px]">
              <button
                type="button"
                onClick={prevMonth}
                className="flex size-[36px] items-center justify-center"
              >
                <img src="/images/icon-cal-prev.svg" alt="ก่อนหน้า" className="size-[36px]" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="flex size-[36px] items-center justify-center"
              >
                <img src="/images/icon-cal-next.svg" alt="ถัดไป" className="size-[36px]" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-[2px]">
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className="flex h-[49px] w-full items-center justify-center text-[13px] font-medium tracking-[0.08px] text-[#767168]"
              >
                {d}
              </div>
            ))}

            {/* Day cells */}
            {grid.map((cell, idx) => {
              const status = getMemberStatus(viewingMember, cell.date);
              const { bg, text, label } = viewingMember === "ton"
                ? computeCell(cell.date, cell.inMonth, status, isNov2026)
                : !cell.inMonth
                  ? { bg: "transparent", text: "#b5b0a4", label: null }
                  : status === "available"
                    ? { bg: "#e0f0e5", text: "#2e8b5c", label: null }
                    : { bg: "transparent", text: "#14110d", label: null };

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(cell.date, cell.inMonth)}
                  disabled={!cell.inMonth || viewingMember !== "ton"}
                  className="flex h-[49px] w-full flex-col items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: bg }}
                >
                  <span
                    className="text-[13px] font-medium tracking-[0.08px]"
                    style={{ color: text }}
                  >
                    {cell.date}
                  </span>
                  {label && (
                    <span
                      className="text-[9px] font-light uppercase tracking-[1.26px]"
                      style={{ color: text }}
                    >
                      {label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary card */}
        {isNov2026 && (
          <div className="mx-[24px] mt-[20px] flex items-center gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]">
            <div className="flex flex-1 flex-col gap-[5px]">
              <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">มี 3 วัน</p>
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                ที่ว่างพร้อมกันทุกคน
              </p>
            </div>
            <div className="flex flex-col items-end gap-[5px]">
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">แนะนำ</p>
              <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">14–16 พ.ย.</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-col gap-[8px] px-[24px] pt-[20px]">
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
          <div className="flex items-center gap-[8px] text-[12px] font-light tracking-[0.08px] text-[#767168]">
            <span className="font-medium text-[#767168]">1/4</span>
            <span>หมายถึงในวันนั้นมีคนว่าง 1 คน</span>
          </div>
          <div className="flex items-center gap-[8px] text-[12px] font-light tracking-[0.08px]">
            <span className="size-[14px] shrink-0 rounded-[3px] bg-[#2e8b5c]" />
            <span className="text-[#14110d]">หมายถึงทุกคนว่างตรงกัน</span>
          </div>
        </div>
      </div>

      <MemberBottomNav active="availability" />
    </main>
  );
}
