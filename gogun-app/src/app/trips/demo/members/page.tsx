"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DEMO_USER } from "@/components/page-header";
import { MEMBER_COLORS, ORGANIZER_COLOR } from "@/lib/trip";

type Member = {
  id: string;
  name: string;
  color: string;
  isOrganizer: boolean;
};

const INVITE_LINK = "gogun.app/t/tokyo-kyoto-x4";

const SHARE_PLATFORMS: { key: string; label: string; bg: string; icon?: string }[] = [
  { key: "line", label: "LINE", bg: "#06c755", icon: "/images/icon-line.svg" },
  { key: "fb", label: "FB", bg: "#1877f2", icon: "/images/icon-messenger.svg" },
  { key: "telegram", label: "Telegram", bg: "#0088cc", icon: "/images/icon-telegram.svg" },
  { key: "more", label: "More", bg: "#14110d" },
];

function QRCorner({ pos }: { pos: string }) {
  return (
    <div
      className={`absolute size-[38px] border-4 border-[#f7f5f0] bg-[#14110d] p-[4px] ${pos}`}
    >
      <div className="size-full bg-[#f7f5f0] p-[4px]">
        <div className="size-full bg-[#14110d]" />
      </div>
    </div>
  );
}

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([
    { id: "organizer", name: "ต้นน้ำ (คุณ)", color: ORGANIZER_COLOR, isOrganizer: true },
  ]);
  const [inputName, setInputName] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const [copied, setCopied] = useState(false);

  function addMember() {
    const trimmed = inputName.trim();
    if (!trimmed) return;
    const nonOrgCount = members.filter((m) => !m.isOrganizer).length;
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: trimmed,
        color: MEMBER_COLORS[nonOrgCount % MEMBER_COLORS.length],
        isOrganizer: false,
      },
    ]);
    setInputName("");
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

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: `https://${INVITE_LINK}`, title: "ทริปญี่ปุ่น Autumn" });
        return;
      } catch {
        // cancelled or unsupported
      }
    }
    copyLink();
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex min-h-screen w-full max-w-[420px] flex-col pb-[24px] pt-[24px]">
        {/* Header */}
        <div className="px-[24px]">
          <PageHeader
            title="สมาชิก"
            backHref="/trips/demo"
            user={DEMO_USER}
            right={
              <button
                type="button"
                onClick={() => router.push("/trips/demo/settings")}
                className="py-[8.5px] text-[13px] font-medium tracking-[0.08px] text-[#e85a2c]"
              >
                ตั้งค่า
              </button>
            }
          />
        </div>

        {/* Share invite link button */}
        <div className="px-[24px] pb-[28px]">
          <button
            type="button"
            onClick={() => setShowSheet(true)}
            className="flex h-[48px] w-full items-center justify-between rounded-[14px] bg-[#14110d] px-[18px]"
          >
            <div className="flex items-center gap-[10px]">
              <span className="relative h-[21px] w-[18px] shrink-0">
                <img
                  src="/images/icon-share-a.svg"
                  alt=""
                  className="absolute inset-0 size-full"
                />
                <img
                  src="/images/icon-share-b.svg"
                  alt=""
                  className="absolute inset-0 size-full"
                />
              </span>
              <p className="text-[14px] font-medium tracking-[0.14px] text-[#f7f5f0]">
                แชร์ลิงก์เชิญ
              </p>
            </div>
            <img
              src="/images/icon-chevron-left.svg"
              alt=""
              className="h-[10px] w-[6px] rotate-180"
            />
          </button>
        </div>

        {/* Members section */}
        <div className="flex flex-col gap-[10px] px-[24px] pb-[28px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[1.54px] text-[#767168]">MEMBERS</p>
            <p className="text-[12px] tracking-[0.12px] text-[#14110d]">{members.length} คน</p>
          </div>
          <div className="flex flex-col">
            {members.map((member, i) => (
              <div key={member.id}>
                {i > 0 && <div className="h-px bg-[#e5e1d7]" />}
                <div className="flex items-center gap-[12px] py-[12px]">
                  <div
                    className="flex size-[40px] shrink-0 items-center justify-center rounded-[20px] text-[15px] font-medium text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.trim().charAt(0)}
                  </div>
                  <div className="flex flex-1 flex-col gap-[2px]">
                    <p className="text-[14.5px] font-medium tracking-[0.08px] text-[#14110d]">
                      {member.name}
                    </p>
                    <p
                      className="text-[11px] font-medium tracking-[0.08px]"
                      style={{ color: member.isOrganizer ? "#e85a2c" : "#d9a21b" }}
                    >
                      {member.isOrganizer ? "คนจัดทริป · HOST" : "รอเข้าร่วม"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add member input */}
        <div className="px-[24px] pb-[28px]">
          <div className="flex items-center gap-[8px]">
            <div className="flex-1 border-b border-[#e5e1d7] py-[14px]">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMember()}
                placeholder="ชื่อเล่น เช่น ฟ้า, ปอนด์"
                className="w-full bg-transparent text-[17px] text-[#14110d] outline-none placeholder:text-[#757575]"
              />
            </div>
            <button
              type="button"
              onClick={addMember}
              disabled={!inputName.trim()}
              className="flex h-[44px] shrink-0 items-center gap-[8px] rounded-[14px] bg-[#14110d] px-[18px] py-[12px] disabled:opacity-40"
            >
              <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
              <p className="text-[13px] font-medium tracking-[0.13px] text-[#f7f5f0]">เพิ่ม</p>
            </button>
          </div>
        </div>

        {/* Bottom shortcuts */}
        <div className="mt-auto flex gap-[8px] px-[24px] pt-[24px]">
          <button
            type="button"
            onClick={() => router.push("/trips/demo/itinerary")}
            className="flex h-[48px] flex-1 items-center justify-center rounded-[14px] border border-[#d4cfc2] text-[13px] font-medium tracking-[0.13px] text-[#14110d]"
          >
            แก้แผนเดินทาง
          </button>
          <button
            type="button"
            onClick={() => router.push("/trips/demo/settings")}
            className="flex h-[48px] flex-1 items-center justify-center rounded-[14px] border border-[#d4cfc2] text-[13px] font-medium tracking-[0.13px] text-[#14110d]"
          >
            ตั้งค่าทริป
          </button>
        </div>
      </div>

      {/* Share sheet */}
      {showSheet && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black/30"
            onClick={() => setShowSheet(false)}
          />
          <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[420px] -translate-x-1/2 overflow-hidden rounded-tl-[24px] rounded-tr-[24px] bg-[#f7f5f0] pt-[8px]">
            {/* Handle */}
            <div className="flex justify-center pb-0">
              <div className="h-[4px] w-[36px] rounded-[2px] bg-[#d4cfc2]" />
            </div>
            {/* Sheet header */}
            <div className="flex items-center justify-between px-[20px] pb-[8px] pt-[14px]">
              <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">
                แชร์ลิงก์เชิญ
              </p>
              <button
                type="button"
                onClick={() => setShowSheet(false)}
                className="flex size-[32px] items-center justify-center rounded-[16px] bg-[#f2efe8]"
              >
                <img src="/images/icon-close.svg" alt="" className="size-[16px]" />
              </button>
            </div>
            {/* Sheet content */}
            <div className="flex flex-col gap-[12px] overflow-hidden px-[20px] pb-[36px] pt-[8px]">
              {/* Link + copy */}
              <div className="flex items-center gap-[10px] rounded-[12px] bg-[#f2efe8] px-[14px] py-[12px]">
                <p className="flex-1 truncate text-[12.5px] tracking-[0.08px] text-[#14110d]">
                  {INVITE_LINK}
                </p>
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 rounded-[8px] bg-[#14110d] px-[12px] py-[7px] text-[12px] font-medium text-[#f7f5f0]"
                >
                  {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                </button>
              </div>
              {/* QR card */}
              <div className="flex flex-col items-center gap-[14px] rounded-[16px] border border-[#e5e1d7] bg-white py-[25px]">
                <div className="relative size-[160px] shrink-0 rounded-[8px] bg-[#14110d] p-[12px]">
                  <div className="relative size-full">
                    <QRCorner pos="top-0 left-0" />
                    <QRCorner pos="top-0 right-0" />
                    <QRCorner pos="bottom-0 left-0" />
                  </div>
                </div>
                <p className="text-[11px] tracking-[0.44px] text-[#767168]">
                  สแกนเพื่อเข้าทริปได้ทันที
                </p>
              </div>
              {/* Social share buttons */}
              <div className="flex gap-[8px]">
                {SHARE_PLATFORMS.map((platform) => (
                  <button
                    key={platform.key}
                    type="button"
                    onClick={share}
                    className="flex flex-1 flex-col items-center gap-[6px] rounded-[12px] bg-[#f2efe8] px-[10px] py-[10px]"
                  >
                    <span
                      className="flex size-[36px] items-center justify-center rounded-[18px]"
                      style={{ backgroundColor: platform.bg }}
                    >
                      {platform.icon ? (
                        <img src={platform.icon} alt="" className="size-[20px]" />
                      ) : (
                        <span className="size-[10px] rounded-full border-2 border-white" />
                      )}
                    </span>
                    <span className="text-[10.5px] tracking-[0.21px] text-[#767168]">
                      {platform.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
