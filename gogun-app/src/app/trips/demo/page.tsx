"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TaskCard } from "@/components/trip-dashboard/task-card";
import { StatCard } from "@/components/trip-dashboard/stat-card";
import { MemberAvatar } from "@/components/trip-dashboard/member-avatar";
import { ToolRow } from "@/components/trip-dashboard/tool-row";

const MEMBERS = [
  { name: "ต้นน้ำ", color: "#c0613e", statusLabel: "HOST", statusColor: "#e85a2c", muted: false },
  { name: "เจมส์", color: "#4f6e7a", statusLabel: "รอ", statusColor: "#d9a21b", muted: true },
  { name: "นาย", color: "#7b8b57", statusLabel: "เข้าแล้ว", statusColor: "#2e8b5c", muted: false },
  { name: "อาตีฟ", color: "#8a6e9e", statusLabel: "รอ", statusColor: "#d9a21b", muted: true },
];

const STATS: Array<{ value: string; valueColor: string; label: string; route?: string }> = [
  { value: "2/4", valueColor: "#d9a21b", label: "เข้าร่วมแล้ว" },
  { value: "4/4", valueColor: "#2e8b5c", label: "เลือกวันว่าง", route: "/trips/demo/availability" },
  { value: "¥291k", valueColor: "#14110d", label: "ค่าใช้จ่ายรวม" },
  { value: "0/4", valueColor: "#14110d", label: "พร้อมเดินทาง" },
];

const INVITE_LINK = "gogun.app/t/tokyo-kyoto-x4";

export default function TripDashboardPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(`https://${INVITE_LINK}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] px-[24px] py-[24px]">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[7px]">
            <img src="/images/logo.svg" alt="" className="size-[19px]" />
            <p className="text-[11px] tracking-[0.08px] text-[#767168]">GOGUN</p>
            <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
              ไปกัน
            </p>
          </div>
          <div className="flex h-[33px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white p-[7px]">
            <span className="flex size-[22px] items-center justify-center rounded-[31px] bg-[#c0613e] text-[12px] font-medium text-white">
              ต
            </span>
            <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
              ต้นน้ำ
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[10px] pb-[6px] pt-[4px]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase text-[#767168]">คุณกำลังจัดทริปนี้</p>
            <a
              href="#tools"
              className="rounded-full bg-[#fcede3] px-[10px] py-[4px] text-[10px] font-medium uppercase text-[#e85a2c]"
            >
              จัดการ
            </a>
          </div>
          <h1 className="text-[28px] font-medium tracking-[-0.28px] text-[#14110d]">
            ทริปญี่ปุ่น Autumn
          </h1>
          <div className="flex w-full items-center gap-[14px] rounded-[16px] border border-[#e5e1d7] bg-white px-[17px] py-[15px]">
            <p className="text-[40px] font-light tracking-[-1.2px] text-[#e85a2c]">5</p>
            <div className="flex flex-1 flex-col gap-[2px] tracking-[0.08px]">
              <p className="text-[15px] font-medium text-[#14110d]">วัน · Japan</p>
              <p className="text-[12px] text-[#767168]">
                12–16 Nov 2026 <span className="text-[#d9a21b]">· ยังไม่ยืนยัน</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[10px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase text-[#767168]">ต้องจัดการ</p>
            <p className="text-[12px] font-medium tracking-[0.12px] text-[#e85a2c]">
              2 รายการ
            </p>
          </div>
          <div className="flex w-full flex-col gap-[8px]">
            <TaskCard
              icon="/images/icon-task-invite.svg"
              title="2 คนยังไม่เข้าทริป"
              subtitle="ส่งลิงก์เชิญอีกครั้ง"
              actionLabel="แชร์"
              onAction={() => router.push("/trips/demo/share")}
            />
            <TaskCard
              icon="/images/icon-task-vote.svg"
              title="วันที่ 4 — เลือกที่กิน Kaiseki"
              subtitle="โหวตแล้ว 3/4 คน"
              actionLabel="ดู"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-[10px]">
          <p className="text-[11px] uppercase text-[#767168]">ภาพรวม</p>
          <div className="grid grid-cols-2 gap-[10px]">
            {STATS.map((stat) => {
              const route = stat.route;
              return (
                <StatCard
                  key={stat.label}
                  value={stat.value}
                  valueColor={stat.valueColor}
                  label={stat.label}
                  onClick={route ? () => router.push(route) : undefined}
                />
              );
            })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-[10px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase text-[#767168]">สมาชิก</p>
            <button
              type="button"
              onClick={() => router.push("/trips/demo/members")}
              className="text-[12px] tracking-[0.12px] text-[#14110d]"
            >
              จัดการ →
            </button>
          </div>
          <div className="flex w-full items-start gap-[10px] overflow-x-auto">
            {MEMBERS.map((member) => (
              <MemberAvatar key={member.name} {...member} />
            ))}
            <div className="flex w-[64px] shrink-0 flex-col items-center gap-[6px] px-[8px]">
              <button
                type="button"
                className="flex size-[48px] items-center justify-center rounded-[24.5px] border border-[#e5e1d7] bg-white"
              >
                <img src="/images/icon-member-invite.svg" alt="" className="size-[20px]" />
              </button>
              <p className="text-[11px] tracking-[0.08px] text-[#14110d]">เชิญ</p>
            </div>
          </div>
        </div>

        <div id="tools" className="flex w-full flex-col gap-[10px] pb-[4px]">
          <p className="text-[11px] uppercase text-[#767168]">เครื่องมือจัดการ</p>
          <div className="flex w-full flex-col overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <ToolRow
              icon={<img src="/images/icon-tool-itinerary.svg" alt="" className="size-[20px]" />}
              title="แก้แผนเดินทาง"
              subtitle="5 วัน · 14 กิจกรรม"
              showDivider
              onClick={() => router.push("/trips/demo/itinerary")}
            />
            <ToolRow
              icon={<img src="/images/icon-tool-accessories.svg" alt="" className="size-[20px]" />}
              title="อุปกรณ์เสริม"
              subtitle="4 รายการ"
              showDivider
              onClick={() => router.push("/trips/demo/tools")}
            />
            <ToolRow
              icon={<img src="/images/icon-tool-members.svg" alt="" className="size-[20px]" />}
              title="จัดการสมาชิก"
              subtitle="2/4 เข้าร่วม"
              showDivider
              onClick={() => router.push("/trips/demo/members")}
            />
            <ToolRow
              icon={<img src="/images/icon-tool-share.svg" alt="" className="size-[20px]" />}
              title="แชร์ลิงก์เชิญ"
              subtitle={copied ? "คัดลอกแล้ว" : INVITE_LINK}
              showDivider
              onClick={copyInviteLink}
            />
            <ToolRow
              icon={<img src="/images/icon-tool-settings.svg" alt="" className="size-[20px]" />}
              title="ตั้งค่าทริป"
              subtitle="สกุลเงิน · สิทธิ์ · แจ้งเตือน"
              showDivider={false}
              onClick={() => router.push("/trips/demo/settings")}
            />
          </div>
        </div>

        <p className="px-[20px] pb-[6px] pt-[8px] text-center text-[10.5px] tracking-[0.42px] text-[#b5b0a4]">
          GoGun · ไปกัน · คุณเป็นคนจัดทริปนี้
        </p>
      </div>
    </main>
  );
}
