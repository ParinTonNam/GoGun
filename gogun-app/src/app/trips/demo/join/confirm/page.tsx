"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MEMBERS = [
  { id: "ton",   name: "ต้นน้ำ", initial: "ตน", color: "#c0613e", role: "จัดทริป" },
  { id: "james", name: "เจมส์",  initial: "จ",  color: "#4f6e7a", role: "ร่วมทริป" },
  { id: "nai",   name: "นาย",    initial: "น",  color: "#7b8b57", role: "ร่วมทริป" },
  { id: "atif",  name: "อาตีฟ",  initial: "อ",  color: "#8a6e9e", role: "ร่วมทริป" },
];

function ConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const memberId = params.get("member") ?? "ton";
  const member = MEMBERS.find((m) => m.id === memberId) ?? MEMBERS[0];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-[24px]">
      <div className="flex flex-col items-center gap-[16px]">
        {/* Large avatar card */}
        <div className="flex flex-col items-center gap-[18px] pb-[18px] pt-[19px]">
          <div
            className="flex size-[110px] items-center justify-center rounded-full text-[20px] font-medium text-white"
            style={{ backgroundColor: member.color }}
          >
            {member.initial}
          </div>
          <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
            {member.name}
          </p>
          <p className="text-[10.5px] font-light uppercase tracking-[0.42px] text-[#767168]">
            {member.role}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex w-[171px] flex-col gap-[16px]">
          <button
            type="button"
            onClick={() => router.push("/trips/demo/member")}
            className="flex items-center justify-center rounded-[18px] border border-[#e5e1d7] bg-white pb-[18px] pt-[19px] text-[15px] font-medium tracking-[0.08px] text-[#14110d]"
          >
            เริ่มทริปกันเลย
          </button>
          <button
            type="button"
            onClick={() => router.push("/trips/demo/join")}
            className="flex items-center justify-center rounded-[18px] border border-[#e5e1d7] pb-[18px] pt-[19px] text-[15px] font-light tracking-[0.08px] text-[#14110d]"
          >
            เลือกใหม่
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
