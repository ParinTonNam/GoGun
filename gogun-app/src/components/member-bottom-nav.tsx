"use client";

import Link from "next/link";

export type MemberTab = "trip" | "availability" | "wallet" | "tools";

// Converts any dark SVG to orange #e85a2c or gray #767168
const TO_ORANGE = "brightness(0) saturate(100%) invert(44%) sepia(76%) saturate(575%) hue-rotate(339deg) brightness(106%) contrast(97%)";
const TO_GRAY   = "brightness(0) saturate(100%) invert(47%) sepia(6%) saturate(350%) hue-rotate(15deg) brightness(90%)";

const TABS: { id: MemberTab; label: string; icon: string }[] = [
  { id: "trip",         label: "ทริป",         icon: "/images/icon-tab-trip.svg"     },
  { id: "availability", label: "วันว่าง",      icon: "/images/icon-tab-calendar.svg" },
  { id: "wallet",       label: "บัญชี",        icon: "/images/icon-tab-wallet.svg"   },
  { id: "tools",        label: "อุปกรณ์เสริม", icon: "/images/icon-tab-tools.svg"   },
];

function tabHref(id: MemberTab, tripId: string) {
  switch (id) {
    case "trip":         return `/trips/${tripId}/member`;
    case "availability": return `/trips/${tripId}/member/availability`;
    case "wallet":       return `/trips/${tripId}/member/wallet`;
    case "tools":        return `/trips/${tripId}/tools`;
  }
}

export function MemberBottomNav({
  active,
  tripId = "demo",
}: {
  active: MemberTab;
  tripId?: string;
}) {
  return (
    <div className="fixed bottom-[13px] left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="mx-[13px] flex h-[62px] items-start justify-center rounded-[18px] border border-[#d4cfc2] bg-white pt-[8px]">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={tabHref(tab.id, tripId)}
              className="flex flex-1 flex-col items-center gap-[3px]"
            >
              <img
                src={tab.icon}
                alt=""
                className="size-[20px] object-contain"
                style={{ filter: isActive ? TO_ORANGE : TO_GRAY }}
              />
              <div className="flex flex-col items-center">
                <span
                  className={`text-[10px] tracking-[0.08px] ${
                    isActive ? "font-medium text-[#14110d]" : "font-light text-[#767168]"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && <div className="mt-[2px] size-[3px] rounded-full bg-[#e85a2c]" />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
