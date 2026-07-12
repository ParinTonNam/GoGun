"use client";

import { useState } from "react";
import {
  DESTINATIONS,
  formatThaiShortDate,
  slugify,
  type TripFormData,
} from "@/lib/trip";

const SHARE_TARGETS: { key: string; label: string; bg: string; icon?: string }[] = [
  { key: "line", label: "LINE", bg: "#06c755", icon: "/images/icon-line.svg" },
  {
    key: "messenger",
    label: "Messenger",
    bg: "#1877f2",
    icon: "/images/icon-messenger.svg",
  },
  { key: "more", label: "More", bg: "#14110d" },
  { key: "qr", label: "QR", bg: "#e85a2c" },
];

export function FinishScreen({
  formData,
  onManageTrip,
}: {
  formData: TripFormData;
  onManageTrip: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const selectedDestinations = DESTINATIONS.filter((d) =>
    formData.destinationCodes.includes(d.code),
  );
  const primaryDestination = selectedDestinations[0]?.name ?? "";
  const tripLabel = [formData.name || "ทริปใหม่", primaryDestination]
    .filter(Boolean)
    .join(" · ");

  const dateRange =
    formData.startDate && formData.endDate
      ? `${formatThaiShortDate(formData.startDate)} – ${formatThaiShortDate(formData.endDate)}`
      : formData.startDate
        ? formatThaiShortDate(formData.startDate)
        : null;
  const summaryLine = [dateRange, `${formData.members.length} คน`]
    .filter(Boolean)
    .join(" · ");

  const slugSource = selectedDestinations.length
    ? selectedDestinations
        .flatMap((d) => d.cities.split(" · "))
        .slice(0, 2)
        .join("-")
    : formData.name;
  const slug = slugify(slugSource) || "trip";
  const inviteLink = `gogun.app/t/${slug}-x${formData.members.length}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${inviteLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: `https://${inviteLink}`, title: tripLabel });
        return;
      } catch {
        // user cancelled or share failed; fall through to copy
      }
    }
    copyLink();
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-[8px] px-[32px]">
      <div className="flex flex-col items-center pb-[16px]">
        <div className="flex size-[88px] items-center justify-center rounded-[44px] bg-[#e85a2c]">
          <img src="/images/icon-check.svg" alt="" className="size-[40px]" />
        </div>
      </div>
      <p className="text-center text-[26px] font-medium tracking-[-0.26px] text-[#14110d]">
        เปิดทริปสำเร็จ
      </p>
      <div className="flex flex-col items-center pb-[20px] text-center text-[13.5px] leading-[21.6px] tracking-[0.08px] text-[#767168]">
        <p>{tripLabel}</p>
        <p>{summaryLine}</p>
      </div>
      <div className="flex w-full flex-col gap-[10px] pb-[8px]">
        <div className="flex w-full flex-col gap-[10px] rounded-[18px] border border-[#e5e1d7] bg-white p-[19px]">
          <p className="text-[10px] uppercase text-[#767168]">ลิงก์เชิญเพื่อน</p>
          <div className="flex w-full items-center gap-[10px] rounded-[12px] bg-[#f2efe8] px-[14px] py-[12px]">
            <p className="flex-1 truncate text-[12.5px] tracking-[0.08px] text-[#14110d]">
              {inviteLink}
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 rounded-[8px] bg-[#14110d] px-[12px] py-[7px] text-[12px] font-medium text-[#f7f5f0]"
            >
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </button>
          </div>
          <div className="flex w-full gap-[8px]">
            {SHARE_TARGETS.map((target) => (
              <button
                type="button"
                key={target.key}
                onClick={share}
                className="flex flex-1 flex-col items-center gap-[6px] rounded-[12px] bg-[#f2efe8] px-[10px] py-[10px]"
              >
                <span
                  className="flex size-[36px] items-center justify-center rounded-[18px]"
                  style={{ backgroundColor: target.bg }}
                >
                  {target.icon ? (
                    <img src={target.icon} alt="" className="size-[20px]" />
                  ) : (
                    <span className="size-[10px] rounded-full border-2 border-white" />
                  )}
                </span>
                <span className="text-[10.5px] tracking-[0.21px] text-[#767168]">
                  {target.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onManageTrip}
        className="flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#14110d] text-[14px] font-medium tracking-[0.14px] text-[#f7f5f0]"
      >
        จัดการทริป
      </button>
    </div>
  );
}
