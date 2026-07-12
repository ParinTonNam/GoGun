"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { label: "ทริป",         icon: "/images/icon-tab-trip.svg",     active: false, route: "/trips/demo/member" },
  { label: "วันว่าง",      icon: "/images/icon-tab-calendar.svg", active: false, route: "/trips/demo/member/availability" },
  { label: "บัญชี",        icon: "/images/icon-tab-wallet.svg",   active: false, route: "/trips/demo/member/wallet" },
  { label: "อุปกรณ์เสริม", icon: "/images/icon-tab-tools.svg",   active: true },
];

type MemberId = "ton" | "james" | "nai" | "atif";

const MEMBERS: { id: MemberId; name: string; initial: string; color: string }[] = [
  { id: "ton",   name: "ต้นน้ำ",       initial: "ต", color: "#c0613e" },
  { id: "james", name: "เจมส์ (คุณ)",  initial: "จ", color: "#4f6e7a" },
  { id: "nai",   name: "นาย",          initial: "น", color: "#7b8b57" },
  { id: "atif",  name: "อาตีฟ",        initial: "อ", color: "#8a6e9e" },
];

const DEFAULT_ITEMS = [
  { id: "1", text: "ทำวีซ่า Japan / เช็คพาสปอร์ต" },
  { id: "2", text: "จองตั๋วเครื่องบินจ่ายแบ่งเข้ากองทุน" },
  { id: "3", text: "แลกเงินเยน (ต่อคน ¥30,000)" },
  { id: "4", text: "โหลด Suica / IC card บนมือถือ" },
  { id: "5", text: "ส่ง itinerary ให้ทางบ้านรับทราบ" },
  { id: "6", text: "เช็คสภาพอากาศ + เตรียมเสื้อหนาว" },
];

// Initial checks per member (set of item ids)
const INITIAL_CHECKS: Record<MemberId, Set<string>> = {
  ton:   new Set(["1", "2", "3", "5", "6"]),
  james: new Set(["1", "2", "3", "5", "6"]),
  nai:   new Set(["1", "2", "3"]),
  atif:  new Set(["1", "3", "5"]),
};

function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border ${
        checked ? "border-[#14110d] bg-[#14110d]" : "border-[#d4cfc2]"
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function ChecklistPage() {
  const router = useRouter();
  const [activeMember, setActiveMember] = useState<MemberId>("james");
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [checks, setChecks] = useState<Record<MemberId, Set<string>>>(INITIAL_CHECKS);
  const [newText, setNewText] = useState("");

  function toggleItem(itemId: string) {
    setChecks((prev) => {
      const memberSet = new Set(prev[activeMember]);
      memberSet.has(itemId) ? memberSet.delete(itemId) : memberSet.add(itemId);
      return { ...prev, [activeMember]: memberSet };
    });
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setChecks((prev) => {
      const next = { ...prev };
      (Object.keys(next) as MemberId[]).forEach((m) => {
        const s = new Set(next[m]);
        s.delete(itemId);
        next[m] = s;
      });
      return next;
    });
  }

  function addItem() {
    const t = newText.trim();
    if (!t) return;
    const id = Date.now().toString();
    setItems((prev) => [...prev, { id, text: t }]);
    setNewText("");
  }

  function getProgress(memberId: MemberId): string {
    const done = items.filter((i) => checks[memberId].has(i.id)).length;
    return `${done}/${items.length}`;
  }

  const activeChecks = checks[activeMember];
  const doneCount = items.filter((i) => activeChecks.has(i.id)).length;

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] pb-[100px] pt-[65px] px-[24px]">
        {/* Header */}
        <div className="flex items-center gap-[12px] pb-[18px] pt-[4px]">
          <button
            type="button"
            onClick={() => router.push("/trips/demo/tools")}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="size-[14px]" />
          </button>
          <p className="flex-1 text-[22px] font-medium tracking-[0.08px] text-[#14110d]">เช็คลิสต์</p>
          <p className="text-[11px] font-light tracking-[0.66px] text-[#767168]">
            {doneCount}/{items.length}
          </p>
        </div>

        {/* Member filter pills */}
        <div className="flex gap-[8px] overflow-x-auto pb-[12px]">
          {MEMBERS.map((m) => {
            const active = activeMember === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMember(m.id)}
                className={`flex shrink-0 items-center gap-[6px] rounded-[999px] border py-[7px] pl-[7px] pr-[13px] ${
                  active
                    ? "border-[#14110d] bg-[#14110d]"
                    : "border-[#e5e1d7] bg-white"
                }`}
              >
                <div
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-[11px] text-[10px] font-medium text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.initial}
                </div>
                <p
                  className={`text-[12px] font-light tracking-[0.08px] ${
                    active ? "text-[#f7f5f0]" : "text-[#14110d]"
                  }`}
                >
                  {m.name}
                </p>
                <p
                  className={`text-[10px] font-light tracking-[0.4px] ${
                    active ? "text-[rgba(255,255,255,0.7)]" : "text-[#767168]"
                  }`}
                >
                  {getProgress(m.id)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Items list */}
        <div className="flex flex-col">
          {items.map((item, i) => {
            const checked = activeChecks.has(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-[12px] py-[10px] ${
                  i < items.length - 1 ? "border-b border-[#e5e1d7]" : ""
                }`}
              >
                <Checkbox checked={checked} onToggle={() => toggleItem(item.id)} />
                <p
                  className={`flex-1 text-[14px] font-light tracking-[0.08px] ${
                    checked ? "line-through text-[#b5b0a4]" : "text-[#14110d]"
                  }`}
                >
                  {item.text}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="flex shrink-0 size-[10px] items-center justify-center"
                >
                  <img src="/images/icon-minus-sm.svg" alt="ลบ" className="block size-full" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add item */}
        <div className="flex items-start gap-[8px]">
          <div className="flex-1 border-b border-[#e5e1d7] pb-[15px] pt-[14px]">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="สิ่งที่ต้องทำ เช่น ทำ passport"
              className="w-full bg-transparent text-[14px] text-[#14110d] outline-none placeholder:text-[#757575]"
            />
          </div>
          <div className="pt-[5.5px]">
            <button
              type="button"
              onClick={addItem}
              disabled={!newText.trim()}
              className="flex items-center gap-[8px] rounded-[14px] bg-[#14110d] p-[10px] disabled:opacity-40"
            >
              <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
              <p className="text-[13px] font-medium tracking-[0.13px] text-[#f7f5f0]">เพิ่ม</p>
            </button>
          </div>
        </div>
      </div>
      {/* Fixed bottom tab bar */}
      <div className="fixed bottom-[8px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-14px)] max-w-[376px]">
        <div className="flex h-[62px] items-start rounded-[18px] border border-[#d4cfc2] bg-white pt-[8px]">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => "route" in tab && tab.route && router.push(tab.route)}
              className="flex flex-1 flex-col items-center gap-[3px]"
            >
              <img src={tab.icon} alt="" className="size-[20px]" style={{ opacity: tab.active ? 1 : 0.45 }} />
              <p className={`text-[10px] tracking-[0.08px] ${tab.active ? "text-[#14110d]" : "font-light text-[#767168]"}`}>
                {tab.label}
              </p>
              <div className="size-[3px] rounded-full" style={{ backgroundColor: tab.active ? "#14110d" : "transparent" }} />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
