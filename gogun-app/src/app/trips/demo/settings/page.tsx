"use client";

import { useState } from "react";
import { PageHeader, DEMO_USER } from "@/components/page-header";

const INVITE_LINK = "gogun.app/t/tokyo-kyoto-x4";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className="relative h-[26px] w-[44px] shrink-0 rounded-[999px] transition-colors"
      style={{ backgroundColor: on ? "#e85a2c" : "#f2efe8" }}
    >
      <div
        className="absolute top-[2px] size-[22px] rounded-[11px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)] transition-all duration-150"
        style={{ left: on ? "20px" : "2px" }}
      />
    </button>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="bg-[#f2efe8] px-[16px] pb-[6px] pt-[12px]">
      <p className="text-[10.5px] uppercase tracking-[1.68px] text-[#767168]">{title}</p>
    </div>
  );
}

function Chevron() {
  return (
    <div className="flex h-[30px] w-[14px] shrink-0 items-center justify-center">
      <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px] rotate-180" />
    </div>
  );
}

export default function TripSettingsPage() {
  const [copied, setCopied] = useState(false);

  const [toggles, setToggles] = useState({
    canAddExpenses: true,
    canEditItinerary: true,
    canInvite: false,
  });

  function toggle(key: keyof typeof toggles) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${INVITE_LINK}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[24px] pt-[24px]">
        {/* Header */}
        <div className="px-[24px]">
          <PageHeader title="ตั้งค่าทริป" backHref="/trips/demo" user={DEMO_USER} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-[18px] px-[24px]">

          {/* ข้อมูลทริป */}
          <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <SectionLabel title="ข้อมูลทริป" />
            {/* ชื่อทริป */}
            <div className="flex h-[57px] items-center gap-[12px] border-b border-[#e5e1d7] px-[16px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[18px]">
                  <div className="absolute inset-[4.17%_16.67%_8.33%_16.67%]">
                    <img src="/images/icon-text-field-a.svg" alt="" className="size-full" />
                  </div>
                  <div className="absolute inset-[27.08%_39.58%_52.08%_39.58%]">
                    <img src="/images/icon-text-field-b.svg" alt="" className="size-full" />
                  </div>
                </div>
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">ชื่อทริป</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">
                Tokyo × Kyoto
              </p>
              <Chevron />
            </div>
            {/* วันที่ */}
            <div className="flex h-[57px] items-center gap-[12px] border-b border-[#e5e1d7] px-[16px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[20px]">
                  <div className="absolute inset-[20.83%_12.5%_12.5%_12.5%]">
                    <img src="/images/icon-calendar-small-a.svg" alt="" className="size-full" />
                  </div>
                  <div className="absolute inset-[12.5%_12.5%_58.33%_12.5%]">
                    <img src="/images/icon-calendar-small-b.svg" alt="" className="size-full" />
                  </div>
                </div>
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">วันที่</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">
                12–16 พ.ย.
              </p>
              <Chevron />
            </div>
            {/* สกุลเงินหลัก */}
            <div className="flex h-[57px] items-center gap-[12px] border-b border-[#e5e1d7] px-[16px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[20px]">
                  <div className="absolute inset-[12.5%]">
                    <img src="/images/icon-coin-a.svg" alt="" className="size-full" />
                  </div>
                  <div className="absolute inset-[37.5%_35.42%_29.17%_37.5%]">
                    <img src="/images/icon-coin-b.svg" alt="" className="size-full" />
                  </div>
                </div>
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">สกุลเงินหลัก</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">
                JPY
              </p>
              <Chevron />
            </div>
            {/* งบประมาณ/คน */}
            <div className="flex h-[56px] items-center gap-[12px] px-[16px] py-[13px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[18px]">
                  <div className="absolute inset-[12.5%]">
                    <img src="/images/icon-budget-a.svg" alt="" className="size-full" />
                  </div>
                  <div className="absolute inset-[29.17%_37.5%]">
                    <img src="/images/icon-budget-b.svg" alt="" className="size-full" />
                  </div>
                </div>
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">งบประมาณ / คน</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">
                ไม่ตั้ง
              </p>
              <Chevron />
            </div>
          </div>

          {/* สิทธิ์สมาชิก */}
          <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <SectionLabel title="สิทธิ์สมาชิก" />
            <div className="flex items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] py-[13px]">
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">เพิ่มค่าใช้จ่ายเองได้</p>
                <p className="text-[11px] font-light text-[#767168]">ทุกคนเพิ่มบิลของตัวเองได้</p>
              </div>
              <Toggle on={toggles.canAddExpenses} onChange={() => toggle("canAddExpenses")} />
            </div>
            <div className="flex items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] py-[13px]">
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">แก้แผนเดินทางได้</p>
                <p className="text-[11px] font-light text-[#767168]">สมาชิกแก้ itinerary ร่วมกัน</p>
              </div>
              <Toggle on={toggles.canEditItinerary} onChange={() => toggle("canEditItinerary")} />
            </div>
            <div className="flex items-center gap-[12px] px-[16px] py-[13px]">
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">เชิญคนอื่นเพิ่มได้</p>
                <p className="text-[11px] font-light text-[#767168]">ถ้าปิด มีแค่คุณที่เชิญเพิ่มได้</p>
              </div>
              <Toggle on={toggles.canInvite} onChange={() => toggle("canInvite")} />
            </div>
          </div>

          {/* ลิงก์ทริป */}
          <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <SectionLabel title="ลิงก์ทริป" />
            <div className="flex items-center gap-[12px] px-[16px] py-[13px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[16px]">
                  <div className="absolute inset-[8.33%_12.5%]">
                    <img src="/images/icon-link.svg" alt="" className="size-full" />
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">{INVITE_LINK}</p>
                <p className="text-[11px] font-light text-[#767168]">ใครมีลิงก์เข้าได้</p>
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 px-[6px] py-px text-[13px] font-medium text-[#e85a2c]"
              >
                {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
          </div>

          {/* โซนอันตราย */}
          <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <SectionLabel title="โซนอันตราย" />
            <div className="flex items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] py-[13px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[16px]">
                  <div className="absolute inset-[12.5%]">
                    <img src="/images/icon-transfer.svg" alt="" className="size-full" />
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">ส่งต่อสิทธิ์ host</p>
                <p className="text-[11px] font-light text-[#767168]">ให้คนอื่นเป็นคนจัดทริปแทน</p>
              </div>
              <Chevron />
            </div>
            <div className="flex items-center gap-[12px] px-[16px] py-[13px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#fcede3]">
                <div className="relative size-[16px]">
                  <div className="absolute inset-[8.33%_12.5%]">
                    <img src="/images/icon-trash.svg" alt="" className="size-full" />
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] font-medium text-[#e85a2c]">ลบทริปนี้</p>
                <p className="text-[11px] font-light text-[#767168]">ทุกข้อมูลจะหายไป — ทำซ้ำไม่ได้</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pb-[30px] pt-[8px] text-center">
            <p className="text-[10.5px] tracking-[0.42px] text-[#b5b0a4]">GoGun · ไปกัน · v1.0</p>
          </div>
        </div>
      </div>
    </main>
  );
}
