"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTripWorkspace } from "@/components/trip-workspace";
import {
  HomeBottomNav,
  MaewDropdown,
  MaewTopbar,
  TripTicketSelector,
  getCatAvatarUrl,
} from "@/components/trip-ticket-selector";
import {
  createExpense,
  deleteExpense,
  getBalance,
  getExpenses,
  getSettlements,
  updateExpense,
  type Balance,
  type Expense,
  type Settlement,
  type TripMember,
} from "@/lib/api";

type CurrencyOption = {
  code: string;
  label: string;
  sym: string;
  toThbRate: number;
};

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "THB", label: "บาท", sym: "บาท", toThbRate: 1 },
  { code: "JPY", label: "เยน", sym: "¥", toThbRate: 0.211 },
  { code: "USD", label: "ดอลลาร์", sym: "$", toThbRate: 34.5 },
  { code: "EUR", label: "ยูโร", sym: "€", toThbRate: 37.2 },
  { code: "KRW", label: "วอน", sym: "₩", toThbRate: 0.025 },
  { code: "CNY", label: "หยวน", sym: "¥", toThbRate: 4.8 },
  { code: "SGD", label: "ดอลลาร์สิงคโปร์", sym: "S$", toThbRate: 25.6 },
  { code: "HKD", label: "ดอลลาร์ฮ่องกง", sym: "HK$", toThbRate: 4.4 },
];

type ExpenseCategoryOption = {
  id: string;
  label: string;
  icon: string;
  key: string;
  rotateDeg?: number;
};

const PRIMARY_ICON_OPTIONS: ExpenseCategoryOption[] = [
  { key: "flight", id: "flight", label: "เครื่องบิน", icon: "/images/icon-expense-plane.svg", rotateDeg: -90 },
  { key: "food", id: "food", label: "อาหารและเครื่องดื่ม", icon: "/images/icon-expense-fastfood.svg" },
  { key: "shopping", id: "shopping", label: "ช้อปปิ้ง", icon: "/images/icon-expense-shopping.svg" },
  { key: "ticket", id: "ticket", label: "ตั๋ว/กิจกรรม", icon: "/images/icon-expense-ticket.svg" },
  { key: "transport", id: "transport", label: "เดินทาง/น้ำมัน", icon: "/images/icon-expense-fuel.svg" },
];

const EXTRA_ICON_OPTIONS: ExpenseCategoryOption[] = [
  { key: "party", id: "party", label: "ปาร์ตี้/สังสรรค์", icon: "/images/icon-expense-party.svg" },
  { key: "drink", id: "drink", label: "เครื่องดื่ม/บาร์", icon: "/images/icon-expense-drink.svg" },
  { key: "fish", id: "fish", label: "อาหารทะเล/มื้อพิเศษ", icon: "/images/icon-expense-fish.svg" },
  { key: "other", id: "other", label: "เหมียว/อื่นๆ", icon: "/images/icon-expense-cat.svg" },
];

const ICON_OPTIONS: ExpenseCategoryOption[] = [
  ...PRIMARY_ICON_OPTIONS,
  ...EXTRA_ICON_OPTIONS,
];

const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "ประเภท" },
  { value: "flight", label: "เครื่องบิน" },
  { value: "food", label: "อาหาร" },
  { value: "shopping", label: "ช้อปปิ้ง" },
  { value: "ticket", label: "ตั๋ว/กิจกรรม" },
  { value: "transport", label: "เดินทาง" },
  { value: "party", label: "ปาร์ตี้" },
  { value: "drink", label: "เครื่องดื่ม" },
  { value: "fish", label: "มื้อพิเศษ" },
  { value: "hotel", label: "ที่พัก" },
  { value: "other", label: "อื่นๆ" },
];

const CATEGORY_ICONS: Record<string, { icon: string; rotateDeg?: number }> = {
  flight: { icon: "/images/icon-expense-plane.svg", rotateDeg: -90 },
  food: { icon: "/images/icon-expense-fastfood.svg" },
  shopping: { icon: "/images/icon-expense-shopping.svg" },
  ticket: { icon: "/images/icon-expense-ticket.svg" },
  transport: { icon: "/images/icon-expense-fuel.svg" },
  party: { icon: "/images/icon-expense-party.svg" },
  drink: { icon: "/images/icon-expense-drink.svg" },
  fish: { icon: "/images/icon-expense-fish.svg" },
  other: { icon: "/images/icon-expense-cat.svg" },
  hotel: { icon: "/images/icon-expense-hotel.svg" },
};

function getSingleInitial(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "ต";
  return cleaned.slice(0, 1);
}

function getExpenseIcon(category: string): { icon: string; rotateDeg?: number } {
  return CATEGORY_ICONS[category] ?? { icon: "/images/icon-expense-plane.svg", rotateDeg: -90 };
}

function getCurrencyOption(code?: string | null): CurrencyOption {
  const upper = (code || "THB").toUpperCase();
  return CURRENCY_OPTIONS.find((c) => c.code === upper) ?? CURRENCY_OPTIONS[0];
}

function formatMoneyDisplay(amount: number, currencyCode?: string | null): string {
  const rounded = Math.round(amount).toLocaleString("en-US");
  const code = (currencyCode || "THB").toUpperCase();
  if (code === "THB") {
    return `${rounded} บาท`;
  }
  if (code === "JPY") {
    return `¥ ${rounded}`;
  }
  const opt = getCurrencyOption(code);
  return `${opt.sym} ${rounded}`;
}

function formatPerPersonDisplay(amount: number, currencyCode?: string | null): string {
  const rounded = Math.round(amount).toLocaleString("en-US");
  const code = (currencyCode || "THB").toUpperCase();
  if (code === "THB") {
    return `${rounded} บาท / คน`;
  }
  if (code === "JPY") {
    return `¥ ${rounded} / คน`;
  }
  const opt = getCurrencyOption(code);
  return `${opt.sym} ${rounded} / คน`;
}

function evenSplit(
  total: number,
  userIds: string[]
): Array<{ user_id: string; amount: number }> {
  if (userIds.length === 0) return [];
  const base = Math.floor((total / userIds.length) * 100) / 100;
  const remainder = Math.round((total - base * userIds.length) * 100) / 100;
  return userIds.map((user_id, i) => ({
    user_id,
    amount: i === 0 ? Math.round((base + remainder) * 100) / 100 : base,
  }));
}

function PillChevronDown() {
  return (
    <svg width="7" height="4.083" viewBox="0 0 7 4.08333" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4.02358 3.87638C3.88586 4.0089 3.69918 4.08333 3.50454 4.08333C3.3099 4.08333 3.12322 4.0089 2.9855 3.87638L0.215022 1.20804C0.0772995 1.07528 -4.58939e-05 0.89525 2.04302e-08 0.70755C4.59347e-05 0.519855 0.0774795 0.33986 0.215266 0.207168C0.353053 0.0744765 0.539905 -4.42176e-05 0.73472 1.9684e-08C0.929535 4.42569e-05 1.11635 0.0746495 1.25408 0.207404L3.50454 2.37567L5.755 0.207404C5.89345 0.078434 6.07895 0.00702055 6.27155 0.00854485C6.46415 0.0100691 6.6484 0.084409 6.78465 0.215554C6.92085 0.346698 6.9982 0.524155 6.99995 0.7097C7.00175 0.895245 6.9278 1.07404 6.79405 1.20756L4.02407 3.87685L4.02358 3.87638Z"
        fill="white"
      />
    </svg>
  );
}

function SheetCloseIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="18" cy="18" r="15.5" fill="#E5E1D7" stroke="#D9D9D9" />
      <path
        d="M17.8392 16.8801L15.0395 14.0803C14.8909 13.9319 14.6895 13.8484 14.4795 13.8484C14.2695 13.8484 14.0681 13.9319 13.9196 14.0803C13.7711 14.2289 13.6877 14.4302 13.6877 14.6402C13.6877 14.8503 13.7711 15.0517 13.9196 15.2002L16.7194 18.0001L13.9196 20.7998C13.7711 20.9483 13.6877 21.1497 13.6877 21.3598C13.6877 21.5698 13.7711 21.7712 13.9196 21.9197C14.0681 22.0681 14.2695 22.1516 14.4795 22.1516C14.6895 22.1516 14.8909 22.0681 15.0395 21.9197L17.8392 19.12L20.639 21.9197C20.7875 22.0681 20.9889 22.1516 21.1989 22.1516C21.409 22.1516 21.6104 22.0681 21.7589 21.9197C21.9074 21.7712 21.9908 21.5698 21.9908 21.3598C21.9908 21.1497 21.9074 20.9483 21.7589 20.7998L18.9591 18.0001L21.7589 15.2002C21.9074 15.0517 21.9908 14.8503 21.9908 14.6402C21.9908 14.4302 21.9074 14.2289 21.7589 14.0803C21.6104 13.9319 21.409 13.8484 21.1989 13.8484C20.9889 13.8484 20.7875 13.9319 20.639 14.0803L17.8392 16.8801Z"
        fill="#767168"
      />
    </svg>
  );
}

function ExpenseDeleteIcon() {
  return (
    <svg width="15.679" height="15.679" viewBox="0 0 15.6789 15.6789" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M7.70572 6.80997L5.12867 4.23292C4.99187 4.09612 4.80633 4.01927 4.61287 4.01927C4.41941 4.01927 4.23387 4.09612 4.09707 4.23292C3.96027 4.36972 3.88342 4.55526 3.88342 4.74872C3.88342 4.94218 3.96027 5.12772 4.09707 5.26452L6.67412 7.84157L4.09707 10.4186C3.96027 10.5554 3.88342 10.741 3.88342 10.9344C3.88342 11.1279 3.96027 11.3134 4.09707 11.4502C4.23387 11.587 4.41941 11.6639 4.61287 11.6639C4.80633 11.6639 4.99187 11.587 5.12867 11.4502L7.70572 8.87317L10.2828 11.4502C10.4196 11.587 10.6051 11.6639 10.7986 11.6639C10.992 11.6639 11.1776 11.587 11.3144 11.4502C11.4512 11.3134 11.528 11.1279 11.528 10.9344C11.528 10.741 11.4512 10.5554 11.3144 10.4186L8.73732 7.84157L11.3144 5.26452C11.4512 5.12772 11.528 4.94218 11.528 4.74872C11.528 4.55526 11.4512 4.36972 11.3144 4.23292C11.1776 4.09612 10.992 4.01927 10.7986 4.01927C10.6051 4.01927 10.4196 4.09612 10.2828 4.23292L7.70572 6.80997Z"
        fill="#767168"
      />
    </svg>
  );
}

export function TripExpensesView({
  initialOpenAdd = false,
  initialEditId = null,
}: {
  initialOpenAdd?: boolean;
  initialEditId?: string | null;
}) {
  const { trip, me, permissions } = useTripWorkspace();
  const isOrganizer = permissions.isOrganizer;
  const canManageExpenses = isOrganizer || !!trip.allow_member_expenses;
  const canEditOwnExpenses = isOrganizer || (trip.allow_member_expense_edit ?? true);
  function canEditExpenseRow(exp: Expense): boolean {
    if (isOrganizer) return true;
    return canEditOwnExpenses && exp.paid_by_user_id === me.id;
  }
  const avatarBg = me?.avatar_color || "#c0613e";

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Organizer delete mode (Figma 608:960 & 704:5193)
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingList, setEditingList] = useState(false);
  const [deletingExpId, setDeletingExpId] = useState<string | null>(null);

  // Summary Sheet (Figma 657:6538 & 666:16254)
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryClosing, setSummaryClosing] = useState(false);

  // Add / Edit Expense Sheet (Figma 796:5734 & 796:5837)
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addSheetClosing, setAddSheetClosing] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expName, setExpName] = useState("");
  const [selectedIconKey, setSelectedIconKey] = useState("flight");
  const [expCategory, setExpCategory] = useState("flight");
  const [showOtherIcons, setShowOtherIcons] = useState(false);
  const [expAmount, setExpAmount] = useState("");
  const [expCurrency, setExpCurrency] = useState("THB");
  const [expPaidBy, setExpPaidBy] = useState<string>(me.id);
  const [expSplitAmong, setExpSplitAmong] = useState<Set<string>>(new Set());
  const [savingExpense, setSavingExpense] = useState(false);
  const [saveError, setSaveError] = useState("");

  const joinedMembers: TripMember[] = useMemo(() => {
    const joined = trip.members.filter((m) => m.status === "joined");
    if (joined.length > 0) return joined;
    return [
      {
        id: "organizer-fallback",
        trip_id: trip.id,
        user_id: trip.organizer_id,
        role: "organizer",
        status: "joined",
        joined_at: null,
        user: trip.organizer || {
          id: me.id,
          display_name: me.display_name,
          avatar_color: me.avatar_color,
        },
      },
    ];
  }, [trip, me]);

  async function loadAllData() {
    try {
      const [expList, bal, sets] = await Promise.all([
        getExpenses(trip.id),
        getBalance(trip.id),
        getSettlements(trip.id),
      ]);
      setExpenses(expList);
      setBalance(bal);
      setSettlements(sets);
      return expList;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void loadAllData().then((expList) => {
        if (!active) return;
        if (initialEditId) {
          const target = expList.find((e) => e.id === initialEditId);
          if (target) {
            openEditExpenseModal(target);
            return;
          }
        }
        if (initialOpenAdd) openAddExpenseModal();
      });
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id]);

  // Calculate current user's net balance converted to THB for the top card
  // ("คุณติดเพื่อน" / "เพื่อนติดคุณ" / "คุณไม่มียอดค้าง" + "X,XXX บาท")
  const { balanceTitle, balanceAmountText } = useMemo(() => {
    let myNetInThb = 0;
    for (const exp of expenses) {
      const rate = getCurrencyOption(exp.currency).toThbRate;
      if (exp.paid_by_user_id === me.id) {
        myNetInThb += exp.total_amount * rate;
      }
      for (const s of exp.splits) {
        if (s.user_id === me.id) {
          myNetInThb -= s.amount * rate;
        }
      }
    }
    const roundedAbs = Math.round(Math.abs(myNetInThb));
    if (roundedAbs === 0 && balance) {
      const apiMyBal = balance.balances.find((b) => b.user_id === me.id);
      const fallbackNet = apiMyBal ? Math.round(Math.abs(apiMyBal.net)) : 0;
      const title =
        !apiMyBal || apiMyBal.net <= 0 ? "คุณติดเพื่อน" : "เพื่อนติดคุณ";
      return {
        balanceTitle: title,
        balanceAmountText: `${fallbackNet.toLocaleString("en-US")} บาท`,
      };
    }
    const title = myNetInThb <= 0 ? "คุณติดเพื่อน" : "เพื่อนติดคุณ";
    return {
      balanceTitle: title,
      balanceAmountText: `${roundedAbs.toLocaleString("en-US")} บาท`,
    };
  }, [expenses, balance, me.id]);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "all") return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  function openSummaryModal() {
    setSummaryClosing(false);
    setSummaryOpen(true);
  }

  function closeSummaryModal() {
    setSummaryClosing(true);
    window.setTimeout(() => {
      setSummaryOpen(false);
      setSummaryClosing(false);
    }, 240);
  }

  function openAddExpenseModal() {
    if (!canManageExpenses) return;
    setEditingExpenseId(null);
    setExpName("");
    setSelectedIconKey("flight");
    setExpCategory("flight");
    setShowOtherIcons(false);
    setExpAmount("");
    setExpCurrency("THB");
    setExpPaidBy(me.id);
    setExpSplitAmong(new Set(joinedMembers.map((m) => m.user_id)));
    setSaveError("");
    setAddSheetClosing(false);
    setAddSheetOpen(true);
  }

  function openEditExpenseModal(exp: Expense) {
    if (!canManageExpenses) return;
    setEditingExpenseId(exp.id);
    setExpName(exp.name);
    const matchingIcon =
      ICON_OPTIONS.find((opt) => opt.id === exp.category) ?? ICON_OPTIONS[0];
    setSelectedIconKey(matchingIcon.key);
    setExpCategory(exp.category || "flight");
    setShowOtherIcons(EXTRA_ICON_OPTIONS.some((opt) => opt.key === matchingIcon.key));
    setExpAmount(String(exp.total_amount));
    setExpCurrency((exp.currency || "THB").toUpperCase());
    setExpPaidBy(exp.paid_by_user_id || exp.paid_by?.id || me.id);
    setExpSplitAmong(
      new Set(
        exp.splits.length > 0
          ? exp.splits.map((s) => s.user_id || s.user.id)
          : joinedMembers.map((m) => m.user_id)
      )
    );
    setSaveError("");
    setAddSheetClosing(false);
    setAddSheetOpen(true);
  }

  function closeAddExpenseModal() {
    setAddSheetClosing(true);
    window.setTimeout(() => {
      setAddSheetOpen(false);
      setAddSheetClosing(false);
    }, 240);
  }

  function toggleSplitMember(userId: string) {
    setExpSplitAmong((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size > 1) next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  async function handleSaveExpense() {
    const trimmedName = expName.trim();
    const numericAmount = parseFloat(expAmount) || 0;
    if (!trimmedName || numericAmount <= 0 || expSplitAmong.size === 0 || savingExpense) {
      return;
    }

    setSavingExpense(true);
    setSaveError("");
    const splitList = [...expSplitAmong];
    const payerId = expPaidBy && joinedMembers.some((m) => m.user_id === expPaidBy)
      ? expPaidBy
      : me.id;

    const payload = {
      name: trimmedName,
      category: expCategory,
      total_amount: Math.round(numericAmount * 100) / 100,
      currency: expCurrency,
      paid_by_user_id: payerId,
      splits: evenSplit(Math.round(numericAmount * 100) / 100, splitList),
    };

    try {
      if (editingExpenseId) {
        await updateExpense(trip.id, editingExpenseId, payload);
      } else {
        await createExpense(trip.id, payload);
      }
      await loadAllData();
      closeAddExpenseModal();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "บันทึกค่าใช้จ่ายไม่สำเร็จ");
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleDeleteExpenseRow(exp: Expense) {
    if (!isOrganizer || deletingExpId) return;
    setDeletingExpId(exp.id);
    try {
      await deleteExpense(trip.id, exp.id);
      await loadAllData();
    } catch {
      // ignore
    } finally {
      setDeletingExpId(null);
    }
  }

  function handleDownloadSummaryBill() {
    const lines: string[] = [
      `สรุปค่าใช้จ่ายทริป: ${trip.name}`,
      `รายการโอนเงินให้ครบ (${settlements.length} รายการ)`,
      "----------------------------------------",
    ];
    if (settlements.length === 0) {
      lines.push("หักล้างครบแล้ว ไม่มียอดค้างโอน");
    } else {
      for (const s of settlements) {
        const fromName = s.from_user?.display_name || "สมาชิก";
        const toName = s.to_user?.display_name || "สมาชิก";
        lines.push(`${fromName} → ${toName} : ${formatMoneyDisplay(s.amount, s.currency)}`);
      }
    }
    lines.push("----------------------------------------");
    lines.push(`รายการค่าใช้จ่ายทั้งหมด (${expenses.length} รายการ):`);
    for (const e of expenses) {
      lines.push(
        `- ${e.name}: ${formatMoneyDisplay(e.total_amount, e.currency)} (${e.paid_by.display_name} จ่าย · หาร ${e.splits.length} คน)`
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-${trip.name.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const parsedInputAmount = parseFloat(expAmount) || 0;
  const currentCurrOption = getCurrencyOption(expCurrency);
  // Per Figma 704:5512: "แปลงสกุลเงินเป็นไทย · เงินจะปัดลงเสมอ"
  const convertedThbFloored = Math.floor(parsedInputAmount * currentCurrOption.toThbRate);
  const selectedCategoryFilterLabel =
    CATEGORY_FILTER_OPTIONS.find((c) => c.value === categoryFilter)?.label || "ประเภท";

  return (
    <main className="maew-home-scene maew-trip-fixed-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={me} />

      <div className="maew-trip-scroll-content">
      {/* Section Hero Banner + 4-Button Section Bar */}
      <TripTicketSelector trip={trip} activeVariant="money" isOrganizer={isOrganizer} />

      {/* Card 1: Balance Summary & Add Expense CTA (Figma 608:960 & 726:3469) */}
      <section className="maew-expense-summary-card" aria-label="สรุปยอดของคุณ">
        <div className="maew-expense-summary-top">
          <div className="maew-expense-summary-left">
            <p className="maew-expense-summary-label">{balanceTitle}</p>
            <p className="maew-expense-summary-amount">{balanceAmountText}</p>
          </div>

          <button
            type="button"
            className="maew-expense-summary-btn"
            onClick={openSummaryModal}
          >
            <span>สรุปทริปนี้</span>
            <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M1 1L5 5.5L1 10"
                stroke="#14110D"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <button
          type="button"
          className="maew-plan-primary-btn"
          disabled={!canManageExpenses}
          onClick={openAddExpenseModal}
        >
          เพิ่มค่าใช้จ่าย
        </button>
      </section>

      {/* Card 2: ค่าใช้จ่ายทั้งหมด (Figma 608:960, 704:5193, 726:3469) */}
      <section className={`maew-expense-list-card${!loading && filteredExpenses.length === 0 ? " is-empty" : ""}`} aria-label="ค่าใช้จ่ายทั้งหมด">
        <div className="maew-plan-card-head">
          <h2 className="maew-plan-card-title">ค่าใช้จ่ายทั้งหมด</h2>

          <div className="maew-plan-card-pills">
            {/* Category Filter Pill */}
            <MaewDropdown
              ariaLabel="กรองตามประเภทค่าใช้จ่าย"
              value={categoryFilter}
              displayLabel={selectedCategoryFilterLabel}
              options={CATEGORY_FILTER_OPTIONS}
              onChange={(val) => setCategoryFilter(val)}
              minMenuWidth={136}
            />

            {/* Organizer-only แก้ไข / เสร็จสิ้น pill (Figma 608:960 & 704:5193) */}
            {isOrganizer && (
              <button
                type="button"
                className="maew-overview-edit-pill"
                onClick={() => setEditingList((v) => !v)}
              >
                {editingList ? "เสร็จสิ้น" : "แก้ไข"}
              </button>
            )}
          </div>
        </div>

        <div className="maew-expense-rows">
          {loading ? (
            <p className="maew-home-empty-sub" style={{ padding: "12px 0" }}>
              กำลังโหลดรายการค่าใช้จ่าย…
            </p>
          ) : filteredExpenses.length === 0 ? (
            <p className="maew-home-empty-sub" style={{ padding: "12px 0" }}>
              ยังไม่มีรายการค่าใช้จ่ายในหมวดนี้
            </p>
          ) : (
            filteredExpenses.map((exp) => {
              const splitCount = Math.max(1, exp.splits.length);
              const perPerson = exp.total_amount / splitCount;
              const rowEditable = !editingList && canEditExpenseRow(exp);
              return (
                <div
                  key={exp.id}
                  className="maew-expense-row"
                  role={rowEditable ? "button" : undefined}
                  tabIndex={rowEditable ? 0 : undefined}
                  onClick={() => {
                    if (rowEditable) {
                      openEditExpenseModal(exp);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      rowEditable &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      openEditExpenseModal(exp);
                    }
                  }}
                >
                  <div className="maew-expense-row-icon">
                    {(() => {
                      const iconCfg = getExpenseIcon(exp.category);
                      return (
                        <img
                          src={iconCfg.icon}
                          alt=""
                          width={18}
                          height={18}
                          style={
                            iconCfg.rotateDeg
                              ? { transform: `rotate(${iconCfg.rotateDeg}deg)` }
                              : undefined
                          }
                        />
                      );
                    })()}
                  </div>

                  <div className="maew-expense-row-body">
                    <p className="maew-expense-row-title">{exp.name}</p>
                    <div className="maew-expense-row-meta">
                      <span>{exp.paid_by?.display_name || "สมาชิก"} จ่าย</span>
                      <span className="maew-expense-row-dot">·</span>
                      <span>หาร {splitCount} คน</span>
                      <span className="maew-expense-row-dot">·</span>
                    </div>
                  </div>

                  <div className="maew-expense-row-amt">
                    <p className="maew-expense-row-total">
                      {formatMoneyDisplay(exp.total_amount, exp.currency)}
                    </p>
                    <p className="maew-expense-row-pp">
                      {formatPerPersonDisplay(perPerson, exp.currency)}
                    </p>
                  </div>

                  {isOrganizer && editingList && (
                    <button
                      type="button"
                      className="maew-expense-row-del"
                      aria-label={`ลบ ${exp.name}`}
                      disabled={deletingExpId === exp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteExpenseRow(exp);
                      }}
                    >
                      <ExpenseDeleteIcon />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      </div>

      {/* Bottom Navigation */}
      <HomeBottomNav />

      {/* Bottom Sheet 1: สรุปทริปนี้ (Figma 657:6538 & 666:16254) */}
      {summaryOpen && (
        <div
          className={`maew-plan-modal-backdrop${summaryClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-money-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSummaryModal();
          }}
        >
          <div className={`maew-plan-modal-sheet${summaryClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle">
              <span />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="summary-money-title">สรุปทริปนี้</h2>
              <button
                type="button"
                className="maew-plan-modal-close"
                aria-label="ปิดหน้าต่าง"
                onClick={closeSummaryModal}
              >
                <SheetCloseIcon />
              </button>
            </div>

            <div className="maew-summary-sub">
              <span>หักล้างกันแล้ว</span>
              <span style={{ color: "#b5b0a4" }}>·</span>
              <span>ลดรอบโอนให้น้อยที่สุด ({settlements.length} รายการ)</span>
            </div>

            <div className="maew-summary-black-box">
              <p className="maew-summary-black-title">โอนเงินให้ครบ</p>

              {settlements.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#b5b0a4",
                    padding: "4px 0",
                  }}
                >
                  ทุกคนหักล้างยอดครบแล้ว ไม่มียอดค้างโอน
                </p>
              ) : (
                <div className="maew-summary-transfer-list">
                  {settlements.map((s, idx) => {
                    const fromName = s.from_user?.display_name || "สมาชิก";
                    const toName = s.to_user?.display_name || "สมาชิก";
                    return (
                      <div
                        key={`${s.from_user_id}-${s.to_user_id}-${s.currency}-${idx}`}
                        className="maew-summary-transfer-item"
                      >
                        <div className="maew-summary-transfer-row">
                          <div className="maew-summary-transfer-pair">
                            <span className="maew-summary-member-pill">
                              <img
                                src={getCatAvatarUrl(fromName, idx)}
                                alt=""
                                width={22}
                                height={22}
                                style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                              />
                              <span className="maew-summary-member-name">
                                {fromName}
                              </span>
                            </span>

                            <span className="maew-summary-arrow">→</span>

                            <span className="maew-summary-member-pill">
                              <img
                                src={getCatAvatarUrl(toName, idx + 1)}
                                alt=""
                                width={22}
                                height={22}
                                style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                              />
                              <span className="maew-summary-member-name">
                                {toName}
                              </span>
                            </span>
                          </div>

                          <p className="maew-summary-transfer-amt">
                            {formatMoneyDisplay(s.amount, s.currency)}
                          </p>
                        </div>

                        <hr className="maew-summary-transfer-divider" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="maew-summary-footnote">
              * คำนวณโดยจับคู่ผู้ค้างกับผู้รับให้ใกล้เคียงกัน เพื่อลดจำนวนการโอน
            </p>

            <button
              type="button"
              className="maew-plan-modal-submit"
              onClick={handleDownloadSummaryBill}
            >
              ดาวน์โหลดสรุปบิล
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet 2: เพิ่มค่าใช้จ่าย / แก้ไขค่าใช้จ่าย (Figma 796:5734 & 796:5837) */}
      {addSheetOpen && (
        <div
          className={`maew-plan-modal-backdrop${addSheetClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-expense-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddExpenseModal();
          }}
        >
          <div className={`maew-plan-modal-sheet${addSheetClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle">
              <span />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="add-expense-title">เพิ่มค่าใช้จ่าย</h2>
              <button
                type="button"
                className="maew-plan-modal-close"
                aria-label="ปิดหน้าต่าง"
                onClick={closeAddExpenseModal}
              >
                <SheetCloseIcon />
              </button>
            </div>

            {/* ชื่อค่าใช้จ่าย */}
            <label className="maew-plan-modal-label" htmlFor="expense-name-input">
              ชื่อค่าใช้จ่าย
            </label>
            <input
              id="expense-name-input"
              type="text"
              className="maew-plan-modal-input"
              placeholder="ตั๋วเครื่องบิน × 4"
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
            />

            {/* เลือกไอคอนค่าใช้จ่าย (Figma 796:5755 & 796:5858 / 796:5865) */}
            <p className="maew-plan-modal-label">เลือกไอคอนค่าใช้จ่าย</p>
            <div className="maew-expense-icons-grid">
              <div className="maew-expense-icons-row">
                {PRIMARY_ICON_OPTIONS.map((opt) => {
                  const isSelected = selectedIconKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      aria-label={opt.label}
                      className={`maew-expense-icon-btn${isSelected ? " is-active" : ""}`}
                      onClick={() => {
                        setSelectedIconKey(opt.key);
                        setExpCategory(opt.id);
                      }}
                    >
                      <img
                        src={opt.icon}
                        alt=""
                        width={opt.rotateDeg ? 28.208 : 25.857}
                        height={opt.rotateDeg ? 28.208 : 25.857}
                        style={
                          opt.rotateDeg
                            ? { transform: `rotate(${opt.rotateDeg}deg)` }
                            : undefined
                        }
                      />
                    </button>
                  );
                })}

                {!showOtherIcons ? (
                  <button
                    type="button"
                    aria-label="ดูไอคอนค่าใช้จ่ายเพิ่มเติม"
                    className="maew-expense-icon-btn"
                    onClick={() => setShowOtherIcons(true)}
                  >
                    <img
                      src="/images/icon-expense-more.svg"
                      alt=""
                      width={25.857}
                      height={25.857}
                    />
                  </button>
                ) : (
                  <button
                    key={EXTRA_ICON_OPTIONS[0].key}
                    type="button"
                    aria-label={EXTRA_ICON_OPTIONS[0].label}
                    className={`maew-expense-icon-btn${
                      selectedIconKey === EXTRA_ICON_OPTIONS[0].key ? " is-active" : ""
                    }`}
                    onClick={() => {
                      setSelectedIconKey(EXTRA_ICON_OPTIONS[0].key);
                      setExpCategory(EXTRA_ICON_OPTIONS[0].id);
                    }}
                  >
                    <img
                      src={EXTRA_ICON_OPTIONS[0].icon}
                      alt=""
                      width={25.857}
                      height={25.857}
                    />
                  </button>
                )}
              </div>

              {showOtherIcons && (
                <div className="maew-expense-icons-row">
                  {EXTRA_ICON_OPTIONS.slice(1).map((opt) => {
                    const isSelected = selectedIconKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        aria-label={opt.label}
                        className={`maew-expense-icon-btn${isSelected ? " is-active" : ""}`}
                        onClick={() => {
                          setSelectedIconKey(opt.key);
                          setExpCategory(opt.id);
                        }}
                      >
                        <img
                          src={opt.icon}
                          alt=""
                          width={25.857}
                          height={25.857}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ยอดค่าใช้จ่ายทั้งหมด + หน่วยเงิน */}
            <div className="maew-expense-amt-curr-row">
              <div className="maew-expense-amt-col">
                <label className="maew-plan-modal-label" htmlFor="expense-amount-input">
                  ยอดค่าใช้จ่ายทั้งหมด
                </label>
                <input
                  id="expense-amount-input"
                  type="number"
                  inputMode="decimal"
                  className="maew-plan-modal-input"
                  placeholder="1000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                />
              </div>

              <div className="maew-expense-curr-col">
                <p className="maew-plan-modal-label">หน่วยเงิน</p>
                <MaewDropdown
                  variant="field"
                  ariaLabel="เลือกหน่วยเงิน"
                  value={expCurrency}
                  displayLabel={currentCurrOption.label}
                  options={CURRENCY_OPTIONS.map((curr) => ({
                    value: curr.code,
                    label: `${curr.label} (${curr.code})`,
                  }))}
                  onChange={(val) => setExpCurrency(val)}
                />
              </div>
            </div>

            {/* แปลงสกุลเงินเป็นไทย (Figma 796:5784 — shown when foreign currency is selected) */}
            {expCurrency !== "THB" && (
              <div className="maew-expense-convert-row">
                <div className="maew-expense-convert-left">
                  <p className="maew-plan-modal-label">แปลงสกุลเงินเป็นไทย</p>
                  <p className="maew-expense-convert-sub">เงินจะปัดลงเสมอ</p>
                </div>
                <div className="maew-expense-convert-box">
                  <p className="maew-expense-convert-val">
                    {convertedThbFloored.toLocaleString("en-US")} บาท
                  </p>
                </div>
              </div>
            )}

            {/* ใครจ่ายบ้าง (Figma 796:5798 & 796:5905) */}
            <p className="maew-plan-modal-label">ใครจ่ายบ้าง</p>
            <div className="maew-expense-members-row">
              {joinedMembers.map((m, idx) => {
                const isSelected = expSplitAmong.has(m.user_id);
                const name = m.user?.display_name || "สมาชิก";
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`maew-expense-member-btn${
                      isSelected ? " is-selected" : " is-unselected"
                    }`}
                    onClick={() => toggleSplitMember(m.user_id)}
                  >
                    <span
                      className={`maew-expense-member-circle${
                        isSelected ? " is-selected" : ""
                      }`}
                      style={{ overflow: "hidden", padding: 0 }}
                    >
                      <img
                        src={getCatAvatarUrl(name, idx)}
                        alt=""
                        width={48}
                        height={48}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      />
                    </span>
                    <span className="maew-expense-member-label">{name}</span>
                  </button>
                );
              })}
            </div>

            {saveError && <p className="maew-create-error">{saveError}</p>}

            <button
              type="button"
              className="maew-plan-modal-submit"
              disabled={
                savingExpense ||
                !expName.trim() ||
                parsedInputAmount <= 0 ||
                expSplitAmong.size === 0
              }
              onClick={() => void handleSaveExpense()}
            >
              {savingExpense ? "กำลังบันทึก..." : "เพิ่มค่าใช้จ่าย"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

