"use client";

import { useState } from "react";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Calendar({
  startDate,
  endDate,
  onSelectDay,
}: {
  startDate: Date | null;
  endDate: Date | null;
  onSelectDay: (day: Date) => void;
}) {
  const initial = startDate ?? new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const viewYear = view.year;
  const viewMonth = view.month;

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  function goPrevMonth() {
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }

  function goNextMonth() {
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  function isInRange(day: Date) {
    if (!startDate || !endDate) return false;
    return day > startDate && day < endDate;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  function isPast(day: Date) {
    return day < today;
  }

  return (
    <div className="flex w-full flex-col gap-[4px] rounded-[16px] border border-[#e5e1d7] bg-white p-[15px]">
      <div className="flex items-center justify-between px-[4px] pb-[8px]">
        <button
          type="button"
          onClick={goPrevMonth}
          aria-label="Previous month"
          className="flex size-[26px] items-center justify-center rounded-[13.5px] border border-[#e5e1d7]"
        >
          <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px]" />
        </button>
        <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">
          {THAI_MONTHS[viewMonth]}
          {viewYear + 543}
        </p>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Next month"
          className="flex size-[26px] items-center justify-center rounded-[13.5px] border border-[#e5e1d7]"
        >
          <img
            src="/images/icon-chevron-left.svg"
            alt=""
            className="h-[10px] w-[6px] rotate-180"
          />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[9px] uppercase tracking-[0.9px] text-[#b5b0a4]">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={i} className="h-[45px] w-full" />;
          }
          const selected = isSameDay(day, startDate) || isSameDay(day, endDate);
          const inRange = isInRange(day);
          const past = isPast(day);
          return (
            <button
              type="button"
              key={i}
              onClick={() => onSelectDay(day)}
              disabled={past}
              className={`h-[45px] w-full rounded-full text-[12px] tracking-[0.08px] ${
                past
                  ? "cursor-not-allowed text-[#d4cfc2] line-through"
                  : selected
                    ? "bg-[#14110d] font-medium text-white"
                    : inRange
                      ? "bg-[#f2efe8] text-[#14110d]"
                      : "text-[#14110d]"
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
