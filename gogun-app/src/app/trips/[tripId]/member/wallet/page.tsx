"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  getExpenses,
  getBalance,
  getSettlements,
  getMe,
  getTrip,
  getInitial,
  deleteExpense,
  type Expense,
  type Balance,
  type Settlement,
  type User,
  type Trip,
} from "@/lib/api";
import { MemberBottomNav } from "@/components/member-bottom-nav";
import { LoadError } from "@/components/load-error";
import { useLoad, notifyError } from "@/lib/use-load";

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
        className={`fixed bottom-0 left-1/2 z-[70] w-full max-w-[420px] -translate-x-1/2 rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
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
  expense, onClose, sym, convert, onEdit, onDelete,
}: {
  expense: Expense | null;
  onClose: () => void;
  sym: string;
  convert: (n: number) => string;
  onEdit: (exp: Expense) => void;
  onDelete: (exp: Expense) => Promise<void>;
}) {
  const open = expense !== null;
  const categoryLabel = expense ? (CATEGORY_LABELS[expense.category] ?? "อื่นๆ") : "";
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!expense || deleting) return;
    if (!window.confirm(`ลบ "${expense.name}" ออกจากรายการ?`)) return;
    setDeleting(true);
    try {
      await onDelete(expense);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-[60] w-full max-w-[420px] -translate-x-1/2 rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
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

            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                onClick={() => onEdit(expense)}
                disabled={deleting}
                className="flex h-[48px] flex-1 items-center justify-center gap-[8px] rounded-[14px] border border-[#e5e1d7] bg-white text-[14px] font-medium tracking-[0.08px] text-[#14110d] transition-colors active:bg-[#f2efe8] disabled:opacity-50"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M10.5 1.5L13 4L4.5 12.5L1.5 13L2 10L10.5 1.5Z" stroke="#14110d" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                แก้ไข
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex h-[48px] flex-1 items-center justify-center gap-[8px] rounded-[14px] border border-[#eecfc4] bg-white text-[14px] font-medium tracking-[0.08px] text-[#e85a2c] transition-colors active:bg-[#fbeee7] disabled:opacity-50"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 3.5H13M5.5 3.5V2.5C5.5 2 5.9 1.5 6.5 1.5H8.5C9.1 1.5 9.5 2 9.5 2.5V3.5M11.5 3.5V12C11.5 12.6 11.1 13 10.5 13H4.5C3.9 13 3.5 12.6 3.5 12V3.5" stroke="#e85a2c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {deleting ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>

          </div>
        )}
      </div>
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
  const [showCurrPicker, setShowCurrPicker] = useState(false);
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);

  const isOrganizer = !!(me && trip && me.id === trip.organizer_id);

  const { loading, error: loadError, retry } = useLoad(async () => {
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
  }, [tripId]);

  async function refresh() {
    const [exp, bal, sets] = await Promise.all([
      getExpenses(tripId),
      getBalance(tripId),
      getSettlements(tripId),
    ]);
    setExpenses(exp);
    setBalance(bal);
    setSettlements(sets);
  }

  async function handleDeleteExpense(exp: Expense) {
    try {
      await deleteExpense(tripId, exp.id);
      setDetailExpense(null);
      await refresh();
    } catch (e) {
      notifyError(e, "ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

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

  if (loadError) {
    return <LoadError message={loadError} onRetry={retry} />;
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
        <div className="px-[24px]">
          <PageHeader user={me} />
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
          <div className="flex items-center gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]">
            <div className="flex flex-1 flex-col gap-[5px]">
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                {myNet === 0 ? "คุณไม่มียอดค้าง" : iOwe ? "คุณต้องจ่ายเงินเพื่อน" : "เพื่อนติดคุณ"}
              </p>
              <div className="flex items-end gap-[3px]">
                <span className="mb-[4px] text-[12px] text-[#767168]">{displaySym}</span>
                <span
                  className="text-[22px] font-medium tracking-[-0.22px]"
                  style={{ color: myNet === 0 ? "#14110d" : iOwe ? "#e85a2c" : "#2e8b5c" }}
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
        onEdit={(exp) => router.push(`/trips/${tripId}/member/wallet/add?edit=${exp.id}`)}
        onDelete={handleDeleteExpense}
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
