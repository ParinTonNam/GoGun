"use client";

import { useState } from "react";
import { MEMBER_COLORS, type TripFormData } from "@/lib/trip";

export function StepMembers({
  formData,
  onChange,
}: {
  formData: TripFormData;
  onChange: (patch: Partial<TripFormData>) => void;
}) {
  const [nameInput, setNameInput] = useState("");

  function addMember() {
    const name = nameInput.trim();
    if (!name) return;
    const addedCount = formData.members.length - 1;
    const color = MEMBER_COLORS[addedCount % MEMBER_COLORS.length];
    onChange({
      members: [
        ...formData.members,
        { id: `${Date.now()}`, name, color, isOrganizer: false },
      ],
    });
    setNameInput("");
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-[8px] overflow-y-auto px-[24px] pb-[24px] pt-[16px]">
      <div className="flex h-[22px] w-full items-center gap-[6px] pb-[16px]">
        <div className="flex size-[22px] items-center justify-center rounded-[11px] bg-[#14110d]">
          <p className="text-[11px] font-medium text-[#f7f5f0]">3</p>
        </div>
        <p className="text-[11px] tracking-[0.44px] text-[#767168]">เชิญสมาชิก</p>
      </div>
      <h1 className="text-[28px] font-medium tracking-[-0.28px] text-[#14110d]">
        ไปกันกี่คน?
      </h1>
      <p className="pb-[20px] text-[13px] tracking-[0.08px] text-[#767168]">
        เพิ่มชื่อเพื่อนได้เลย — เมื่อเปิดทริปแล้ว แชร์ลิงก์ให้เลือกตัวเองในแอป
      </p>
      <div className="flex w-full flex-col gap-[8px] pb-[14px]">
        <p className="text-[10.5px] uppercase text-[#767168]">เพิ่มชื่อสมาชิก</p>
        <div className="flex items-center gap-[8px]">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMember();
              }
            }}
            placeholder="ชื่อเล่น เช่น ฟ้า, ปอนด์"
            className="flex-1 border-b border-[#e5e1d7] bg-transparent py-[14px] text-[17px] text-[#14110d] placeholder:text-[#757575] focus:outline-none"
          />
          <button
            type="button"
            onClick={addMember}
            disabled={!nameInput.trim()}
            className="flex h-[44px] items-center justify-center gap-[8px] rounded-[14px] bg-[#14110d] px-[18px] text-[13px] font-medium tracking-[0.13px] text-[#f7f5f0] disabled:opacity-40"
          >
            <img src="/images/icon-plus.svg" alt="" className="size-[13px]" />
            เพิ่ม
          </button>
        </div>
      </div>
      <div className="flex w-full flex-col">
        {formData.members.map((member, i) => (
          <div key={member.id}>
            <div className="flex items-center gap-[12px] py-[12px]">
              <div
                className="flex size-[40px] shrink-0 items-center justify-center rounded-[20px] text-[15px] font-medium text-white"
                style={{ backgroundColor: member.color }}
              >
                {member.name.trim().charAt(0)}
              </div>
              <div className="flex flex-1 flex-col gap-[2px]">
                <p className="text-[14.5px] tracking-[0.08px] text-[#14110d]">
                  {member.name}
                </p>
                <p
                  className={`text-[11px] tracking-[0.08px] ${
                    member.isOrganizer ? "text-[#e85a2c]" : "text-[#d9a21b]"
                  }`}
                >
                  {member.isOrganizer ? "คนจัดทริป" : "รอเข้าร่วม"}
                </p>
              </div>
            </div>
            {i < formData.members.length - 1 && (
              <div className="h-px w-full bg-[#e5e1d7]" />
            )}
          </div>
        ))}
      </div>
      <p className="text-[16px] tracking-[0.08px] text-[#14110d]">
        ใส่กี่คนก็ได้ — ตอนเปิดทริปแล้ว ทุกคนเข้าจากลิงก์เดียวกัน เลือกชื่อตัวเองเองในแอป
      </p>
    </div>
  );
}
