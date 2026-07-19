"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { PageHeader } from "@/components/page-header";
import { getMe, type User } from "@/lib/api";
import { TRIP_TEMPLATES, TEMPLATE_FILTERS, type TemplateFilter } from "@/lib/trip-templates";

export default function RecommendPage() {
  const [active, setActive] = useState<TemplateFilter>("ทั้งหมด");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // หน้านี้เปิดดูได้โดยไม่ล็อกอิน — getMe ใช้แค่โชว์ avatar บน header
    // พลาดก็ปล่อยผ่าน (token หมดอายุ api client จะ redirect ไป /login ให้เอง)
    getMe().then(setUser).catch(() => {});
  }, []);

  const filtered = active === "ทั้งหมด"
    ? TRIP_TEMPLATES
    : TRIP_TEMPLATES.filter((t) => t.tags.includes(active));

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="w-full max-w-[420px] pb-[96px]">
        <div className="flex flex-col gap-[24px] px-[24px] pb-[30px] pt-[24px]">

          {/* Header */}
          <PageHeader user={user} />

          {/* Title */}
          <h1 className="text-[28px] font-medium leading-[30.8px] tracking-[-0.28px] text-[#14110d]">
            ทริปแนะนำ
          </h1>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-[8px]">
            {TEMPLATE_FILTERS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setActive(label)}
                className={`flex shrink-0 items-center rounded-full px-[16px] py-[7px] text-[12px] font-light tracking-[0.08px] transition-colors ${
                  active === label
                    ? "border border-[#14110d] bg-[#14110d] text-[#f7f5f0]"
                    : "border border-[#e5e1d7] bg-white text-[#14110d]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Trip list */}
          <div className="flex flex-col gap-[8px]">
            {filtered.length === 0 ? (
              <p className="py-[24px] text-center text-[13px] font-light text-[#767168]">ไม่มีทริปในหมวดนี้</p>
            ) : (
              filtered.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/recommend/${trip.id}`}
                  className="flex items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[15px] py-[13px]"
                >
                  <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fcede3]">
                    <span className="text-[16px]">{trip.emoji}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-[2px]">
                    <p className="text-[13.5px] font-medium leading-[16.875px] tracking-[0.08px] text-[#14110d]">
                      {trip.name}
                    </p>
                    <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">
                      {trip.meta}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center justify-center rounded-[9px] bg-[#14110d] px-[14px] py-[7px]">
                    <span className="text-[12px] font-medium text-[#f7f5f0]">ดู</span>
                  </span>
                </Link>
              ))
            )}
          </div>

        </div>
      </div>
      <BottomNav active="recommend" />
    </main>
  );
}
