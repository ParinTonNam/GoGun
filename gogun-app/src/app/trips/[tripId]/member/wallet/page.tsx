"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getExpenses,
  getBalance,
  getSettlements,
  getMe,
  getTrip,
  getInitial,
  type Expense,
  type Balance,
  type Settlement,
  type User,
  type Trip,
} from "@/lib/api";
import { MemberBottomNav } from "@/components/member-bottom-nav";

function AvatarStack({
  users,
}: {
  users: { id: string; display_name: string; avatar_color: string }[];
}) {
  const itemW = 16;
  const gap = 4;
  const totalW = users.length * itemW - (users.length - 1) * gap;
  return (
    <div className="relative h-[16px] shrink-0" style={{ width: `${totalW}px` }}>
      {users.map((u, i) => (
        <div
          key={u.id}
          className="absolute flex h-[16px] min-w-[16px] items-center justify-center rounded-[8px] border-[0.8px] border-white"
          style={{
            backgroundColor: u.avatar_color,
            left: `${i * (itemW - gap)}px`,
            zIndex: users.length - i,
            paddingLeft: 3,
            paddingRight: 3,
          }}
        >
          <span className="text-[8px] font-medium leading-none text-white">
            {getInitial(u.display_name)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MemberPill({
  display_name,
  avatar_color,
}: {
  display_name: string;
  avatar_color: string;
}) {
  return (
    <div className="relative h-[22px] w-[56px] shrink-0">
      <div className="absolute inset-y-[2px] left-[27px] right-0 flex items-center">
        <span className="whitespace-nowrap text-[12px] font-medium tracking-[0.08px] text-[#f7f5f0]">
          {display_name}
        </span>
      </div>
      <div
        className="absolute inset-y-0 left-0 z-10 flex w-[22px] items-center justify-center rounded-full"
        style={{ backgroundColor: avatar_color }}
      >
        <span className="text-[12px] font-medium text-white">
          {getInitial(display_name)}
        </span>
      </div>
    </div>
  );
}

// Display-only currency conversion (view amounts in another currency without
// changing the trip's actual stored currency). Rates are fixed approximations.
const DISPLAY_CURRENCIES = [
  { code: "JPY", sym: "¥",   label: "เยนญี่ปุ่น",        rate: 1       },
  { code: "THB", sym: "฿",   label: "บาทไทย",            rate: 0.24    },
  { code: "USD", sym: "$",   label: "ดอลลาร์สหรัฐ",      rate: 0.0067  },
  { code: "EUR", sym: "€",   label: "ยูโร",              rate: 0.0062  },
  { code: "GBP", sym: "£",   label: "ปอนด์อังกฤษ",       rate: 0.0052  },
  { code: "KRW", sym: "₩",   label: "วอนเกาหลี",         rate: 8.89    },
  { code: "CNY", sym: "元",  label: "หยวนจีน",           rate: 0.048   },
  { code: "HKD", sym: "HK$", label: "ดอลลาร์ฮ่องกง",     rate: 0.052   },
  { code: "SGD", sym: "S$",  label: "ดอลลาร์สิงคโปร์",   rate: 0.0091  },
  { code: "AUD", sym: "A$",  label: "ดอลลาร์ออสเตรเลีย", rate: 0.010   },
];

function currencyRateFor(code: string) {
  return DISPLAY_CURRENCIES.find((c) => c.code === code) ?? DISPLAY_CURRENCIES[0];
}

function CurrencyPickerSheet({
  open, currentCode, tripCurrency, onSelect, onClose,
}: {
  open: boolean;
  currentCode: string;
  tripCurrency: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-[70] w-full max-w-[430px] -translate-x-1/2 rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex flex-col pb-[40px] pt-[24px]">
          <div className="flex items-center justify-between px-[24px] pb-[16px]">
            <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">เลือกสกุลเงินที่แสดง</p>
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
          <p className="px-[24px] pb-[10px] text-[11px] font-light tracking-[0.08px] text-[#767168]">
            แปลงเพื่อดูเฉยๆ ไม่เปลี่ยนสกุลเงินหลักของทริป ({tripCurrency})
          </p>
          <div className="flex flex-col divide-y divide-[#e5e1d7]">
            {DISPLAY_CURRENCIES.map((cr) => (
              <button
                key={cr.code}
                type="button"
                onClick={() => onSelect(cr.code)}
                className="flex items-center gap-[16px] px-[24px] py-[14px] transition-colors active:bg-[#f2efe8]"
              >
                <div className={`flex size-[40px] shrink-0 items-center justify-center rounded-[12px] ${currentCode === cr.code ? "bg-[#14110d]" : "bg-[#edeae2]"}`}>
                  <span className={`text-[16px] font-medium ${currentCode === cr.code ? "text-white" : "text-[#14110d]"}`}>
                    {cr.sym}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-start gap-[2px]">
                  <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{cr.label}</p>
                  <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">{cr.code}</p>
                </div>
                {currentCode === cr.code && (
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

const CATEGORY_LABELS: Record<string, string> = {
  flight: "เครื่องบิน",
  hotel: "ที่พัก",
  transport: "เดินทาง",
  food: "อาหาร",
  ticket: "ตั๋ว/กิจกรรม",
  other: "อื่นๆ",
};

function ExpenseDetailSheet({
  expense, onClose, sym, convert,
}: {
  expense: Expense | null;
  onClose: () => void;
  sym: string;
  convert: (n: number) => string;
}) {
  const [viewingSlip, setViewingSlip] = useState(false);
  const open = expense !== null;
  const categoryLabel = expense ? (CATEGORY_LABELS[expense.category] ?? "อื่นๆ") : "";
  // Slip images live in localStorage (keyed by expense id) since the API has no slip field.
  const slipUrl =
    expense && typeof window !== "undefined"
      ? localStorage.getItem(`gogun_expense_slip_${expense.id}`)
      : null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-[60] w-full max-w-[430px] -translate-x-1/2 rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        {expense && (
          <div className="flex flex-col gap-[20px] px-[24px] pb-[40px] pt-[28px]">
            <div className="flex items-start justify-between gap-[12px]">
              <div className="flex items-center gap-[12px]">
                <div className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-[#f2efe8]">
                  <img src={expenseIcon(expense.category)} alt="" className="size-[22px]" />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">{expense.name}</p>
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
                <p className="text-[28px] font-medium tracking-[-0.28px] text-[#14110d]">
                  {sym}{convert(expense.total_amount)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-[3px]">
                <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">ต่อคน</p>
                <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">
                  {sym}{convert(expense.total_amount / (expense.splits.length || 1))}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-[0px] divide-y divide-[#e5e1d7] rounded-[18px] border border-[#e5e1d7] bg-white">
              <div className="flex items-center justify-between px-[20px] py-[14px]">
                <p className="text-[13px] font-light tracking-[0.08px] text-[#767168]">ผู้จ่าย</p>
                <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{expense.paid_by.display_name}</p>
              </div>
              <div className="flex items-center justify-between px-[20px] py-[14px]">
                <p className="text-[13px] font-light tracking-[0.08px] text-[#767168]">หารกับ</p>
                <div className="flex items-center gap-[8px]">
                  <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{expense.splits.length} คน</p>
                  <AvatarStack users={expense.splits.map((s) => s.user)} />
                </div>
              </div>
              <div className="flex items-start justify-between px-[20px] py-[14px]">
                <p className="text-[13px] font-light tracking-[0.08px] text-[#767168]">สมาชิก</p>
                <p className="text-right text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
                  {expense.splits.map((s) => s.user.display_name).join(" · ")}
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
                  style={{ backgroundColor: expense.paid_by.avatar_color }}
                >
                  {getInitial(expense.paid_by.display_name)}
                </div>
                <span className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
                  {expense.paid_by.display_name}
                </span>
              </div>
            </div>

            {/* Slip */}
            {slipUrl ? (
              <button
                type="button"
                onClick={() => setViewingSlip(true)}
                className="flex items-center justify-center gap-[8px] rounded-[14px] border border-[#e5e1d7] bg-white py-[14px] text-[14px] font-medium tracking-[0.08px] text-[#14110d] transition-colors active:bg-[#f2efe8]"
              >
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                  <path d="M1 9C1 9 4 3 9 3C14 3 17 9 17 9C17 9 14 15 9 15C4 15 1 9 1 9Z" stroke="#14110d" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="9" r="2.2" stroke="#14110d" strokeWidth="1.3" />
                </svg>
                ดูสลิป
              </button>
            ) : (
              <div className="flex items-center justify-center rounded-[14px] border border-dashed border-[#e5e1d7] py-[14px] text-[13px] font-light tracking-[0.08px] text-[#b5b0a4]">
                ไม่มีสลิปแนบ
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen slip viewer */}
      {viewingSlip && slipUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-[24px]"
          onClick={() => setViewingSlip(false)}
        >
          <img src={slipUrl} alt="สลิป" className="max-h-[85vh] max-w-full rounded-[12px] object-contain" />
          <button
            type="button"
            onClick={() => setViewingSlip(false)}
            className="absolute right-[20px] top-[20px] flex size-[40px] items-center justify-center rounded-full bg-white/90"
          >
            <svg width="13" height="13" viewBox="0 0 11 11" fill="none">
              <path d="M1 1L10 10M10 1L1 10" stroke="#14110d" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

function SummarySheet({
  open,
  onClose,
  settlements,
  sym,
  convert,
}: {
  open: boolean;
  onClose: () => void;
  settlements: Settlement[];
  sym: string;
  convert: (n: number) => string;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-[60] flex max-h-[90vh] w-full max-w-[420px] -translate-x-1/2 flex-col overflow-y-auto rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col gap-[10px] px-[20px] py-[34px]">
          <div className="flex h-[36px] shrink-0 items-center justify-between">
            <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">
              สรุปทริปนี้
            </p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#edeae2]"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M1 1L10 10M10 1L1 10"
                  stroke="#14110d"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-[5px] text-[13px] tracking-[0.08px]">
            <span className="text-[#767168]">หักล้างกันแล้ว</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">
              ลดรอบโอนให้น้อยที่สุด ({settlements.length} รายการ)
            </span>
          </div>

          {settlements.length > 0 ? (
            <div className="flex shrink-0 flex-col gap-[5px] rounded-[18px] bg-[#14110d] px-[20px] py-[15px]">
              <div className="flex flex-col gap-[3px]">
                <p className="text-[15px] font-medium tracking-[0.08px] text-[#f7f5f0]">
                  โอนเงินให้ครบ
                </p>
                <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                  โอนตามรายการนี้ แล้วทุกคนหักล้างครบ
                </p>
              </div>

              <div className="flex flex-col">
                {settlements.map((s, i) => (
                  <div
                    key={`${s.from_user_id}-${s.to_user_id}-${i}`}
                    className="flex items-center justify-between border-b border-white/[0.07] py-[10px] last:border-b-0"
                  >
                    <div className="flex items-center gap-[5px]">
                      <MemberPill {...s.from_user} />
                      <span className="text-[12px] font-medium text-[#767168]">→</span>
                      <MemberPill {...s.to_user} />
                    </div>
                    <span className="text-[15px] font-medium text-[#f7f5f0]">
                      {sym}{convert(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex shrink-0 flex-col items-center gap-[6px] rounded-[18px] bg-[#14110d] px-[20px] py-[24px]">
              <p className="text-[15px] font-medium tracking-[0.08px] text-[#f7f5f0]">
                หักล้างครบแล้ว
              </p>
              <p className="text-center text-[12px] font-light tracking-[0.08px] text-[#767168]">
                ทุกคนจ่ายเท่ากันหมด ยังไม่มียอดต้องโอน
              </p>
            </div>
          )}

          <p className="shrink-0 text-[11px] tracking-[0.08px] text-[#767168]">
            * คำนวณโดยจับคู่ผู้ค้างกับผู้รับให้ใกล้เคียงกัน เพื่อลดจำนวนการโอน
          </p>
        </div>
      </div>
    </>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  flight: "/images/icon-expense-plane.svg",
  hotel: "/images/icon-expense-hotel.svg",
  transport: "/images/icon-expense-train.svg",
  food: "/images/icon-expense-food.svg",
  ticket: "/images/icon-expense-ticket.svg",
  other: "/images/icon-expense-wifi.svg",
};

function expenseIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "/images/icon-expense-food.svg";
}

export default function MemberWalletPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCurrPicker, setShowCurrPicker] = useState(false);
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);

  // Payment method ("วิธีรับเงิน") — persisted per-user in localStorage since the
  // backend payment-methods endpoint has been retired.
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "bank" | null>(null);
  const [bankNumber, setBankNumber] = useState("");
  const [bankInput, setBankInput] = useState("");
  const [editingBank, setEditingBank] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const qrAdded = qrImageUrl !== null;

  const isOrganizer = !!(me && trip && me.id === trip.organizer_id);

  function selectPaymentMethod(m: "qr" | "bank") {
    if (!me) return;
    setPaymentMethod(m);
    localStorage.setItem(`gogun_pm_${me.id}`, m);
    if (m === "bank") setEditingBank(!bankNumber);
  }

  function saveBankNumber() {
    if (!me) return;
    const n = bankInput.trim();
    if (!n) return;
    setBankNumber(n);
    localStorage.setItem(`gogun_bank_${me.id}`, n);
    setBankInput("");
    setEditingBank(false);
  }

  function handleQrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !me) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setQrImageUrl(url);
      localStorage.setItem(`gogun_qr_${me.id}`, url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function loadData() {
    try {
      const [exp, bal, sets, user, t] = await Promise.all([
        getExpenses(tripId),
        getBalance(tripId),
        getSettlements(tripId),
        getMe(),
        getTrip(tripId),
      ]);
      setExpenses(exp);
      setBalance(bal);
      setSettlements(sets);
      setMe(user);
      setTrip(t);
      // Hydrate this user's saved payment method (localStorage-backed).
      setPaymentMethod((localStorage.getItem(`gogun_pm_${user.id}`) as "qr" | "bank" | null) ?? null);
      setBankNumber(localStorage.getItem(`gogun_bank_${user.id}`) ?? "");
      setQrImageUrl(localStorage.getItem(`gogun_qr_${user.id}`));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tripId]);

  const myBalance = me && balance
    ? balance.balances.find((b) => b.user_id === me.id)
    : null;
  const myNet = myBalance ? myBalance.net : 0;
  const iOwe = myNet < 0;

  const currency = balance?.currency ?? "JPY";
  const displayCurrency = currencyRateFor(displayCode ?? currency);
  const displaySym = displayCurrency.sym;
  const baseRate = currencyRateFor(currency).rate;

  function convert(amountInBaseCurrency: number): string {
    // amounts from the API are already in the trip's base currency; convert
    // relative to that base's own rate so picking the trip's own currency is a no-op.
    const val = (amountInBaseCurrency / baseRate) * displayCurrency.rate;
    if (displayCurrency.code === "USD") {
      return val.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return Math.round(val).toLocaleString("en");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className={`flex w-full max-w-[420px] flex-col pt-[24px] ${isOrganizer ? "pb-[24px]" : "pb-[100px]"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-[24px]">
          <div className="flex items-center gap-[7px]">
            <img src="/images/logo.svg" alt="" className="size-[19px]" />
            <p className="text-[11px] tracking-[0.08px] text-[#767168]">GOGUN</p>
            <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ไปกัน</p>
          </div>
          {me && (
            <div className="flex h-[33px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white p-[7px]">
              <span
                className="flex size-[22px] items-center justify-center rounded-[31px] text-[12px] font-medium text-white"
                style={{ backgroundColor: me.avatar_color }}
              >
                {getInitial(me.display_name)}
              </span>
              <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                {me.display_name}
              </span>
            </div>
          )}
        </div>

        {/* Title + total */}
        <div className="flex items-end gap-[24px] px-[24px] pt-[20px]">
          <div className="flex flex-1 flex-col gap-[8px]">
            <div className="flex items-center gap-[12px]">
              {isOrganizer && (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
                >
                  <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px] object-contain" />
                </button>
              )}
              <p className="text-[26px] font-medium tracking-[0.08px] text-[#14110d]">
                ค่าใช้จ่าย
              </p>
            </div>
            <div className={`flex items-center gap-[5px] text-[13px] tracking-[0.08px] ${isOrganizer ? "pl-[48px]" : ""}`}>
              <span className="text-[#767168]">{expenses.length} รายการ</span>
              <span className="text-[#b5b0a4]">·</span>
              <span className="text-[#767168]">
                {balance?.member_count ?? 0} คน
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-[6px]">
            <button
              type="button"
              onClick={() => setShowCurrPicker(true)}
              className="flex items-center gap-[6px] rounded-[10px] bg-[#edeae2] px-[10px] py-[6px] transition-colors active:bg-[#d4cfc2]"
            >
              <span className="text-[14px] font-medium text-[#14110d]">{displaySym}</span>
              <span className="text-[11px] font-light text-[#767168]">{displayCurrency.code}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="#767168" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-[20px] tracking-[-0.32px] text-[#14110d]">
              {displaySym}{convert(balance?.total_amount ?? 0)}
            </p>
          </div>
        </div>

        {/* Balance card + CTAs */}
        <div className="flex flex-col gap-[9px] px-[24px] pt-[24px]">
          {myNet !== 0 && (
            <div className="flex items-center gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]">
              <div className="flex flex-1 flex-col gap-[5px]">
                <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                  {iOwe ? "คุณติดเพื่อน" : "เพื่อนติดคุณ"}
                </p>
                <div className="flex items-end gap-[3px]">
                  <span className="mb-[4px] text-[12px] text-[#767168]">{displaySym}</span>
                  <span
                    className="text-[22px] font-medium tracking-[-0.22px]"
                    style={{ color: iOwe ? "#e85a2c" : "#2e8b5c" }}
                  >
                    {convert(Math.abs(myNet))}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex items-center gap-[12px] rounded-[9px] border border-[#e5e1d7] bg-white px-[26px] py-[10px]"
              >
                <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                  สรุปทริปนี้
                </span>
                <img
                  src="/images/icon-chevron-left.svg"
                  alt=""
                  className="size-[11px] rotate-180"
                />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push(`/trips/${tripId}/member/wallet/add`)}
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
          {expenses.map((exp, i) => (
            <button
              key={exp.id}
              type="button"
              onClick={() => setDetailExpense(exp)}
              className={`flex w-full items-center gap-[12px] py-[14px] text-left ${
                i < expenses.length - 1 ? "border-b border-[#e5e1d7]" : ""
              }`}
            >
              <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#f2efe8]">
                <img src={expenseIcon(exp.category)} alt="" className="size-[18px]" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <p className="text-[14.5px] font-medium tracking-[0.08px] text-[#14110d]">
                  {exp.name}
                </p>
                <div className="flex items-center gap-[6px] whitespace-nowrap text-[11px] font-light tracking-[0.08px] text-[#767168]">
                  <span>{exp.paid_by.display_name} จ่าย</span>
                  <span className="text-[#b5b0a4]">·</span>
                  <span>หาร {exp.splits.length} คน</span>
                  <span className="text-[#b5b0a4]">·</span>
                  <AvatarStack users={exp.splits.map((s) => s.user)} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-[1px]">
                <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                  {displaySym}{convert(exp.total_amount)}
                </p>
                <p className="text-[10px] tracking-[0.08px] text-[#767168]">
                  {displaySym}
                  {convert(exp.total_amount / (exp.splits.length || 1))} / คน
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Payment method ("วิธีรับเงิน") */}
        <div className="px-[24px] pt-[20px]">
          <input
            ref={qrInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleQrFile}
          />
          <div className="flex flex-col gap-[14px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[16px]">
            <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">วิธีรับเงิน</p>

            {/* Method toggle */}
            <div className="flex gap-[6px]">
              {(["qr", "bank"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectPaymentMethod(m)}
                  className={`flex h-[32px] flex-1 items-center justify-center rounded-[10px] text-[12px] font-medium transition-colors ${
                    paymentMethod === m
                      ? "bg-[#14110d] text-white"
                      : "border border-[#e5e1d7] bg-[#f7f5f0] text-[#767168]"
                  }`}
                >
                  {m === "qr" ? "คิวอาร์โค้ด" : "บัญชีธนาคาร"}
                </button>
              ))}
            </div>

            {/* QR sub-section */}
            {paymentMethod === "qr" && (
              <div className="flex items-center gap-[12px]">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => qrInputRef.current?.click()}
                    className="flex size-[48px] items-center justify-center overflow-hidden rounded-[14px] border border-[#e5e1d7] bg-[#f7f5f0]"
                  >
                    {qrImageUrl ? (
                      <img src={qrImageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <img src="/images/icon-qr.svg" alt="" className="size-[22px]" />
                    )}
                  </button>
                  {qrAdded && (
                    <div className="absolute bottom-[-4px] right-[-4px] flex size-[16px] items-center justify-center rounded-full bg-[#2e8b5c]">
                      <img src="/images/icon-check-white.svg" alt="" className="size-[10px]" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-[2px]">
                  <p className={`text-[14px] font-medium tracking-[0.08px] ${qrAdded ? "text-[#2e8b5c]" : "text-[#e85a2c]"}`}>
                    {qrAdded ? "บันทึกคิวอาร์โค้ดแล้ว" : "ยังไม่ได้บันทึกคิวอาร์โค้ด"}
                  </p>
                  <p className="text-[11px] font-light text-[#767168]">
                    {qrAdded ? "แตะรูปเพื่อเปลี่ยน" : "แตะเพื่ออัพโหลด"}
                  </p>
                </div>
              </div>
            )}

            {/* Bank sub-section */}
            {paymentMethod === "bank" && (
              <div className="flex flex-col gap-[8px]">
                {bankNumber && !editingBank ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[10px]">
                      <img src="/images/img-promptpay.png" alt="" className="size-[28px] rounded-[4px] object-cover" />
                      <p className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{bankNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setBankInput(bankNumber); setEditingBank(true); }}
                      className="text-[11px] font-light text-[#767168] underline-offset-2 hover:underline"
                    >
                      แก้ไข
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-[8px]">
                    <input
                      autoFocus={editingBank}
                      type="tel"
                      inputMode="tel"
                      placeholder="เบอร์พร้อมเพย์ เช่น 092-424-5678"
                      value={bankInput}
                      onChange={(e) => setBankInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveBankNumber()}
                      className="flex-1 rounded-[10px] border border-[#e5e1d7] bg-[#f7f5f0] px-[12px] py-[8px] text-[13px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4] focus:border-[#14110d]"
                    />
                    <button
                      type="button"
                      onClick={saveBankNumber}
                      disabled={!bankInput.trim()}
                      className="flex h-[38px] shrink-0 items-center rounded-[10px] bg-[#14110d] px-[14px] text-[12px] font-medium text-white disabled:opacity-40"
                    >
                      บันทึก
                    </button>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === null && (
              <p className="text-[12px] font-light text-[#b5b0a4]">
                เลือกวิธีรับเงิน เพื่อให้เพื่อนในทริปโอนเงินหาคุณได้
              </p>
            )}
          </div>
        </div>
      </div>

      <SummarySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        settlements={settlements}
        sym={displaySym}
        convert={convert}
      />

      <ExpenseDetailSheet
        expense={detailExpense}
        onClose={() => setDetailExpense(null)}
        sym={displaySym}
        convert={convert}
      />

      <CurrencyPickerSheet
        open={showCurrPicker}
        currentCode={displayCurrency.code}
        tripCurrency={currency}
        onSelect={(code) => { setDisplayCode(code); setShowCurrPicker(false); }}
        onClose={() => setShowCurrPicker(false)}
      />

      {!isOrganizer && <MemberBottomNav active="wallet" tripId={tripId} />}
    </main>
  );
}
