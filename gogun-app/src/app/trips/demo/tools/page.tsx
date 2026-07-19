"use client";

import { useRouter } from "next/navigation";
import { MemberBottomNav } from "@/components/member-bottom-nav";
import { PageHeader, DEMO_USER } from "@/components/page-header";

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
  // checklist
  return (
    <div className="relative size-[20px] overflow-clip">
      <div className="absolute bottom-1/4 left-[37.5%] right-[16.67%] top-1/4">
        <div className="absolute inset-[-6.67%_-7.27%]">
          <img src="/images/icon-tool-checklist-a.svg" alt="" className="block size-full max-w-none" />
        </div>
      </div>
      {(["inset-[18.75%_72.92%_68.75%_14.58%]", "inset-[43.75%_72.92%_43.75%_14.58%]", "inset-[68.75%_72.92%_18.75%_14.58%]"] as const).map((pos, i) => (
        <div key={i} className={`absolute ${pos}`}>
          <div className="absolute inset-[-26.67%]">
            <img src="/images/icon-tool-checklist-b.svg" alt="" className="block size-full max-w-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

const TOOLS = [
  {
    title: "กงล้อสุ่ม",
    description: "หมุนเลือก ร้านอาหาร, กิจกรรม, ใครจ่ายก่อน",
    badge: "6 ตัวเลือก",
    badgeColor: "#767168",
    route: "/trips/demo/tools/wheel",
    icon: "wheel",
  },
  {
    title: "โหวต",
    description: "ตัดสินใจรวมเร็วๆ — ที่พัก, กิจกรรม, ร้านอาหาร",
    badge: "1 เปิดอยู่",
    badgeColor: "#e85a2c",
    route: "/trips/demo/tools/vote",
    icon: "vote",
  },
  {
    title: "Packing List",
    description: "ของกลาง · ใครเตรียมอะไร อย่าให้ลืม",
    badge: "2/9 เตรียมแล้ว",
    badgeColor: "#767168",
    route: "/trips/demo/tools/packing",
    icon: "packing",
  },
  {
    title: "เช็คลิสต์รายคน",
    description: "งานที่แต่ละคนต้องทำก่อนทริป",
    badge: "5/6 ของคุณ",
    badgeColor: "#e85a2c",
    route: "/trips/demo/tools/checklist",
    icon: "checklist",
  },
] as const;


export default function ToolsHubPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] pb-[96px] pt-[24px] px-[24px]">
        {/* Header */}
        <PageHeader
          title="อุปกรณ์เสริม"
          subtitle="ตัวช่วยให้วางแผนสนุกขึ้น ไม่ต้องเถียงกัน"
          user={DEMO_USER}
        />

        {/* 2×2 grid */}
        <div className="grid grid-cols-2 gap-[8px]">
          {TOOLS.map((tool) => (
            <button
              key={tool.route}
              type="button"
              onClick={() => router.push(tool.route)}
              className="flex flex-col gap-[12px] rounded-[16px] border border-[#e5e1d7] bg-white pb-[14px] pt-[15px] px-[15px] text-left"
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
      </div>
      <MemberBottomNav active="tools" />
    </main>
  );
}
