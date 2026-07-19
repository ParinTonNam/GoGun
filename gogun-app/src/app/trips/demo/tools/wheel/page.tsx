"use client";

import { useState } from "react";
import { PageHeader, DEMO_USER } from "@/components/page-header";
import { MemberBottomNav } from "@/components/member-bottom-nav";

const OPTION_COLORS = ["#c0613e", "#4f6e7a", "#7b8b57", "#8a6e9e", "#b58a4f", "#5b7c6e"];
const SIZE = 272;
const R = SIZE / 2;

function toRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180;
}

function slicePath(startDeg: number, endDeg: number): string {
  const x1 = R + (R - 2) * Math.cos(toRad(startDeg));
  const y1 = R + (R - 2) * Math.sin(toRad(startDeg));
  const x2 = R + (R - 2) * Math.cos(toRad(endDeg));
  const y2 = R + (R - 2) * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${R} ${R} L ${x1} ${y1} A ${R - 2} ${R - 2} 0 ${large} 1 ${x2} ${y2} Z`;
}

type Option = { id: string; text: string };

function sliceTextWidth(n: number, textRadius: number): number {
  const halfAngleRad = Math.PI / n;
  return 2 * textRadius * Math.sin(halfAngleRad) * 0.78;
}

function wrapText(text: string, maxPx: number, charPx: number): string[] {
  const max = Math.max(3, Math.floor(maxPx / charPx));
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const candidate = cur ? `${cur} ${word}` : word;
    if (candidate.length > max && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function SpinWheel({ options, totalDeg, spinning }: { options: Option[]; totalDeg: number; spinning: boolean }) {
  if (options.length === 0) {
    return (
      <div className="flex size-[272px] items-center justify-center rounded-full bg-[#f2efe8]">
        <p className="text-[12px] font-light text-[#767168]">ไม่มีตัวเลือก</p>
      </div>
    );
  }

  const n = options.length;
  const seg = 360 / n;
  const fontSize = n <= 3 ? 13 : n <= 5 ? 11 : 10;
  const textR = R * (n <= 2 ? 0.55 : 0.62);
  const lineH = fontSize * 1.35;
  const charW = fontSize * 0.54;
  const availW = sliceTextWidth(n, textR);

  return (
    <div className="relative size-[272px]">
      {/* Fixed pointer */}
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[4px]">
        <svg width="22" height="16" viewBox="0 0 22 16">
          <polygon points="11,16 0,0 22,0" fill="#14110d" />
        </svg>
      </div>

      {/* Rotating wheel */}
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${totalDeg}deg)`,
          transition: spinning ? "transform 3s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
        }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {options.map((opt, i) => {
            const startDeg = i * seg;
            const endDeg = (i + 1) * seg;
            const midDeg = startDeg + seg / 2;
            const midRad = toRad(midDeg);
            const tx = R + textR * Math.cos(midRad);
            const ty = R + textR * Math.sin(midRad);
            const lines = wrapText(opt.text, availW, charW);

            return (
              <g key={opt.id}>
                <path
                  d={slicePath(startDeg, endDeg)}
                  fill={OPTION_COLORS[i % OPTION_COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={fontSize}
                  fontFamily="Kanit, sans-serif"
                  fontWeight="300"
                  transform={`rotate(${midDeg}, ${tx}, ${ty})`}
                >
                  {lines.map((line, li) => (
                    <tspan
                      key={li}
                      x={tx}
                      y={ty + (li - (lines.length - 1) / 2) * lineH}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Center circle */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="flex size-[54px] items-center justify-center rounded-full border border-[#e5e1d7] bg-white">
          <p className="text-[11px] font-medium text-[#14110d]" style={{ fontFamily: "Kanit, sans-serif" }}>
            SPIN
          </p>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_OPTIONS: Option[] = [
  { id: "1", text: "Sushi Dai" },
  { id: "2", text: "Ichiran" },
  { id: "3", text: "Tsuta ramen" },
  { id: "4", text: "Convenience store" },
  { id: "5", text: "Tonkatsu Maisen" },
  { id: "6", text: "ไหว้ก่อน, อิ่มก่อน" },
];

export default function WheelPage() {
  const [options, setOptions] = useState<Option[]>(DEFAULT_OPTIONS);
  const [newText, setNewText] = useState("");
  const [totalDeg, setTotalDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  function spin() {
    if (spinning || options.length === 0) return;

    const n = options.length;
    const seg = 360 / n;

    // Pick a random winner
    const idx = Math.floor(Math.random() * n);

    // To land segment idx under the top pointer after rotating clockwise by D:
    // The pointer (at 0°) maps to wheel-angle (360 - D % 360) % 360.
    // We want that to equal the mid-angle of segment idx.
    // mid-angle = idx * seg + seg/2
    // So (360 - D % 360) % 360 = idx * seg + seg/2
    // => D % 360 = (360 - (idx * seg + seg/2)) % 360
    const targetMod = (360 - (idx * seg + seg / 2) + 360) % 360;
    const currentMod = ((totalDeg % 360) + 360) % 360;
    const extra = (targetMod - currentMod + 360) % 360;
    const newTotal = totalDeg + 5 * 360 + extra;

    setWinnerIdx(null);
    setTotalDeg(newTotal);
    setSpinning(true);

    setTimeout(() => {
      setSpinning(false);
      setWinnerIdx(idx);
    }, 3000);
  }

  function addOption() {
    const t = newText.trim();
    if (!t) return;
    setOptions((prev) => [...prev, { id: Date.now().toString(), text: t }]);
    setNewText("");
    setWinnerIdx(null);
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
    setWinnerIdx(null);
  }

  const winnerText = winnerIdx !== null ? options[winnerIdx]?.text : null;

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[100px] pt-[24px]">
        {/* Header */}
        <div className="px-[24px]">
          <PageHeader
            title="กงล้อสุ่ม"
            backHref="/trips/demo/tools"
            user={DEMO_USER}
            right={
              <p className="text-[11px] font-light tracking-[0.66px] text-[#767168]">
                {options.length} ตัวเลือก
              </p>
            }
          />
        </div>

        {/* Wheel + controls */}
        <div className="flex flex-col items-center px-[24px]">
          <SpinWheel options={options} totalDeg={totalDeg} spinning={spinning} />

          {/* Status label */}
          <div className="flex items-center justify-center py-[14px] w-full">
            <p className="text-[11px] font-light uppercase tracking-[0.5px] text-[#767168]">
              {winnerText
                ? `${winnerText} ชนะ!`
                : spinning
                ? "กำลังหมุน…"
                : "พร้อมหมุน"}
            </p>
          </div>

          {/* Spin button */}
          <div className="pb-[18px] pt-[4px] w-full">
            <button
              type="button"
              onClick={spin}
              disabled={spinning || options.length === 0}
              className="flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#e85a2c] text-[14px] font-medium text-white tracking-[0.14px] disabled:opacity-50"
            >
              หมุน!
            </button>
          </div>
        </div>

        {/* Options list */}
        <div className="flex flex-col px-[24px] pt-[6px]">
          {options.map((opt, i) => (
            <div
              key={opt.id}
              className={`flex items-center gap-[10px] py-[10px] ${
                i < options.length - 1 ? "border-b border-[#e5e1d7]" : ""
              }`}
            >
              <div className="flex h-[21px] shrink-0 flex-col py-[3.5px] w-[14px]">
                <div
                  className="flex-1 min-h-0 rounded-[4px]"
                  style={{ backgroundColor: OPTION_COLORS[i % OPTION_COLORS.length] }}
                />
              </div>
              <p
                className={`flex-1 text-[14px] tracking-[0.08px] text-[#14110d] ${
                  winnerIdx === i ? "font-medium" : "font-light"
                }`}
              >
                {opt.text}
              </p>
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                className="flex size-[34px] shrink-0 items-center justify-center rounded-full transition-colors active:bg-[#fce8e2]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6.25" stroke="#d4cfc2" strokeWidth="1.2" />
                  <path d="M4.5 7H9.5" stroke="#767168" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add option */}
        <div className="px-[24px] pt-[6px]">
          <p className="pb-[10px] text-[11px] uppercase tracking-[1.54px] text-[#767168]">OPTIONS</p>
          <div className="flex items-start gap-[8px] pt-[14px]">
            <div className="flex-1 border-b border-[#e5e1d7] pb-[13px] pt-[12px]">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()}
                placeholder="เพิ่มตัวเลือกใหม่…"
                className="w-full bg-transparent text-[15px] text-[#14110d] outline-none placeholder:text-[#757575]"
              />
            </div>
            <button
              type="button"
              onClick={addOption}
              disabled={!newText.trim()}
              className="flex size-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#e85a2c] disabled:opacity-40"
            >
              <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
            </button>
          </div>
        </div>
      </div>
      <MemberBottomNav active="tools" />
    </main>
  );
}
