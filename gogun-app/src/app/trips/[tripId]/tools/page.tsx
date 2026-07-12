"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPolls, getChecklist, getPacking, getWheel, getMe, getTrip, type User, type Trip } from "@/lib/api";
import { MemberBottomNav } from "@/components/member-bottom-nav";

function ToolIcon({ slug }: { slug: string }) {
  if (slug === "wheel") {
    return (
      <div className="relative size-[20px] overflow-clip">
        <div className="absolute inset-[12.5%]">
          <div className="absolute inset-[-4.44%]">
            <img src="/images/icon-tool-wheel-a.svg" alt="" className="block size-full max-w-none" />
          </div>
        </div>
        <div className="absolute bottom-[33.33%] left-1/2 right-1/4 top-[12.5%]">
          <div className="absolute inset-[-6.15%_-13.33%]">
            <img src="/images/icon-tool-wheel-b.svg" alt="" className="block size-full max-w-none" />
          </div>
        </div>
      </div>
    );
  }
  if (slug === "vote") {
    return (
      <div className="relative size-[20px] overflow-clip">
        <div className="absolute inset-[12.5%_12.5%_12.5%_20.83%]">
          <div className="absolute inset-[-4.44%_-5%]">
            <img src="/images/icon-tool-vote.svg" alt="" className="block size-full max-w-none" />
          </div>
        </div>
      </div>
    );
  }
  if (slug === "packing") {
    return (
      <div className="relative size-[20px] overflow-clip">
        <div className="absolute inset-[8.33%_20.83%]">
          <div className="absolute inset-[-4%_-5.71%]">
            <img src="/images/icon-tool-packing.svg" alt="" className="block size-full max-w-none" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative size-[20px] overflow-clip">
      <div className="absolute bottom-1/4 left-[37.5%] right-[16.67%] top-1/4">
        <div className="absolute inset-[-6.67%_-7.27%]">
          <img src="/images/icon-tool-checklist-a.svg" alt="" className="block size-full max-w-none" />
        </div>
      </div>
      {(["inset-[18.75%_72.92%_68.75%_14.58%]","inset-[43.75%_72.92%_43.75%_14.58%]","inset-[68.75%_72.92%_18.75%_14.58%]"] as const).map((pos, i) => (
        <div key={i} className={`absolute ${pos}`}>
          <div className="absolute inset-[-26.67%]">
            <img src="/images/icon-tool-checklist-b.svg" alt="" className="block size-full max-w-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ToolsHubPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [openPolls, setOpenPolls] = useState(0);
  const [checklistTotal, setChecklistTotal] = useState(0);
  const [checklistDone, setChecklistDone] = useState(0);
  const [packingTotal, setPackingTotal] = useState(0);
  const [packingDone, setPackingDone] = useState(0);
  const [wheelCount, setWheelCount] = useState(0);

  const isOrganizer = !!(me && trip && me.id === trip.organizer_id);
  const backHref = isOrganizer ? `/trips/${tripId}` : `/trips/${tripId}/member`;

  useEffect(() => {
    Promise.allSettled([
      getMe().then(setMe),
      getTrip(tripId).then(setTrip),
      getPolls(tripId).then((polls) => {
        setOpenPolls(polls.filter((p) => p.status === "open").length);
      }),
      getChecklist(tripId).then((items) => {
        setChecklistTotal(items.length);
        setChecklistDone(items.filter((i) => i.is_checked).length);
      }),
      getPacking(tripId).then((items) => {
        setPackingTotal(items.length);
        setPackingDone(items.filter((i) => i.is_checked).length);
      }),
      getWheel(tripId).then((opts) => setWheelCount(opts.length)),
    ]);
  }, [tripId]);

  const TOOLS = [
    {
      title: "กงล้อสุ่ม",
      description: "หมุนเลือก ร้านอาหาร, กิจกรรม, ใครจ่ายก่อน",
      badge: `${wheelCount} ตัวเลือก`,
      badgeColor: "#767168",
      route: `/trips/${tripId}/tools/wheel`,
      icon: "wheel",
    },
    {
      title: "โหวต",
      description: "ตัดสินใจรวมเร็วๆ — ที่พัก, กิจกรรม, ร้านอาหาร",
      badge: openPolls > 0 ? `${openPolls} เปิดอยู่` : "ไม่มีที่เปิด",
      badgeColor: openPolls > 0 ? "#e85a2c" : "#767168",
      route: `/trips/${tripId}/tools/vote`,
      icon: "vote",
    },
    {
      title: "Packing List",
      description: "ของกลาง · ใครเตรียมอะไร อย่าให้ลืม",
      badge: packingTotal > 0 ? `${packingDone}/${packingTotal} เตรียมแล้ว` : "ยังไม่มีรายการ",
      badgeColor: "#767168",
      route: `/trips/${tripId}/tools/packing`,
      icon: "packing",
    },
    {
      title: "เช็คลิสต์รายคน",
      description: "งานที่แต่ละคนต้องทำก่อนทริป",
      badge: checklistTotal > 0 ? `${checklistDone}/${checklistTotal} เสร็จแล้ว` : "ยังไม่มีรายการ",
      badgeColor: checklistDone < checklistTotal && checklistTotal > 0 ? "#e85a2c" : "#767168",
      route: `/trips/${tripId}/tools/checklist`,
      icon: "checklist",
    },
  ];

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className={`flex w-full max-w-[420px] flex-col pt-[24px] px-[24px] ${isOrganizer ? "pb-[40px]" : "pb-[100px]"}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[7px]">
            <img src="/images/logo.svg" alt="" className="size-[19px]" />
            <p className="text-[11px] tracking-[0.08px] text-[#767168]">GOGUN</p>
            <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ไปกัน</p>
          </div>
          {me && (
            <div className="flex h-[33px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white p-[7px]">
              <span
                className="flex size-[22px] items-center justify-center rounded-[31px] text-[12px] font-medium text-white"
                style={{ backgroundColor: me.avatar_color }}
              >
                {me.display_name.slice(0, 1)}
              </span>
              <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                {me.display_name}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-[6px] pb-[14px] pt-[20px]">
          <div className="flex items-center gap-[12px]">
            {isOrganizer && (
              <button
                type="button"
                onClick={() => router.push(backHref)}
                className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
              >
                <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px] object-contain" />
              </button>
            )}
            <p className="text-[26px] font-medium tracking-[0.08px] text-[#14110d]">อุปกรณ์เสริม</p>
          </div>
          <p className={`text-[12px] font-light tracking-[0.08px] text-[#767168] ${isOrganizer ? "pl-[48px]" : ""}`}>
            ตัวช่วยให้วางแผนสนุกขึ้น ไม่ต้องเถียงกัน
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="flex flex-col gap-[5px] pt-[24px]">
          {[TOOLS.slice(0, 2), TOOLS.slice(2, 4)].map((row, ri) => (
            <div key={ri} className="flex items-stretch justify-between">
              {row.map((tool) => (
                <button
                  key={tool.route}
                  type="button"
                  onClick={() => router.push(tool.route)}
                  className="flex w-[175px] flex-col gap-[12px] rounded-[16px] border border-[#e5e1d7] bg-white pb-[14px] pt-[15px] px-[15px] text-left"
                >
                  <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#f2efe8]">
                    <ToolIcon slug={tool.icon} />
                  </div>
                  <div className="flex flex-1 flex-col gap-[2px]">
                    <p className="text-[14.5px] font-medium tracking-[0.08px] text-[#14110d] leading-[17.4px]">
                      {tool.title}
                    </p>
                    <p className="text-[11px] font-light tracking-[0.08px] text-[#767168] leading-[15.4px]">
                      {tool.description}
                    </p>
                  </div>
                  <p className="text-[10px] font-light uppercase" style={{ color: tool.badgeColor }}>
                    {tool.badge}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {!isOrganizer && <MemberBottomNav active="tools" tripId={tripId} />}
    </main>
  );
}
