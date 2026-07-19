"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MemberBottomNav } from "@/components/member-bottom-nav";
import { PageHeader, DEMO_USER } from "@/components/page-header";

// ─── types & data ─────────────────────────────────────────────────────────────
type MemberId = "ton" | "james" | "nai" | "atif";

const AVATAR: Record<MemberId, { initial: string; color: string }> = {
  ton:   { initial: "ต", color: "#c0613e" },
  james: { initial: "จ", color: "#4f6e7a" },
  nai:   { initial: "น", color: "#7b8b57" },
  atif:  { initial: "อ", color: "#8a6e9e" },
};

const MEMBER_INFO: Record<MemberId, { initial: string; color: string; name: string }> = {
  ton:   { initial: "ต", color: "#c0613e", name: "ต้นน้ำ" },
  james: { initial: "จ", color: "#4f6e7a", name: "เจมส์"  },
  nai:   { initial: "น", color: "#7b8b57", name: "นาย"    },
  atif:  { initial: "อ", color: "#8a6e9e", name: "อาตีฟ"  },
};

const CATEGORY_LABELS: Record<string, string> = {
  "icon-expense-plane.svg":  "เครื่องบิน",
  "icon-expense-hotel.svg":  "ที่พัก",
  "icon-expense-train.svg":  "เดินทาง",
  "icon-expense-food.svg":   "อาหาร",
  "icon-expense-wifi.svg":   "อินเทอร์เน็ต",
  "icon-expense-ticket.svg": "ตั๋ว/กิจกรรม",
};

const EXPENSES: {
  icon: string; name: string; paidBy: string;
  split: number; avatarIds: MemberId[]; total: string; perPerson: string;
  addedBy: MemberId;
}[] = [
  { icon: "/images/icon-expense-plane.svg",  name: "ตั๋วเครื่องบิน × 4",       paidBy: "ต้นน้ำ", split: 4, avatarIds: ["ton","james","nai","atif"], total: "147,200", perPerson: "36,800", addedBy: "ton"   },
  { icon: "/images/icon-expense-hotel.svg",  name: "Shinjuku Granbell × 2 คืน", paidBy: "เจมส์",  split: 4, avatarIds: ["ton","james","nai","atif"], total: "36,400",  perPerson: "9,100",  addedBy: "james" },
  { icon: "/images/icon-expense-hotel.svg",  name: "Machiya Gion × 2 คืน",      paidBy: "ต้นน้ำ", split: 4, avatarIds: ["ton","james","nai","atif"], total: "44,000",  perPerson: "11,000", addedBy: "ton"   },
  { icon: "/images/icon-expense-train.svg",  name: "JR Pass × 4",               paidBy: "นาย",    split: 4, avatarIds: ["ton","james","nai","atif"], total: "23,400",  perPerson: "5,850",  addedBy: "nai"   },
  { icon: "/images/icon-expense-food.svg",   name: "Kaiseki dinner",             paidBy: "ต้นน้ำ", split: 4, avatarIds: ["ton","james","nai","atif"], total: "24,000",  perPerson: "6,000",  addedBy: "ton"   },
  { icon: "/images/icon-expense-wifi.svg",   name: "Pocket WiFi",                paidBy: "เจมส์",  split: 2, avatarIds: ["ton","nai"],               total: "1,800",   perPerson: "900",    addedBy: "james" },
  { icon: "/images/icon-expense-ticket.svg", name: "TeamLab tickets × 4",        paidBy: "ต้นน้ำ", split: 4, avatarIds: ["ton","james","nai","atif"], total: "14,000",  perPerson: "3,500",  addedBy: "ton"   },
];

const TRANSFERS = [
  { from: { initial: "จ", color: "#4f6e7a", name: "เจมส์" }, to: { initial: "ต", color: "#c0613e", name: "ต้นน้ำ" }, amount: "47,500", panelType: "qr" as const },
  { from: { initial: "น", color: "#7b8b57", name: "นาย" },   to: { initial: "ต", color: "#c0613e", name: "ต้นน้ำ" }, amount: "48,250", panelType: "promptpay" as const },
  { from: { initial: "อ", color: "#8a6e9e", name: "อาตีฟ" }, to: { initial: "ต", color: "#c0613e", name: "ต้นน้ำ" }, amount: "34,950", panelType: "promptpay" as const },
];

// ─── currency ─────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "JPY", sym: "¥",   label: "เยนญี่ปุ่น",         rate: 1       },
  { code: "THB", sym: "฿",   label: "บาทไทย",             rate: 0.24    },
  { code: "USD", sym: "$",   label: "ดอลลาร์สหรัฐ",       rate: 0.0067  },
  { code: "EUR", sym: "€",   label: "ยูโร",               rate: 0.0062  },
  { code: "GBP", sym: "£",   label: "ปอนด์อังกฤษ",        rate: 0.0052  },
  { code: "KRW", sym: "₩",   label: "วอนเกาหลี",          rate: 8.89    },
  { code: "CNY", sym: "元",  label: "หยวนจีน",            rate: 0.048   },
  { code: "HKD", sym: "HK$", label: "ดอลลาร์ฮ่องกง",      rate: 0.052   },
  { code: "SGD", sym: "S$",  label: "ดอลลาร์สิงคโปร์",    rate: 0.0091  },
  { code: "AUD", sym: "A$",  label: "ดอลลาร์ออสเตรเลีย",  rate: 0.010   },
];

// ─── sub-components ───────────────────────────────────────────────────────────
function AvatarStack({ ids }: { ids: MemberId[] }) {
  const itemW = 16, gap = 4;
  const totalW = ids.length * itemW - (ids.length - 1) * gap;
  return (
    <div className="relative h-[16px] shrink-0" style={{ width: `${totalW}px` }}>
      {ids.map((id, i) => (
        <div
          key={id}
          className="absolute flex h-[16px] min-w-[16px] items-center justify-center rounded-[8px] border-[0.8px] border-white"
          style={{ backgroundColor: AVATAR[id].color, left: `${i * (itemW - gap)}px`, zIndex: ids.length - i, paddingLeft: 3, paddingRight: 3 }}
        >
          <span className="text-[8px] font-medium leading-none text-white">{AVATAR[id].initial}</span>
        </div>
      ))}
    </div>
  );
}

function MemberPill({ initial, color, name }: { initial: string; color: string; name: string }) {
  return (
    <div className="relative h-[22px] w-[56px] shrink-0">
      <div className="absolute inset-y-[2px] left-[27px] right-0 flex items-center">
        <span className="whitespace-nowrap text-[12px] font-medium tracking-[0.08px] text-[#f7f5f0]">{name}</span>
      </div>
      <div
        className="absolute inset-y-0 left-0 z-10 flex w-[22px] items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <span className="text-[12px] font-medium text-white">{initial}</span>
      </div>
    </div>
  );
}

function MemberPillLarge({ initial, color, name }: { initial: string; color: string; name: string }) {
  return (
    <div className="relative h-[42px] w-[106px] shrink-0">
      <div className="absolute inset-y-0 left-[51px] right-0 flex items-center">
        <span className="whitespace-nowrap text-[20px] font-medium tracking-[0.08px] text-[#f7f5f0]">{name}</span>
      </div>
      <div
        className="absolute inset-y-0 left-0 z-10 flex w-[42px] items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <span className="text-[17px] font-medium text-white">{initial}</span>
      </div>
    </div>
  );
}

function CheckBadge() {
  return (
    <div className="flex size-[17px] shrink-0 items-center justify-center rounded-[8.5px] bg-[#e0f0e5]">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <path d="M1.5 4.5L3.5 6.5L7.5 2" stroke="#2e8b5c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─── Expense detail sheet ─────────────────────────────────────────────────────
function ExpenseDetailSheet({
  exp, onClose, sym, c,
}: {
  exp: typeof EXPENSES[0] | null;
  onClose: () => void;
  sym: string;
  c: (s: string) => string;
}) {
  const open = exp !== null;
  const adder = exp ? MEMBER_INFO[exp.addedBy] : null;
  const categoryLabel = exp
    ? (CATEGORY_LABELS[exp.icon.replace("/images/", "")] ?? "อื่นๆ")
    : "";

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-[60] w-full max-w-[420px] -translate-x-1/2 rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        {exp && (
          <div className="flex flex-col gap-[20px] px-[24px] pb-[40px] pt-[28px]">

            <div className="flex items-start justify-between gap-[12px]">
              <div className="flex items-center gap-[12px]">
                <div className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-[#f2efe8]">
                  <img src={exp.icon} alt="" className="size-[22px]" />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">{exp.name}</p>
                  <p className="text-[11px] tracking-[0.08px] text-[#767168]">{categoryLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#edeae2]"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1 1L10 10M10 1L1 10" stroke="#14110d" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex items-end justify-between rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[16px]">
              <div className="flex flex-col gap-[3px]">
                <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">รวมทั้งหมด</p>
                <p className="text-[28px] font-medium tracking-[-0.28px] text-[#14110d]">{sym}{c(exp.total)}</p>
              </div>
              <div className="flex flex-col items-end gap-[3px]">
                <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">ต่อคน</p>
                <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">{sym}{c(exp.perPerson)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-[0px] divide-y divide-[#e5e1d7] rounded-[18px] border border-[#e5e1d7] bg-white">
              <div className="flex items-center justify-between px-[20px] py-[14px]">
                <p className="text-[13px] font-light tracking-[0.08px] text-[#767168]">ผู้จ่าย</p>
                <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{exp.paidBy}</p>
              </div>
              <div className="flex items-center justify-between px-[20px] py-[14px]">
                <p className="text-[13px] font-light tracking-[0.08px] text-[#767168]">หารกับ</p>
                <div className="flex items-center gap-[8px]">
                  <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{exp.split} คน</p>
                  <AvatarStack ids={exp.avatarIds} />
                </div>
              </div>
              <div className="flex items-start justify-between px-[20px] py-[14px]">
                <p className="text-[13px] font-light tracking-[0.08px] text-[#767168]">สมาชิก</p>
                <p className="text-right text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
                  {exp.avatarIds.map((id) => MEMBER_INFO[id].name).join(" · ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-[10px] rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] py-[13px]">
              <p className="flex-1 text-[12px] font-light tracking-[0.08px] text-[#767168]">
                เพิ่มโดย
              </p>
              <div className="flex items-center gap-[6px]">
                <div
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
                  style={{ backgroundColor: adder!.color }}
                >
                  {adder!.initial}
                </div>
                <span className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
                  {adder!.name}
                </span>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}

// ─── Summary sheet ────────────────────────────────────────────────────────────
function SummarySheet({
  open, onClose, sym, c, paymentMethod, bankNumber, qrImageUrl,
}: {
  open: boolean;
  onClose: () => void;
  sym: string;
  c: (s: string) => string;
  paymentMethod: "qr" | "bank" | null;
  bankNumber: string;
  qrImageUrl: string | null;
}) {
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState([false, false, false]);
  const [numCopied, setNumCopied] = useState(false);

  const isBank = paymentMethod === "bank";

  function toggleRow(i: number) {
    setOpenRow((prev) => (prev === i ? null : i));
  }

  async function copyBankNumber() {
    try {
      await navigator.clipboard.writeText(bankNumber || "092-424-5***");
      setNumCopied(true);
      setTimeout(() => setNumCopied(false), 1500);
    } catch {}
  }

  function markPaid() {
    if (openRow === null) return;
    setConfirmed((prev) => {
      const next = [...prev];
      next[openRow] = true;
      return next;
    });
  }

  const activeTransfer = openRow !== null ? TRANSFERS[openRow] : null;
  const isConfirmed = openRow !== null && confirmed[openRow];

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-[60] flex max-h-[90vh] w-full max-w-[420px] -translate-x-1/2 flex-col overflow-y-auto rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex flex-col gap-[10px] px-[20px] py-[34px]">

          <div className="flex h-[36px] shrink-0 items-center justify-between">
            <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">สรุปทริปนี้</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#edeae2]"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1L10 10M10 1L1 10" stroke="#14110d" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-[5px] text-[13px] tracking-[0.08px]">
            <span className="text-[#767168]">หักล้างกันแล้ว</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">ลดรอบโอนให้น้อยที่สุด (3 รายการ)</span>
          </div>

          <div className="flex shrink-0 flex-col gap-[5px] rounded-[18px] bg-[#14110d] px-[20px] py-[15px]">

            <div className="flex flex-col gap-[3px]">
              <p className="text-[15px] font-medium tracking-[0.08px] text-[#f7f5f0]">โอนเงินให้ครบ</p>
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                {isBank ? "เมื่อโอนแล้ว แตะเพื่อดูบัญชีธนาคาร" : "เมื่อโอนแล้ว แตะเพื่อเปิดคิวอาร์โค้ด"}
              </p>
            </div>

            <div className="flex flex-col">
              {TRANSFERS.map((t, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/[0.07] py-[10px]">
                  <div className="flex items-center gap-[5px]">
                    <MemberPill {...t.from} />
                    <span className="text-[12px] font-medium text-[#767168]">→</span>
                    <MemberPill {...t.to} />
                  </div>
                  <div className="flex items-center gap-[10px]">
                    <span className="text-[15px] font-medium text-[#f7f5f0]">{sym}{c(t.amount)}</span>
                    {confirmed[i] ? (
                      <div className="flex size-[31px] shrink-0 items-center justify-center rounded-full bg-[#e0f0e5]">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L5.5 10.5L12 3" stroke="#2e8b5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleRow(i)}
                        className="flex size-[31px] shrink-0 items-center justify-center rounded-[12.7px] border border-[#e5e1d7] bg-white"
                      >
                        {isBank ? (
                          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                            <path d="M8.5 2L14.5 5.5H2.5L8.5 2Z" stroke="#767168" strokeWidth="1.2" strokeLinejoin="round" fill="#f2efe8"/>
                            <rect x="3" y="6" width="2" height="6" rx="0.6" fill="#767168"/>
                            <rect x="7.5" y="6" width="2" height="6" rx="0.6" fill="#767168"/>
                            <rect x="12" y="6" width="2" height="6" rx="0.6" fill="#767168"/>
                            <rect x="2" y="12.5" width="13" height="1.5" rx="0.6" fill="#767168"/>
                          </svg>
                        ) : (
                          <img src="/images/icon-qr.svg" alt="" className="size-[17px]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {activeTransfer && (
              <div className="flex flex-col items-center gap-[20px] py-[26px]">
                <p className="text-center text-[15px] font-medium tracking-[0.08px] text-[#f7f5f0]">
                  {isBank ? "คัดลอกพร้อมเพย์เพื่อจ่ายเงินให้" : "สแกนคิวอาร์โค้ดเพื่อจ่ายเงินให้"}
                </p>

                <MemberPillLarge {...activeTransfer.to} />

                {isBank ? (
                  <div className="flex w-full flex-col gap-[11px]">
                    <button
                      type="button"
                      onClick={copyBankNumber}
                      className="flex items-center justify-between rounded-[13px] border border-[#e5e1d7] bg-white px-[20px] py-[14px] transition-colors active:bg-[#f2efe8]"
                    >
                      <div className="flex items-center gap-[10px]">
                        <img src="/images/img-promptpay.png" alt="" className="size-[24px] rounded-[3px] object-cover" />
                        <span className="text-[11px] font-medium text-[#14110d]">
                          {bankNumber || "092-424-5***"}
                        </span>
                      </div>
                      <div className={`flex size-[30px] shrink-0 items-center justify-center rounded-[9px] transition-colors ${numCopied ? "bg-[#e0f0e5]" : "bg-[#f2efe8]"}`}>
                        {numCopied ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2.5 7L5.5 10L11.5 4" stroke="#2e8b5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <img src="/images/icon-copy.svg" alt="" className="size-[16px]" />
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={markPaid}
                      className={`flex w-full items-center justify-center gap-[6px] rounded-[13px] border border-[#e5e1d7] py-[14px] text-[11px] font-medium text-white transition-colors ${isConfirmed ? "bg-[#2e8b5c]" : "bg-[#e85a2c]"}`}
                    >
                      {isConfirmed ? "โอนแล้ว" : "ยืนยันว่าโอนแล้ว"}
                      {isConfirmed && <CheckBadge />}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex size-[184px] shrink-0 items-center justify-center rounded-[14px] bg-white p-[10px]">
                      <img src={qrImageUrl ?? "/images/img-qr-ton.png"} alt="" className="size-full object-contain" />
                    </div>
                    <div className="flex w-full gap-[11px]">
                      <button
                        type="button"
                        className="flex flex-1 items-center justify-center rounded-[13px] border border-[#e5e1d7] bg-white py-[14px] text-[11px] font-medium text-[#14110d]"
                      >
                        บันทึก QR
                      </button>
                      <button
                        type="button"
                        onClick={markPaid}
                        className={`flex flex-1 items-center justify-center gap-[6px] rounded-[13px] border border-[#e5e1d7] py-[14px] text-[11px] font-medium text-white transition-colors ${isConfirmed ? "bg-[#2e8b5c]" : "bg-[#e85a2c]"}`}
                      >
                        {isConfirmed ? "โอนแล้ว" : "ยืนยันว่าโอนแล้ว"}
                        {isConfirmed && <CheckBadge />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="shrink-0 text-[11px] tracking-[0.08px] text-[#767168]">
            * คำนวณโดยจับคู่ผู้ค้างกับผู้รับให้ใกล้เคียงกัน เพื่อลดจำนวนการโอน
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Currency picker sheet ─────────────────────────────────────────────────────
function CurrencyPickerSheet({
  open, currentIdx, onSelect, onClose,
}: {
  open: boolean;
  currentIdx: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-[70] w-full max-w-[420px] -translate-x-1/2 rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex flex-col pb-[40px] pt-[24px]">
          <div className="flex items-center justify-between px-[24px] pb-[16px]">
            <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">เลือกสกุลเงิน</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[36px] items-center justify-center rounded-full bg-[#edeae2]"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1L10 10M10 1L1 10" stroke="#14110d" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col divide-y divide-[#e5e1d7]">
            {CURRENCIES.map((cr, i) => (
              <button
                key={cr.code}
                type="button"
                onClick={() => onSelect(i)}
                className="flex items-center gap-[16px] px-[24px] py-[14px] transition-colors active:bg-[#f2efe8]"
              >
                <div className={`flex size-[40px] shrink-0 items-center justify-center rounded-[12px] ${currentIdx === i ? "bg-[#14110d]" : "bg-[#edeae2]"}`}>
                  <span className={`text-[16px] font-medium ${currentIdx === i ? "text-white" : "text-[#14110d]"}`}>
                    {cr.sym}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-start gap-[2px]">
                  <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{cr.label}</p>
                  <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">{cr.code}</p>
                </div>
                {currentIdx === i && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                    <path d="M3 8L6.5 11.5L13 4" stroke="#e85a2c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function MemberWalletPage() {
  const router = useRouter();
  const [qrImageUrl] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailExp, setDetailExp] = useState<typeof EXPENSES[0] | null>(null);
  const [currIdx, setCurrIdx] = useState(0);
  const [showCurrPicker, setShowCurrPicker] = useState(false);

  // payment method — persisted to localStorage.
  // Init to the server default (null / "") so the first client render matches
  // the SSR output, then hydrate the real value from localStorage after mount.
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "bank" | null>(null);
  const [bankNumber, setBankNumber] = useState<string>("");

  useEffect(() => {
    setPaymentMethod((localStorage.getItem("ton_payment_method") as "qr" | "bank" | null) ?? null);
    setBankNumber(localStorage.getItem("ton_bank_number") ?? "");
  }, []);

  const cur = CURRENCIES[currIdx];
  const sym = cur.sym;

  function c(yenStr: string): string {
    const yen = parseFloat(String(yenStr).replace(/,/g, ""));
    const val = yen * cur.rate;
    if (cur.code === "USD") {
      return val.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return Math.round(val).toLocaleString("en");
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[96px] pt-[24px]">

        {/* Header */}
        <div className="px-[24px]">
          <PageHeader user={DEMO_USER} />
        </div>

        {/* Title + total */}
        <div className="flex items-end gap-[24px] px-[24px] pt-[20px]">
          <div className="flex flex-1 flex-col gap-[8px]">
            <p className="text-[26px] font-medium tracking-[0.08px] text-[#14110d]">ค่าใช้จ่าย</p>
            <div className="flex items-center gap-[5px] text-[13px] tracking-[0.08px]">
              <span className="text-[#767168]">7 รายการ</span>
              <span className="text-[#b5b0a4]">·</span>
              <span className="text-[#767168]">4 คน</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-[6px]">
            {/* Currency picker dropdown */}
            <button
              type="button"
              onClick={() => setShowCurrPicker(true)}
              className="flex items-center gap-[6px] rounded-[10px] bg-[#edeae2] px-[10px] py-[6px] transition-colors active:bg-[#d4cfc2]"
            >
              <span className="text-[14px] font-medium text-[#14110d]">{cur.sym}</span>
              <span className="text-[11px] font-light text-[#767168]">{cur.code}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="#767168" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-[20px] tracking-[-0.32px] text-[#14110d]">{sym}{c("290,800")}</p>
          </div>
        </div>

        {/* Balance card + CTAs */}
        <div className="flex flex-col gap-[9px] px-[24px] pt-[24px]">
          <div className="flex items-center gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]">
            <div className="flex flex-1 flex-col gap-[5px]">
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">คุณต้องจ่ายเงินเพื่อน</p>
              <div className="flex items-end gap-[3px]">
                <span className="mb-[4px] text-[12px] text-[#767168]">{sym}</span>
                <span className="text-[22px] font-medium tracking-[-0.22px] text-[#e85a2c]">{c("34,950")}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-[12px] rounded-[9px] border border-[#e5e1d7] bg-white px-[26px] py-[10px]"
            >
              <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">สรุปทริปนี้</span>
              <img src="/images/icon-chevron-left.svg" alt="" className="size-[11px] rotate-180" />
            </button>
          </div>

          {/* Add expense — redesigned as action row */}
          <button
            type="button"
            onClick={() => router.push("/trips/demo/member/wallet/add")}
            className="flex h-[52px] w-full items-center gap-[14px] rounded-[18px] border border-[#e5e1d7] bg-white px-[16px] transition-colors active:bg-[#f2efe8]"
          >
            <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#14110d]">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1V10M1 5.5H10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="flex-1 text-left text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
              เพิ่มค่าใช้จ่าย
            </span>
            <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px] rotate-180 opacity-40" />
          </button>
        </div>

        {/* Expense list */}
        <div className="flex flex-col px-[20px] pt-[4px]">
          {EXPENSES.map((exp, i) => (
            <button
              key={exp.name + i}
              type="button"
              onClick={() => setDetailExp(exp)}
              className={`flex w-full items-center gap-[12px] py-[14px] text-left ${i < EXPENSES.length - 1 ? "border-b border-[#e5e1d7]" : ""}`}
            >
              <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#f2efe8]">
                <img src={exp.icon} alt="" className="size-[18px]" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <p className="text-[14.5px] font-medium tracking-[0.08px] text-[#14110d]">{exp.name}</p>
                <div className="flex items-center gap-[6px] whitespace-nowrap text-[11px] font-light tracking-[0.08px] text-[#767168]">
                  <span>{exp.paidBy} จ่าย</span>
                  <span className="text-[#b5b0a4]">·</span>
                  <span>หาร {exp.split} คน</span>
                  <span className="text-[#b5b0a4]">·</span>
                  <AvatarStack ids={exp.avatarIds} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-[1px]">
                <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">{sym}{c(exp.total)}</p>
                <p className="text-[10px] tracking-[0.08px] text-[#767168]">{sym}{c(exp.perPerson)} / คน</p>
              </div>
            </button>
          ))}
        </div>

      </div>

      <ExpenseDetailSheet exp={detailExp} onClose={() => setDetailExp(null)} sym={sym} c={c} />
      <SummarySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sym={sym}
        c={c}
        paymentMethod={paymentMethod}
        bankNumber={bankNumber}
        qrImageUrl={qrImageUrl}
      />
      <CurrencyPickerSheet
        open={showCurrPicker}
        currentIdx={currIdx}
        onSelect={(i) => { setCurrIdx(i); setShowCurrPicker(false); }}
        onClose={() => setShowCurrPicker(false)}
      />
      <MemberBottomNav active="wallet" />
    </main>
  );
}
