"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { label: "ทริป",         icon: "/images/icon-tab-trip.svg",     active: false, route: "/trips/demo/member" },
  { label: "วันว่าง",      icon: "/images/icon-tab-calendar.svg", active: false, route: "/trips/demo/member/availability" },
  { label: "บัญชี",        icon: "/images/icon-tab-wallet.svg",   active: false, route: "/trips/demo/member/wallet" },
  { label: "อุปกรณ์เสริม", icon: "/images/icon-tab-tools.svg",   active: true },
];

type Voter = "ton" | "james" | "nai" | "atif";

const MEMBER_INFO: Record<Voter, { initial: string; color: string }> = {
  ton:   { initial: "ต", color: "#c0613e" },
  james: { initial: "จ", color: "#4f6e7a" },
  nai:   { initial: "น", color: "#7b8b57" },
  atif:  { initial: "อ", color: "#8a6e9e" },
};

function AvatarStack({ voters }: { voters: Voter[] }) {
  if (voters.length === 0) return null;
  const AVATAR = 16;
  const STEP = 12;
  const totalW = AVATAR + (voters.length - 1) * STEP;
  return (
    <div className="relative h-[16px] shrink-0" style={{ width: totalW }}>
      {voters.map((v, i) => {
        const info = MEMBER_INFO[v];
        return (
          <div
            key={v}
            className="absolute top-0 flex h-[16px] w-[16px] items-center justify-center rounded-[8px] border-[0.8px] border-white text-[8px] font-medium text-white"
            style={{ left: i * STEP, backgroundColor: info.color }}
          >
            {info.initial}
          </div>
        );
      })}
    </div>
  );
}

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

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#f2efe8]"
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M1 1L7 7M7 1L1 7" stroke="#767168" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </button>
  );
}

type GroupItem   = { id: string; text: string; voters: Voter[] };
type PersonalItem = { id: string; text: string };

const INITIAL_GROUP: GroupItem[] = [
  { id: "g1", text: "Pocket WiFi",                         voters: ["ton", "nai"] },
  { id: "g2", text: "Power adapter (ปลั๊ก A)",             voters: ["ton", "james", "atif"] },
  { id: "g3", text: "Universal travel insurance",           voters: ["ton", "nai"] },
  { id: "g4", text: "ยาสามัญ (paracetamol, แก้แพ้)",       voters: ["ton", "nai"] },
];

const INITIAL_PERSONAL: PersonalItem[] = [
  { id: "p1", text: "Passport (เช็ควันหมดอายุ)" },
  { id: "p2", text: "เสื้อกันหนาว ~10°C" },
  { id: "p3", text: "รองเท้าเดินนานๆ ใส่สบาย" },
  { id: "p4", text: "ที่ชาร์จมือถือ" },
  { id: "p5", text: "บัตรเครดิตแจ้งใช้ตปท." },
];

export default function PackingListPage() {
  const router = useRouter();

  const [groupItems,    setGroupItems]    = useState<GroupItem[]>(INITIAL_GROUP);
  const [groupChecked,  setGroupChecked]  = useState<Set<string>>(new Set(["g1", "g3"]));
  const [personalItems, setPersonalItems] = useState<PersonalItem[]>(INITIAL_PERSONAL);
  const [personalChecked, setPersonalChecked] = useState<Set<string>>(new Set());

  const [editingSection, setEditingSection] = useState<"group" | "personal" | null>(null);
  const [newGroupText,    setNewGroupText]   = useState("");
  const [newPersonalText, setNewPersonalText] = useState("");

  function toggleGroup(id: string) {
    setGroupChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePersonal(id: string) {
    setPersonalChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function deleteGroupItem(id: string) {
    setGroupItems((prev) => prev.filter((i) => i.id !== id));
    setGroupChecked((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  function addGroupItem() {
    const text = newGroupText.trim();
    if (!text) return;
    const id = `g-${Date.now()}`;
    setGroupItems((prev) => [...prev, { id, text, voters: ["ton", "james", "nai", "atif"] }]);
    setNewGroupText("");
  }

  function deletePersonalItem(id: string) {
    setPersonalItems((prev) => prev.filter((i) => i.id !== id));
    setPersonalChecked((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  function addPersonalItem() {
    const text = newPersonalText.trim();
    if (!text) return;
    const id = `p-${Date.now()}`;
    setPersonalItems((prev) => [...prev, { id, text }]);
    setNewPersonalText("");
  }

  const gDone = groupItems.filter((i) => groupChecked.has(i.id)).length;
  const pDone = personalItems.filter((i) => personalChecked.has(i.id)).length;

  const editingGroup    = editingSection === "group";
  const editingPersonal = editingSection === "personal";

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] pb-[100px] pt-[65px] px-[24px]">

        {/* Header */}
        <div className="flex items-center gap-[12px]">
          <button
            type="button"
            onClick={() => router.push("/trips/demo/tools")}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px]" />
          </button>
          <p className="flex-1 text-[22px] font-medium tracking-[0.08px] text-[#14110d]">Packing List</p>
        </div>

        {/* Section: ของกลาง */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between pb-[8px]">
            <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ของกลาง</p>
            <div className="flex items-center gap-[10px]">
              <p className="text-[10.5px] font-light tracking-[0.63px] text-[#767168]">
                {gDone}/{groupItems.length}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingSection(editingGroup ? null : "group");
                  setNewGroupText("");
                }}
                className={`flex h-[22px] items-center gap-[6px] rounded-[14px] border px-[10px] transition-colors ${
                  editingGroup
                    ? "border-[#14110d] bg-[#14110d]"
                    : "border-[#e5e1d7] bg-white"
                }`}
              >
                {!editingGroup && <span className="text-[10px] leading-none text-[#14110d]">+</span>}
                <p className={`text-[8px] font-medium tracking-[0.13px] ${editingGroup ? "text-white" : "text-[#14110d]"}`}>
                  {editingGroup ? "เสร็จ" : "แก้ไข"}
                </p>
              </button>
            </div>
          </div>

          {groupItems.map((item, i) => {
            const checked = groupChecked.has(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-[12px] py-[10px] ${
                  i < groupItems.length - 1 ? "border-b border-[#e5e1d7]" : ""
                }`}
              >
                <Checkbox checked={checked} onToggle={() => toggleGroup(item.id)} />
                <p
                  className={`flex-1 text-[14px] font-light tracking-[0.08px] ${
                    checked ? "line-through text-[#b5b0a4]" : "text-[#14110d]"
                  }`}
                >
                  {item.text}
                </p>
                <AvatarStack voters={item.voters} />
                <p className="shrink-0 text-[10.5px] font-light tracking-[0.42px] text-[#767168]">ทุกคน</p>
                {editingGroup && <DeleteButton onDelete={() => deleteGroupItem(item.id)} />}
              </div>
            );
          })}

          {editingGroup && (
            <div className="flex items-center gap-[8px] pt-[12px]">
              <input
                type="text"
                placeholder="เพิ่มรายการ..."
                value={newGroupText}
                onChange={(e) => setNewGroupText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGroupItem()}
                className="flex-1 rounded-[10px] border border-[#e5e1d7] bg-white px-[12px] py-[8px] text-[13px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4] focus:border-[#14110d]"
              />
              <button
                type="button"
                onClick={addGroupItem}
                className="flex h-[36px] shrink-0 items-center rounded-[10px] bg-[#14110d] px-[14px] text-[12px] font-medium text-white"
              >
                เพิ่ม
              </button>
            </div>
          )}
        </div>

        {/* Section: ของส่วนตัว */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between pb-[8px]">
            <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
              ของส่วนตัว · ใครต้องเตรียมเอง
            </p>
            <div className="flex items-center gap-[10px]">
              <p className="text-[10.5px] font-light tracking-[0.63px] text-[#767168]">
                {pDone}/{personalItems.length}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingSection(editingPersonal ? null : "personal");
                  setNewPersonalText("");
                }}
                className={`flex h-[22px] items-center gap-[6px] rounded-[14px] border px-[10px] transition-colors ${
                  editingPersonal
                    ? "border-[#14110d] bg-[#14110d]"
                    : "border-[#e5e1d7] bg-white"
                }`}
              >
                {!editingPersonal && <span className="text-[10px] leading-none text-[#14110d]">+</span>}
                <p className={`text-[8px] font-medium tracking-[0.13px] ${editingPersonal ? "text-white" : "text-[#14110d]"}`}>
                  {editingPersonal ? "เสร็จ" : "แก้ไข"}
                </p>
              </button>
            </div>
          </div>

          {personalItems.map((item, i) => {
            const checked = personalChecked.has(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-[12px] py-[10px] ${
                  i < personalItems.length - 1 ? "border-b border-[#e5e1d7]" : ""
                }`}
              >
                <Checkbox checked={checked} onToggle={() => togglePersonal(item.id)} />
                <p
                  className={`flex-1 text-[14px] font-light tracking-[0.08px] ${
                    checked ? "line-through text-[#b5b0a4]" : "text-[#14110d]"
                  }`}
                >
                  {item.text}
                </p>
                {editingPersonal && <DeleteButton onDelete={() => deletePersonalItem(item.id)} />}
              </div>
            );
          })}

          {editingPersonal && (
            <div className="flex items-center gap-[8px] pt-[12px]">
              <input
                type="text"
                placeholder="เพิ่มรายการ..."
                value={newPersonalText}
                onChange={(e) => setNewPersonalText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPersonalItem()}
                className="flex-1 rounded-[10px] border border-[#e5e1d7] bg-white px-[12px] py-[8px] text-[13px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4] focus:border-[#14110d]"
              />
              <button
                type="button"
                onClick={addPersonalItem}
                className="flex h-[36px] shrink-0 items-center rounded-[10px] bg-[#14110d] px-[14px] text-[12px] font-medium text-white"
              >
                เพิ่ม
              </button>
            </div>
          )}
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
