"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

const FILTERS = ["ทั้งหมด", "มาแรงช่วงนี้", "1 เดย์ทริป", "ทริปใหญ่ก๊วนเพื่อน", "ทริปต่างประเทศ"] as const;
type Filter = typeof FILTERS[number];

const TRIPS = [
  { id: "camping",   name: "กางเต็นท์เก็บหอย",            dates: "21–22 Jun 2026",        tags: ["มาแรงช่วงนี้", "1 เดย์ทริป"] },
  { id: "samet",     name: "ไปเที่ยวเกาะเสม็ด",            dates: "4–6 May 2026",          tags: ["มาแรงช่วงนี้", "ทริปใหญ่ก๊วนเพื่อน"] },
  { id: "chiangmai", name: "ไปท่องเที่ยวเชียงใหม่",         dates: "15–20 June 2026",       tags: ["มาแรงช่วงนี้", "ทริปใหญ่ก๊วนเพื่อน"] },
  { id: "khaoyai",   name: "สัมผัสธรรมชาติที่เขาใหญ่",      dates: "10–14 July 2026",       tags: ["ทริปใหญ่ก๊วนเพื่อน"] },
  { id: "chiangrai", name: "สำรวจถ้ำน้ำแข็งที่เชียงราย",    dates: "5–8 August 2026",       tags: ["ทริปใหญ่ก๊วนเพื่อน"] },
  { id: "khaosok",   name: "เดินป่าที่อุทยานแห่งชาติเขาสก", dates: "15–18 September 2026",  tags: ["1 เดย์ทริป"] },
  { id: "nan",       name: "ทัวร์วัฒนธรรมชุมชนที่น่าน",     dates: "10–12 November 2026",   tags: ["ทริปต่างประเทศ"] },
];

export default function RecommendPage() {
  const [active, setActive] = useState<Filter>("ทั้งหมด");

  const filtered = active === "ทั้งหมด"
    ? TRIPS
    : TRIPS.filter((t) => t.tags.includes(active));

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="w-full max-w-[430px] pb-[96px]">
        <div className="flex flex-col gap-[24px] px-[24px] pb-[30px] pt-[24px]">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[7px]">
              <img src="/images/logo.svg" alt="" className="size-[19px]" />
              <span className="text-[11px] tracking-[0.08px] text-[#767168]">GOGUN</span>
              <span className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ไปกัน</span>
            </div>
            <div className="flex h-[33px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white p-[7px]">
              <div className="flex size-[22px] items-center justify-center rounded-full bg-[#c0613e] text-[12px] font-medium text-white">
                ต
              </div>
              <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">ต้นน้ำ</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[28px] font-medium leading-[30.8px] tracking-[-0.28px] text-[#14110d]">
            ทริปสุดฮิต
          </h1>

          {/* Filter chips — scrollable */}
          <div className="flex flex-wrap gap-[8px]">
            {FILTERS.map((label) => (
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
                <div
                  key={trip.id}
                  className="flex items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[15px] py-[13px]"
                >
                  <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fcede3]">
                    <span className="text-[16px] font-medium text-[#e85a2c]">{trip.name.slice(0, 1)}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-[2px]">
                    <p className="text-[13.5px] font-medium leading-[16.875px] tracking-[0.08px] text-[#14110d]">
                      {trip.name}
                    </p>
                    <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">
                      {trip.dates}
                    </p>
                  </div>
                  <Link
                    href="/trips/demo"
                    className="flex shrink-0 items-center justify-center rounded-[9px] bg-[#14110d] px-[14px] py-[7px]"
                  >
                    <span className="text-[12px] font-medium text-[#f7f5f0]">ดู</span>
                  </Link>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
      <BottomNav active="recommend" />
    </main>
  );
}
