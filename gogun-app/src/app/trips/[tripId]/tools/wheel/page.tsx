"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWheel,
  addWheelOption,
  deleteWheelOption,
  clearWheel,
  type WheelOption,
} from "@/lib/api";

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

function SpinWheel({
  options,
  totalDeg,
  spinning,
}: {
  options: WheelOption[];
  totalDeg: number;
  spinning: boolean;
}) {
  if (options.length === 0) {
    return (
      <div className="flex size-[272px] items-center justify-center rounded-full bg-[#f2efe8]">
        <p className="text-[12px] font-light text-[#767168]">ไม่มีตัวเลือก</p>
      </div>
    );
  }

  const n = options.length;
  const seg = 360 / n;
  const fontSize = n <= 3 ? 13 : n <= 5 ? 11 : 9;
  const maxChars = n <= 3 ? 15 : n <= 5 ? 11 : 8;
  const textR = R * (n <= 2 ? 0.55 : 0.63);

  return (
    <div className="relative size-[272px]">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[3px]">
        <svg width="14" height="10" viewBox="0 0 14 10">
          <polygon points="7,10 0,0 14,0" fill="#14110d" />
        </svg>
      </div>
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
            const label = opt.text.length > maxChars ? opt.text.slice(0, maxChars - 1) + "…" : opt.text;
            const color = opt.color || OPTION_COLORS[i % OPTION_COLORS.length];
            return (
              <g key={opt.id}>
                {n === 1 ? (
                  <circle cx={R} cy={R} r={R - 2} fill={color} />
                ) : (
                  <path d={slicePath(startDeg, endDeg)} fill={color} stroke="white" strokeWidth={2} />
                )}
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={fontSize}
                  fontFamily="Kanit, sans-serif"
                  fontWeight="300"
                  transform={`rotate(${midDeg}, ${tx}, ${ty})`}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
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

export default function WheelPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [options, setOptions] = useState<WheelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [totalDeg, setTotalDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    const data = await getWheel(tripId);
    setOptions(data);
  }

  useEffect(() => {
    load().catch(console.error).finally(() => setLoading(false));
  }, [tripId]);

  function spin() {
    if (spinning || options.length === 0) return;
    const n = options.length;
    const seg = 360 / n;
    const idx = Math.floor(Math.random() * n);
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

  async function handleAdd() {
    const t = newText.trim();
    if (!t || adding) return;
    setAdding(true);
    try {
      const color = OPTION_COLORS[options.length % OPTION_COLORS.length];
      await addWheelOption(tripId, t, color);
      setNewText("");
      setWinnerIdx(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(optId: string) {
    try {
      await deleteWheelOption(tripId, optId);
      setWinnerIdx(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleClear() {
    if (options.length === 0) return;
    try {
      await clearWheel(tripId);
      setWinnerIdx(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  const winnerText = winnerIdx !== null ? options[winnerIdx]?.text : null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[100px] pt-[65px]">
        {/* Header */}
        <div className="flex items-center gap-[12px] pb-[18px] pt-[4px] px-[20px]">
          <button
            type="button"
            onClick={() => router.push(`/trips/${tripId}/tools`)}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="size-[14px]" />
          </button>
          <p className="flex-1 text-[22px] font-medium tracking-[0.08px] text-[#14110d]">กงล้อสุ่ม</p>
          <div className="flex items-center gap-[12px]">
            {options.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[13px] font-medium tracking-[0.08px] text-[#e85a2c]"
              >
                ล้าง
              </button>
            )}
            <p className="text-[11px] font-light tracking-[0.66px] text-[#767168]">
              {options.length} ตัวเลือก
            </p>
          </div>
        </div>

        {/* Wheel + controls */}
        <div className="flex flex-col items-center px-[20px]">
          <SpinWheel options={options} totalDeg={totalDeg} spinning={spinning} />
          <div className="flex items-center justify-center py-[14px] w-full">
            <p className="text-[11px] font-light uppercase tracking-[0.5px] text-[#767168]">
              {winnerText ? `${winnerText} ชนะ!` : spinning ? "กำลังหมุน…" : "พร้อมหมุน"}
            </p>
          </div>
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
        <div className="flex flex-col px-[20px] pt-[6px]">
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
                  style={{ backgroundColor: opt.color || OPTION_COLORS[i % OPTION_COLORS.length] }}
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
                onClick={() => handleRemove(opt.id)}
                className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8] active:bg-[#fde8e0]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M11 1L1 11" stroke="#767168" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add option */}
        <div className="px-[20px] pt-[6px]">
          <p className="pb-[10px] text-[11px] uppercase tracking-[1.54px] text-[#767168]">OPTIONS</p>
          <div className="flex items-start gap-[8px] pt-[14px]">
            <div className="flex-1 border-b border-[#e5e1d7] pb-[13px] pt-[12px]">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="เพิ่มตัวเลือกใหม่…"
                className="w-full bg-transparent text-[15px] text-[#14110d] outline-none placeholder:text-[#757575]"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newText.trim() || adding}
              className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#e85a2c] disabled:opacity-40"
            >
              <img src="/images/icon-plus.svg" alt="" className="size-[16px]" />
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}
