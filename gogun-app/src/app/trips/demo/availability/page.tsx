"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CalVariant = "default" | "uncertain" | "some" | "all" | "out";

type CalDay = {
  n: number;
  v: CalVariant;
  count?: string;
};

const CELLS: CalDay[] = [
  // Row 1
  { n: 31, v: "out" },
  { n: 1, v: "default" },
  { n: 2, v: "default" },
  { n: 3, v: "default" },
  { n: 4, v: "default" },
  { n: 5, v: "default" },
  { n: 6, v: "default" },
  // Row 2
  { n: 7, v: "uncertain" },
  { n: 8, v: "uncertain" },
  { n: 9, v: "default", count: "1/4" },
  { n: 10, v: "default", count: "1/4" },
  { n: 11, v: "default", count: "1/4" },
  { n: 12, v: "default" },
  { n: 13, v: "uncertain" },
  // Row 3
  { n: 14, v: "all" },
  { n: 15, v: "all" },
  { n: 16, v: "all" },
  { n: 17, v: "default" },
  { n: 18, v: "default" },
  { n: 19, v: "default" },
  { n: 20, v: "all" },
  // Row 4
  { n: 21, v: "some", count: "2/4" },
  { n: 22, v: "some", count: "2/4" },
  { n: 23, v: "some", count: "2/4" },
  { n: 24, v: "some", count: "2/4" },
  { n: 25, v: "uncertain", count: "1/4" },
  { n: 26, v: "default", count: "1/4" },
  { n: 27, v: "default", count: "1/4" },
  // Row 5
  { n: 28, v: "uncertain" },
  { n: 29, v: "default" },
  { n: 30, v: "default" },
  { n: 1, v: "out" },
  { n: 2, v: "out" },
  { n: 3, v: "out" },
  { n: 4, v: "out" },
];

const CYCLE: Record<CalVariant, CalVariant> = {
  default: "some",
  some: "uncertain",
  uncertain: "default",
  all: "uncertain",
  out: "out",
};

const STYLE: Record<CalVariant, { bg: string; text: string; sub: string }> = {
  default: { bg: "#f2efe8", text: "#14110d", sub: "#767168" },
  uncertain: { bg: "#faefcb", text: "#d9a21b", sub: "#d9a21b" },
  some: { bg: "#e0f0e5", text: "#2e8b5c", sub: "#2e8b5c" },
  all: { bg: "#2e8b5c", text: "#ffffff", sub: "#ffffff" },
  out: { bg: "transparent", text: "#767168", sub: "#767168" },
};

const WEEK_HEADERS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const MEMBERS = [
  { key: "ton", name: "ต้นน้ำ", initial: "ต", color: "#c44211" },
  { key: "james", name: "เจมส์", initial: "จ", color: "#4f6e7a" },
  { key: "nai", name: "นาย", initial: "น", color: "#7b8b57" },
  { key: "atif", name: "อาตีฟ", initial: "อ", color: "#8a6e9e" },
];

// Nov 2026: Nov 1 = Sunday → no leading blanks, 30 days in 5 rows
const NOV_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

type ConfirmOption = "preset-nov" | "preset-dec" | "custom" | null;

function ConfirmDateSheet({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [selected, setSelected] = useState<ConfirmOption>(null);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);

  const customReady = rangeStart !== null && rangeEnd !== null;
  const canConfirm =
    selected === "preset-nov" ||
    selected === "preset-dec" ||
    (selected === "custom" && customReady);

  function handleDayTap(n: number) {
    if (rangeStart === null || rangeEnd !== null) {
      setRangeStart(n);
      setRangeEnd(null);
    } else if (n >= rangeStart) {
      setRangeEnd(n);
    } else {
      setRangeStart(n);
      setRangeEnd(null);
    }
  }

  function dayBg(n: number): string {
    if (rangeStart !== null && rangeEnd === null && n === rangeStart) return "#e85a2c";
    if (rangeStart !== null && rangeEnd !== null) {
      if (n === rangeStart || n === rangeEnd) return "#e85a2c";
      if (n > rangeStart && n < rangeEnd) return "#fcede3";
    }
    return "transparent";
  }

  function dayColor(n: number): string {
    if (rangeStart !== null && rangeEnd === null && n === rangeStart) return "#ffffff";
    if (rangeStart !== null && rangeEnd !== null) {
      if (n === rangeStart || n === rangeEnd) return "#ffffff";
      if (n > rangeStart && n < rangeEnd) return "#e85a2c";
    }
    return "#14110d";
  }

  function dayRounded(n: number): string {
    if (rangeStart === null || rangeEnd === null) return "";
    if (n === rangeStart && n === rangeEnd) return "rounded-[5px]";
    if (n === rangeStart) return "rounded-l-[5px]";
    if (n === rangeEnd) return "rounded-r-[5px]";
    return "";
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[420px] -translate-x-1/2 overflow-hidden rounded-tl-[25px] rounded-tr-[25px] bg-[#f7f5f0] shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
      {/* Drag handle */}
      <div className="flex justify-center pt-[10px]">
        <div className="h-[4px] w-[36px] rounded-[2px] bg-[#d4cfc2]" />
      </div>

      {/* Scrollable body */}
      <div className="flex max-h-[88vh] flex-col gap-[10px] overflow-y-auto px-[20px] pb-[36px] pt-[20px]">
        {/* Header */}
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

        {/* Option: 14–16 พ.ย. */}
        <button
          type="button"
          onClick={() => setSelected("preset-nov")}
          className="flex shrink-0 items-center justify-between rounded-[18px] bg-white px-[20px] py-[15px]"
          style={{
            border:
              selected === "preset-nov"
                ? "2px solid #c1440e"
                : "1px solid #e5e1d7",
          }}
        >
          <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">14–16 พ.ย.</p>
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
            ที่ว่างพร้อมกันทุกคน
          </p>
        </button>

        {/* Option: 1-5 ธ.ค. */}
        <button
          type="button"
          onClick={() => setSelected("preset-dec")}
          className="flex shrink-0 items-center justify-between rounded-[18px] bg-white px-[20px] py-[15px]"
          style={{
            border:
              selected === "preset-dec"
                ? "2px solid #c1440e"
                : "1px solid #e5e1d7",
          }}
        >
          <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">1-5 ธ.ค.</p>
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
            ที่ว่างพร้อมกันทุกคน
          </p>
        </button>

        {/* Option: เลือกด้วยตัวเอง */}
        {selected !== "custom" ? (
          <button
            type="button"
            onClick={() => setSelected("custom")}
            className="flex shrink-0 items-center rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]"
          >
            <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
              เลือกด้วยตัวเอง
            </p>
          </button>
        ) : (
          <div className="shrink-0 rounded-[16px] border-2 border-[#c1440e] bg-white p-[15px]">
            <p className="mb-[10px] text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
              เลือกด้วยตัวเอง
            </p>

            {/* Month nav */}
            <div className="flex items-center justify-between px-[4px] pb-[8px]">
              <button
                type="button"
                className="flex size-[26px] items-center justify-center rounded-[13px] border border-[#e5e1d7]"
              >
                <img src="/images/icon-chevron-left.svg" alt="" className="size-[10px]" />
              </button>
              <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">
                พ.ย.2569
              </p>
              <button
                type="button"
                className="flex size-[26px] items-center justify-center rounded-[13px] border border-[#e5e1d7]"
              >
                <img
                  src="/images/icon-chevron-left.svg"
                  alt=""
                  className="size-[10px] rotate-180"
                />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-x-[2px]">
              {WEEK_HEADERS.map((h) => (
                <div key={h} className="flex h-[24px] items-center justify-center">
                  <p className="text-[9px] font-light uppercase tracking-[0.9px] text-[#b5b0a4]">
                    {h}
                  </p>
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-x-[2px] gap-y-px py-px">
              {NOV_DAYS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDayTap(n)}
                  className={`flex h-[45px] items-center justify-center text-[12px] font-light ${dayRounded(n)}`}
                  style={{ backgroundColor: dayBg(n), color: dayColor(n) }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm button */}
        <button
          type="button"
          onClick={canConfirm ? onConfirm : undefined}
          className="flex h-[48px] w-full shrink-0 items-center justify-center rounded-[14px] bg-[#14110d] text-[14px] font-medium tracking-[0.14px] text-[#f7f5f0] transition-opacity"
          style={{ opacity: canConfirm ? 1 : 0.4 }}
        >
          ยืนยันวันไป
        </button>

        {/* Disclaimer */}
        <p className="shrink-0 text-[11px] tracking-[0.08px] text-[#767168]">
          * สามารถเปลี่ยนวันที่ภายหลังได้
        </p>
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [activeMember, setActiveMember] = useState("ton");
  const [overrides, setOverrides] = useState<Record<string, CalVariant>>({});
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);

  function getVariant(cell: CalDay): CalVariant {
    if (cell.v === "out") return "out";
    const key = `${cell.n}`;
    return overrides[key] ?? cell.v;
  }

  function getCount(cell: CalDay, v: CalVariant): string | undefined {
    if (v === "all") return undefined;
    if (v === "some") return overrides[`${cell.n}`] ? "1/4" : cell.count;
    return cell.count;
  }

  function handleDayClick(cell: CalDay) {
    if (cell.v === "out") return;
    const key = `${cell.n}`;
    const current = overrides[key] ?? cell.v;
    setOverrides((prev) => ({ ...prev, [key]: CYCLE[current] }));
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[30px] pt-[65px]">
        {/* Header */}
        <div className="flex items-center gap-[12px] pb-[18px] pt-[4px] px-[20px]">
          <button
            type="button"
            onClick={() => router.push("/trips/demo")}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="size-[14px]" />
          </button>
          <p className="flex-1 text-[22px] font-medium tracking-[0.08px] text-[#14110d]">
            เทียบวันว่าง
          </p>
        </div>

        <div className="flex flex-col gap-[20px]">
          {/* Member filter pills */}
          <div className="flex flex-col gap-[10px] px-[24px]">
            <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ใครเลือกอยู่</p>
            <div className="flex flex-wrap gap-[5px]">
              {MEMBERS.map((m) => {
                const isActive = activeMember === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setActiveMember(m.key)}
                    className="flex h-[33px] items-center gap-[8px] rounded-[48px] border p-[7px]"
                    style={{
                      backgroundColor: isActive ? "#14110d" : "#ffffff",
                      borderColor: isActive ? "#14110d" : "#e5e1d7",
                    }}
                  >
                    <span
                      className="flex size-[22px] items-center justify-center rounded-[31px] text-[12px] font-medium text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.initial}
                    </span>
                    <span
                      className="text-[12px] font-medium tracking-[0.08px]"
                      style={{ color: isActive ? "#ffffff" : "#14110d" }}
                    >
                      {m.name}
                    </span>
                    {m.key === "ton" && (
                      <span className="text-[10px] font-light tracking-[0.08px] text-[#c44211]">
                        YOU
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar */}
          <div className="flex flex-col gap-[2px] px-[24px]">
            {/* Month header */}
            <div className="flex h-[36px] items-center justify-between">
              <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">
                พ.ย. 2569
              </p>
              <div className="flex items-center gap-[5px]">
                <button
                  type="button"
                  className="flex size-[36px] items-center justify-center rounded-full border border-[#e5e1d7] bg-white"
                >
                  <img src="/images/icon-chevron-left.svg" alt="" className="size-[14px]" />
                </button>
                <button
                  type="button"
                  className="flex size-[36px] items-center justify-center rounded-full border border-[#e5e1d7] bg-white"
                >
                  <img
                    src="/images/icon-chevron-left.svg"
                    alt=""
                    className="size-[14px] rotate-180"
                  />
                </button>
              </div>
            </div>

            {/* Day-of-week headers */}
            <div className="flex gap-[2px]">
              {WEEK_HEADERS.map((h) => (
                <div
                  key={h}
                  className="flex size-[49px] items-center justify-center rounded-[12px]"
                >
                  <p className="text-[13px] font-medium text-[#767168]">{h}</p>
                </div>
              ))}
            </div>

            {/* Day cells — 5 rows of 7 */}
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex gap-[2px]">
                {CELLS.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
                  const v = getVariant(cell);
                  const count = getCount(cell, v);
                  const s = STYLE[v];
                  const isOut = v === "out";

                  return (
                    <button
                      key={colIdx}
                      type="button"
                      onClick={() => handleDayClick(cell)}
                      disabled={isOut}
                      className="flex size-[49px] shrink-0 flex-col items-center justify-center rounded-[12px]"
                      style={{ backgroundColor: s.bg }}
                    >
                      <span
                        className="text-[13px] font-medium tracking-[0.08px]"
                        style={{ color: s.text }}
                      >
                        {cell.n}
                      </span>
                      {v === "all" ? (
                        <span className="text-[9px] uppercase" style={{ color: s.sub }}>
                          ทุกคน
                        </span>
                      ) : count ? (
                        <span
                          className="text-[9px] uppercase tracking-[1.26px]"
                          style={{ color: s.sub }}
                        >
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-[11px] px-[40px]">
            <div className="flex flex-wrap items-center gap-[14px]">
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                แตะวันเพื่อสลับ:
              </p>
              <div className="flex items-center gap-[8px]">
                <div className="size-[20px] rounded-[3px] bg-[#f2efe8]" />
                <p className="text-[12px] font-light tracking-[0.08px] text-[#14110d]">ไม่ว่าง</p>
              </div>
              <p className="text-[12px] text-black">→</p>
              <div className="flex items-center gap-[8px]">
                <div className="size-[20px] rounded-[3px] bg-[#e0f0e5]" />
                <p className="text-[12px] font-light tracking-[0.08px] text-[#2e8b5c]">ว่าง</p>
              </div>
              <p className="text-[12px] text-black">→</p>
              <div className="flex items-center gap-[8px]">
                <div className="size-[20px] rounded-[3px] bg-[#faefcb]" />
                <p className="text-[12px] font-light tracking-[0.08px] text-[#d9a21b]">ไม่แน่ใจ</p>
              </div>
            </div>
            <div className="flex items-center gap-[8px]">
              <p className="text-[12px] font-light text-[#767168]">1/4</p>
              <p className="text-[12px] font-light text-black">หมายถึงในวันนั้นมีคนว่าง 1 คน</p>
            </div>
            <div className="flex items-center gap-[8px]">
              <div className="size-[20px] shrink-0 rounded-[3px] bg-[#2e8b5c]" />
              <p className="text-[12px] font-light text-black">หมายถึงทุกคนว่างตรงกัน</p>
            </div>
          </div>

          {/* Summary + confirm */}
          <div className="flex flex-col gap-[10px] px-[24px]">
            <div className="flex items-center gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]">
              <div className="flex flex-1 flex-col gap-[5px]">
                <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                  มี 3 วัน
                </p>
                <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                  ที่ว่างพร้อมกันทุกคน
                </p>
              </div>
              <div className="flex flex-col items-end gap-[5px]">
                <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">แนะนำ</p>
                <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                  14–16 พ.ย.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmSheet(true)}
              className="flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#14110d] text-[14px] font-medium tracking-[0.14px] text-[#f7f5f0]"
            >
              ยืนยันวันไป
            </button>
          </div>
        </div>
      </div>

      {/* Confirm date bottom sheet */}
      {showConfirmSheet && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black/30"
            onClick={() => setShowConfirmSheet(false)}
          />
          <ConfirmDateSheet
            onClose={() => setShowConfirmSheet(false)}
            onConfirm={() => {
              setShowConfirmSheet(false);
              router.push("/trips/demo");
            }}
          />
        </>
      )}
    </main>
  );
}
