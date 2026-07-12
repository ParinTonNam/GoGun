"use client";

import { useState } from "react";

export function NotificationToggle({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-label={on ? "ปิดการแจ้งเตือน" : "เปิดการแจ้งเตือน"}
      className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-[#e85a2c]" : "bg-[#d4cfc2]"}`}
    >
      <div
        className={`absolute top-[2px] size-[22px] rounded-full bg-white shadow-sm transition-all duration-200 ${on ? "left-[18px]" : "left-[2px]"}`}
      />
    </button>
  );
}
