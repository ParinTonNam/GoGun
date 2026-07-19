"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type HeaderUser = { display_name: string; avatar_color: string };

// Mock user for /trips/demo pages, matching the demo dashboard chip
export const DEMO_USER: HeaderUser = { display_name: "ต้นน้ำ", avatar_color: "#c0613e" };

export function PageHeader({
  title,
  subtitle,
  backHref,
  user,
  right,
}: {
  title?: string;
  subtitle?: string;
  backHref?: string;
  user?: HeaderUser | null;
  right?: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col">
      {/* Logo strip + profile chip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <img src="/images/logo.svg" alt="" className="size-[19px]" />
          <p className="text-[11px] tracking-[0.08px] text-[#767168]">GOGUN</p>
          <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ไปกัน</p>
        </div>
        {user && (
          <div className="flex h-[33px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white p-[7px]">
            <span
              className="flex size-[22px] items-center justify-center rounded-[31px] text-[12px] font-medium text-white"
              style={{ backgroundColor: user.avatar_color }}
            >
              {user.display_name.trim().slice(0, 1)}
            </span>
            <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
              {user.display_name}
            </span>
          </div>
        )}
      </div>

      {/* Page title */}
      {title && (
      <div className="flex flex-col gap-[6px] pb-[14px] pt-[20px]">
        <div className="flex items-center gap-[12px]">
          {backHref && (
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
            >
              <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px] object-contain" />
            </button>
          )}
          <p className="flex-1 text-[26px] font-medium tracking-[0.08px] text-[#14110d]">{title}</p>
          {right}
        </div>
        {subtitle && (
          <p className={`text-[12px] font-light tracking-[0.08px] text-[#767168] ${backHref ? "pl-[48px]" : ""}`}>
            {subtitle}
          </p>
        )}
      </div>
      )}
    </div>
  );
}
