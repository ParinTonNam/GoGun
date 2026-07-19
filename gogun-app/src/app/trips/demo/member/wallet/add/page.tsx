"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MemberId = "ton" | "james" | "nai" | "atif";

const MEMBERS: { id: MemberId; name: string; initial: string; color: string }[] = [
  { id: "ton",   name: "ต้นน้ำ", initial: "ต", color: "#c0613e" },
  { id: "james", name: "เจมส์",  initial: "จ", color: "#4f6e7a" },
  { id: "nai",   name: "นาย",    initial: "น", color: "#7b8b57" },
  { id: "atif",  name: "อาตีฟ",  initial: "อ", color: "#8a6e9e" },
];

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: "plane",  label: "เครื่องบิน",   icon: "/images/icon-expense-plane.svg"  },
  { id: "hotel",  label: "ที่พัก",        icon: "/images/icon-expense-hotel.svg"  },
  { id: "train",  label: "เดินทาง",      icon: "/images/icon-expense-train.svg"  },
  { id: "food",   label: "อาหาร",         icon: "/images/icon-expense-food.svg"   },
  { id: "ticket", label: "ตั๋ว/กิจกรรม", icon: "/images/icon-expense-ticket.svg" },
  { id: "other",  label: "อื่นๆ",         icon: "/images/icon-expense-wifi.svg"   },
];

const TO_WHITE = "brightness(0) invert(1)";

function MemberPill({
  m, selected, onClick,
}: { m: typeof MEMBERS[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[36px] shrink-0 items-center gap-[7px] rounded-[48px] border px-[10px] transition-colors ${
        selected ? "border-[#14110d] bg-[#14110d]" : "border-[#e5e1d7] bg-white"
      }`}
    >
      <div
        className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[12px] font-medium text-white"
        style={{ backgroundColor: m.color }}
      >
        {m.initial}
      </div>
      <span
        className={`text-[13px] font-medium tracking-[0.08px] ${
          selected ? "text-white" : "text-[#14110d]"
        }`}
      >
        {m.name}
      </span>
    </button>
  );
}

export default function AddExpensePage() {
  const router = useRouter();

  const [category, setCategory]   = useState("plane");
  const [name, setName]           = useState("");
  const [amount, setAmount]       = useState("");
  const [paidBy, setPaidBy]       = useState<MemberId>("ton");
  const [splitAmong, setSplitAmong] = useState<Set<MemberId>>(
    new Set(["ton", "james", "nai", "atif"])
  );

  function toggleSplit(id: MemberId) {
    setSplitAmong((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const numAmount  = parseFloat(amount) || 0;
  const perPerson  = splitAmong.size > 0 ? numAmount / splitAmong.size : 0;
  const perPersonFmt = perPerson > 0
    ? Math.round(perPerson).toLocaleString("en")
    : null;

  const canSave = name.trim().length > 0 && numAmount > 0;

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[28px] pb-[48px] pt-[20px]">

        {/* ── Header ── */}
        <div className="flex items-center gap-[12px] px-[24px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px]" />
          </button>
          <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">
            เพิ่มค่าใช้จ่าย
          </p>
        </div>

        {/* ── Category picker ── */}
        <div className="flex flex-col gap-[10px]">
          <p className="px-[24px] text-[12px] font-light tracking-[0.08px] text-[#767168]">
            หมวดหมู่
          </p>
          <div className="grid grid-cols-6 gap-[6px] px-[24px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-[6px] rounded-[16px] border px-[2px] py-[11px] transition-colors ${
                  category === cat.id
                    ? "border-[#14110d] bg-[#14110d]"
                    : "border-[#e5e1d7] bg-white"
                }`}
              >
                <img
                  src={cat.icon}
                  alt=""
                  className="size-[20px]"
                  style={category === cat.id ? { filter: TO_WHITE } : undefined}
                />
                <span
                  className={`whitespace-nowrap text-[9px] font-medium tracking-[0.08px] ${
                    category === cat.id ? "text-white" : "text-[#767168]"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Name ── */}
        <div className="flex flex-col gap-[8px] px-[24px]">
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ชื่อรายการ</p>
          <input
            type="text"
            placeholder="เช่น ตั๋วเครื่องบิน × 4"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-[48px] w-full rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4] focus:border-[#14110d]"
          />
        </div>

        {/* ── Amount ── */}
        <div className="flex flex-col gap-[8px] px-[24px]">
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">จำนวนเงิน (¥)</p>
          <div className="flex h-[56px] overflow-hidden rounded-[14px] border border-[#e5e1d7] bg-white focus-within:border-[#14110d]">
            <div className="flex w-[48px] shrink-0 items-center justify-center border-r border-[#e5e1d7]">
              <span className="text-[16px] font-medium text-[#767168]">¥</span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent px-[16px] text-[20px] font-medium tracking-[-0.2px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
            />
          </div>
        </div>

        {/* ── Paid by ── */}
        <div className="flex flex-col gap-[10px] px-[24px]">
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ใครจ่าย</p>
          <div className="flex flex-wrap gap-[6px]">
            {MEMBERS.map((m) => (
              <MemberPill
                key={m.id}
                m={m}
                selected={paidBy === m.id}
                onClick={() => setPaidBy(m.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Split among ── */}
        <div className="flex flex-col gap-[10px] px-[24px]">
          <div className="flex items-baseline gap-[6px]">
            <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">หารกับ</p>
            <p className="text-[11px] tracking-[0.08px] text-[#b5b0a4]">{splitAmong.size} คน</p>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {MEMBERS.map((m) => (
              <MemberPill
                key={m.id}
                m={m}
                selected={splitAmong.has(m.id)}
                onClick={() => toggleSplit(m.id)}
              />
            ))}
          </div>

          {/* Per-person preview */}
          {perPersonFmt && (
            <div className="flex items-center justify-between rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] py-[13px]">
              <span className="text-[13px] font-light tracking-[0.08px] text-[#767168]">
                ต่อคน ({splitAmong.size} คน)
              </span>
              <span className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                ¥{perPersonFmt}
              </span>
            </div>
          )}
        </div>

        {/* ── Save ── */}
        <div className="px-[24px]">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => router.back()}
            className={`flex h-[51px] w-full items-center justify-center rounded-[18px] text-[16px] font-medium tracking-[0.08px] transition-opacity ${
              canSave
                ? "bg-[#c0613e] text-[#fcede3]"
                : "bg-[#e5e1d7] text-[#b5b0a4]"
            }`}
          >
            บันทึก
          </button>
        </div>

      </div>
    </main>
  );
}
