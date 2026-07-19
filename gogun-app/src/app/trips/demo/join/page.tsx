"use client";

import { useRouter } from "next/navigation";

const MEMBERS = [
  { id: "ton",   name: "ต้นน้ำ", initial: "ตน", color: "#c0613e", role: "จัดทริป" },
  { id: "james", name: "เจมส์",  initial: "จ",  color: "#4f6e7a", role: "ร่วมทริป" },
  { id: "nai",   name: "นาย",    initial: "น",  color: "#7b8b57", role: "ร่วมทริป" },
  { id: "atif",  name: "อาตีฟ",  initial: "อ",  color: "#8a6e9e", role: "ร่วมทริป" },
];

export default function JoinSelectPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] pb-[30px] pt-[92px] px-[24px]">

        {/* Trip info header */}
        <div className="flex flex-col gap-[8px] pb-[40px]">
          <p className="text-[10px] uppercase tracking-[0.6px] text-[#767168]">
            คุณถูกเชิญเข้าทริป
          </p>
          <p className="text-[32px] font-medium leading-[1.15] tracking-[-0.32px] text-[#14110d]">
            ทริปญี่ปุ่น Autumn
          </p>
          <div className="flex items-center gap-[10px] text-[13px] tracking-[0.08px]">
            <span className="text-[#767168]">Japan</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">5 วัน</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">4 คน</span>
          </div>
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
            ยังอยู่ระหว่างหาวัน
          </p>
        </div>

        {/* Member selector */}
        <div className="flex flex-col gap-[4px]">
          <p className="text-[15px] tracking-[0.08px] text-[#14110d]">ใครคือคุณ?</p>
          <p className="pb-[20px] text-[12px] font-light tracking-[0.08px] text-[#767168]">
            กดชื่อเพื่อเริ่มใช้งาน · ไม่ต้องสมัครสมาชิก
          </p>

          <div className="grid grid-cols-2 gap-[8px]">
            {MEMBERS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => router.push(`/trips/demo/join/confirm?member=${m.id}`)}
                className="flex flex-col items-center gap-[10px] rounded-[18px] border border-[#e5e1d7] bg-white pb-[18px] pt-[19px]"
              >
                <div
                  className="flex size-[56px] items-center justify-center rounded-[28px] text-[20px] font-medium text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.initial}
                </div>
                <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                  {m.name}
                </p>
                <p className="text-[10.5px] font-light uppercase tracking-[0.42px] text-[#767168]">
                  {m.role}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-[4px] pt-[6px]">
          <p className="text-[11px] font-light tracking-[0.44px] text-[#b5b0a4]">
            ไม่มีชื่อในรายการ?
          </p>
          <button
            type="button"
            className="border-b border-[#d4cfc2] pb-px text-[11px] font-light tracking-[0.44px] text-[#14110d]"
          >
            แจ้งคนจัดทริป
          </button>
        </div>

      </div>
    </main>
  );
}
