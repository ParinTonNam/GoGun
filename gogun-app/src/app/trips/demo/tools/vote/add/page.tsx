"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative flex h-[26px] w-[44px] shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-[#e85a2c]" : "bg-[#d4cfc2]"
      }`}
    >
      <div
        className={`absolute h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-[20px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function formatDeadline(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export default function AddVotePage() {
  const router = useRouter();

  const [title,        setTitle]        = useState("");
  const [deadline,     setDeadline]     = useState("");
  const [options,      setOptions]      = useState(["", ""]);
  const [multiSelect,  setMultiSelect]  = useState(false);
  const [allowAdd,     setAllowAdd]     = useState(false);

  function updateOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  function addOption() {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  const filledOptions = options.filter((o) => o.trim().length > 0);
  const canCreate = title.trim().length > 0 && filledOptions.length >= 2;

  function handleCreate() {
    if (!canCreate) return;
    const deadlineLabel = formatDeadline(deadline);
    const newPoll = {
      id: `poll-${Date.now()}`,
      title: title.trim(),
      subtitle: deadlineLabel
        ? `ปิดโหวต ${deadlineLabel} · 4 คนต้องโหวต`
        : "4 คนต้องโหวต",
      status: "open",
      totalVoters: 4,
      createdBy: "ton",
      options: filledOptions.map((text, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text,
        baseVotes: 0,
        baseVoters: [],
      })),
    };
    try {
      const existing = JSON.parse(sessionStorage.getItem("new_polls") ?? "[]");
      sessionStorage.setItem("new_polls", JSON.stringify([...existing, newPoll]));
    } catch {}
    router.back();
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[28px] pb-[48px] pt-[20px]">

        {/* Header */}
        <div className="flex items-center gap-[12px] px-[24px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px]" />
          </button>
          <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">สร้างโหวต</p>
        </div>

        {/* Topic */}
        <div className="flex flex-col gap-[8px] px-[24px]">
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">หัวข้อ</p>
          <input
            type="text"
            placeholder="เช่น เลือกที่พัก Kyoto"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-[48px] w-full rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4] focus:border-[#14110d]"
          />
        </div>

        {/* Deadline — native date picker */}
        <div className="flex flex-col gap-[8px] px-[24px]">
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
            วันที่ปิดโหวต
            <span className="ml-[5px] text-[#b5b0a4]">(ไม่บังคับ)</span>
          </p>
          <div className={`flex h-[48px] items-center rounded-[14px] border bg-white px-[16px] ${deadline ? "border-[#14110d]" : "border-[#e5e1d7]"}`}>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex-1 bg-transparent text-[14px] tracking-[0.08px] text-[#14110d] outline-none [&::-webkit-calendar-picker-indicator]:opacity-50"
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-[10px] px-[24px]">
          <div className="flex items-baseline gap-[6px]">
            <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ตัวเลือก</p>
            <p className="text-[11px] tracking-[0.08px] text-[#b5b0a4]">อย่างน้อย 2 รายการ</p>
          </div>

          <div className="flex flex-col gap-[8px]">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-[8px]">
                <div className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-[#e5e1d7] bg-white text-[10px] font-medium text-[#767168]">
                  {i + 1}
                </div>
                <input
                  type="text"
                  placeholder={`ตัวเลือกที่ ${i + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="h-[44px] flex-1 rounded-[12px] border border-[#e5e1d7] bg-white px-[14px] text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4] focus:border-[#14110d]"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#f2efe8]"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 1L7 7M7 1L1 7" stroke="#767168" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 8 && (
            <button
              type="button"
              onClick={addOption}
              className="flex h-[44px] items-center justify-center gap-[6px] rounded-[12px] border border-dashed border-[#d4cfc2] text-[13px] font-light text-[#767168]"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="#767168" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              เพิ่มตัวเลือก
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-[0px] px-[24px]">
          <p className="pb-[10px] text-[12px] font-light tracking-[0.08px] text-[#767168]">ตั้งค่า</p>
          <div className="flex flex-col divide-y divide-[#e5e1d7] rounded-[16px] border border-[#e5e1d7] bg-white">
            {/* Multi-select toggle */}
            <div className="flex items-center justify-between px-[18px] py-[14px]">
              <div className="flex flex-col gap-[2px]">
                <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">เลือกหลายรายการได้</p>
                <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">
                  ผู้โหวตกาได้มากกว่า 1 ตัวเลือก
                </p>
              </div>
              <Toggle on={multiSelect} onToggle={() => setMultiSelect((v) => !v)} />
            </div>
            {/* Allow adding choices toggle */}
            <div className="flex items-center justify-between px-[18px] py-[14px]">
              <div className="flex flex-col gap-[2px]">
                <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">เพิ่มช้อยได้</p>
                <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">
                  ผู้โหวตเพิ่มตัวเลือกของตัวเองได้
                </p>
              </div>
              <Toggle on={allowAdd} onToggle={() => setAllowAdd((v) => !v)} />
            </div>
          </div>
        </div>

        {/* Create button */}
        <div className="px-[24px]">
          <button
            type="button"
            disabled={!canCreate}
            onClick={handleCreate}
            className={`flex h-[51px] w-full items-center justify-center rounded-[18px] text-[16px] font-medium tracking-[0.08px] transition-colors ${
              canCreate ? "bg-[#14110d] text-white" : "bg-[#e5e1d7] text-[#b5b0a4]"
            }`}
          >
            สร้างโหวต
          </button>
        </div>

      </div>
    </main>
  );
}
