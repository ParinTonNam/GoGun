"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOptionalTripWorkspace } from "@/components/trip-workspace";

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
  const workspace = useOptionalTripWorkspace();

  return (
    <div className="flex flex-col">
      {/* Logo strip + profile chip */}
      {!workspace && <div className="app-page-brand-row flex items-center justify-between gap-3">
        <div className="app-page-brand flex items-center gap-[8px]">
          <img src="/images/logo.svg" alt="" className="size-[24px]" />
          <p className="text-[16px] font-semibold text-[#14110d]">GoGun · ไปกัน</p>
        </div>
        {user && (
          <Link href="/profile" aria-label={`โปรไฟล์ ${user.display_name}`} className="flex min-h-[44px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white px-[10px] py-[7px]">
            <span
              className="flex size-[22px] items-center justify-center rounded-[31px] text-[12px] font-medium text-white"
              style={{ backgroundColor: user.avatar_color }}
            >
              {user.display_name.trim().slice(0, 1)}
            </span>
            <span className="text-[14px] font-medium text-[#14110d]" data-user-content>
              {user.display_name}
            </span>
          </Link>
        )}
      </div>}

      {/* Page title */}
      {title && (
      <div className="flex flex-col gap-[6px] pb-[14px] pt-[20px]">
        <div className="flex items-center gap-[12px]">
          {backHref && (
            <button
              type="button"
              onClick={() => router.push(backHref)}
              aria-label="ย้อนกลับ"
              className="flex size-[44px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
            >
              <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px] object-contain" />
            </button>
          )}
          <h1 className="min-w-0 flex-1 break-words text-[26px] font-medium tracking-[0.08px] text-[#14110d]">{title}</h1>
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
