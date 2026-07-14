"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTrip,
  getMe,
  createExpense,
  getInitial,
  type Trip,
  type TripMember,
  type User,
} from "@/lib/api";

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: "flight",    label: "เครื่องบิน",   icon: "/images/icon-expense-plane.svg"  },
  { id: "hotel",      label: "ที่พัก",        icon: "/images/icon-expense-hotel.svg"  },
  { id: "transport",  label: "เดินทาง",      icon: "/images/icon-expense-train.svg"  },
  { id: "food",       label: "อาหาร",         icon: "/images/icon-expense-food.svg"   },
  { id: "ticket",     label: "ตั๋ว/กิจกรรม", icon: "/images/icon-expense-ticket.svg" },
  { id: "other",      label: "อื่นๆ",         icon: "/images/icon-expense-wifi.svg"   },
];

const TO_WHITE = "brightness(0) invert(1)";

function MemberPill({
  member, selected, onClick,
}: { member: TripMember; selected: boolean; onClick: () => void }) {
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
        style={{ backgroundColor: member.user.avatar_color }}
      >
        {getInitial(member.user.display_name)}
      </div>
      <span
        className={`text-[13px] font-medium tracking-[0.08px] ${
          selected ? "text-white" : "text-[#14110d]"
        }`}
      >
        {member.user.display_name}
      </span>
    </button>
  );
}

// Splits amounts evenly across the given user ids, keeping the sum exactly
// equal to total (any rounding remainder goes to the first person).
function evenSplit(total: number, userIds: string[]): Array<{ user_id: string; amount: number }> {
  if (userIds.length === 0) return [];
  const base = Math.floor((total / userIds.length) * 100) / 100;
  const remainder = Math.round((total - base * userIds.length) * 100) / 100;
  return userIds.map((user_id, i) => ({
    user_id,
    amount: i === 0 ? Math.round((base + remainder) * 100) / 100 : base,
  }));
}

export default function AddExpensePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("flight");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [splitAmong, setSplitAmong] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([getTrip(tripId), getMe()])
      .then(([t, user]) => {
        setTrip(t);
        setMe(user);
        const joined = t.members.filter((m) => m.status === "joined").map((m) => m.user_id);
        setPaidBy(user.id);
        setSplitAmong(new Set(joined));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tripId]);

  const members = trip?.members.filter((m) => m.status === "joined") ?? [];

  function toggleSplit(userId: string) {
    setSplitAmong((prev) => {
      const next = new Set(prev);
      if (next.has(userId) && next.size > 1) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const currencySymbol = trip?.currency === "JPY" ? "¥" : trip?.currency === "THB" ? "฿" : trip?.currency ?? "";
  const numAmount = parseFloat(amount) || 0;
  const perPerson = splitAmong.size > 0 ? numAmount / splitAmong.size : 0;
  const perPersonFmt = perPerson > 0 ? Math.round(perPerson).toLocaleString("en") : null;

  const canSave = name.trim().length > 0 && numAmount > 0 && !!paidBy && splitAmong.size > 0 && !saving;

  async function handleSave() {
    if (!canSave || !paidBy || !trip) return;
    setSaving(true);
    setError("");
    try {
      await createExpense(tripId, {
        name: name.trim(),
        category,
        total_amount: numAmount,
        currency: trip.currency,
        paid_by_user_id: paidBy,
        splits: evenSplit(numAmount, [...splitAmong]),
      });
      router.push(`/trips/${tripId}/member/wallet`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSaving(false);
    }
  }

  if (loading || !trip || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[430px] flex-col gap-[28px] pb-[48px] pt-[20px]">

        {/* Header */}
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

        {/* Category picker */}
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

        {/* Name */}
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

        {/* Amount */}
        <div className="flex flex-col gap-[8px] px-[24px]">
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
            จำนวนเงิน ({currencySymbol})
          </p>
          <div className="flex h-[56px] overflow-hidden rounded-[14px] border border-[#e5e1d7] bg-white focus-within:border-[#14110d]">
            <div className="flex w-[48px] shrink-0 items-center justify-center border-r border-[#e5e1d7]">
              <span className="text-[16px] font-medium text-[#767168]">{currencySymbol}</span>
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

        {/* Paid by */}
        <div className="flex flex-col gap-[10px] px-[24px]">
          <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ใครจ่าย</p>
          <div className="flex flex-wrap gap-[6px]">
            {members.map((m) => (
              <MemberPill
                key={m.id}
                member={m}
                selected={paidBy === m.user_id}
                onClick={() => setPaidBy(m.user_id)}
              />
            ))}
          </div>
        </div>

        {/* Split among */}
        <div className="flex flex-col gap-[10px] px-[24px]">
          <div className="flex items-baseline gap-[6px]">
            <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">หารกับ</p>
            <p className="text-[11px] tracking-[0.08px] text-[#b5b0a4]">{splitAmong.size} คน</p>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {members.map((m) => (
              <MemberPill
                key={m.id}
                member={m}
                selected={splitAmong.has(m.user_id)}
                onClick={() => toggleSplit(m.user_id)}
              />
            ))}
          </div>

          {perPersonFmt && (
            <div className="flex items-center justify-between rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] py-[13px]">
              <span className="text-[13px] font-light tracking-[0.08px] text-[#767168]">
                ต่อคน ({splitAmong.size} คน)
              </span>
              <span className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                {currencySymbol}{perPersonFmt}
              </span>
            </div>
          )}
        </div>

        {error && <p className="px-[24px] text-[12px] text-red-500">{error}</p>}

        {/* Save */}
        <div className="px-[24px]">
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className={`flex h-[51px] w-full items-center justify-center rounded-[18px] text-[16px] font-medium tracking-[0.08px] transition-opacity ${
              canSave
                ? "bg-[#c0613e] text-[#fcede3]"
                : "bg-[#e5e1d7] text-[#b5b0a4]"
            }`}
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>

      </div>
    </main>
  );
}
