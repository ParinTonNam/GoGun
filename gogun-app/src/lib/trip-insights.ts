import type { Trip, Expense } from "./api";
export function daysUntil(date: string, now = new Date()) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}
export function tripCountdown(trip: Trip) {
  if (trip.archived_at) return "เก็บประวัติแล้ว";
  const date = trip.date_status === "confirmed" ? trip.confirmed_start_date : trip.availability_deadline;
  if (!date) return "กำลังหาวันไปด้วยกัน";
  const days = daysUntil(date);
  if (trip.date_status !== "confirmed") return days < 0 ? `เลยกำหนดตอบวัน ${-days} วัน` : days === 0 ? "ตอบวันภายในวันนี้" : `เหลือ ${days} วันให้ตอบวันว่าง`;
  return days > 0 ? `อีก ${days} วันออกเดินทาง` : days === 0 ? "ออกเดินทางวันนี้!" : -days < trip.duration_days ? "อยู่ระหว่างเดินทาง" : "จบทริปแล้ว";
}
export function expenseInsights(expenses: Expense[], trip: Trip, userId: string) {
  const matching = expenses.filter(e => e.currency === trip.currency);
  const total = matching.reduce((n, e) => n + Number(e.total_amount), 0);
  const categories = Object.entries(matching.reduce<Record<string, number>>((out, e) => { out[e.category || "อื่น ๆ"] = (out[e.category || "อื่น ๆ"] ?? 0) + Number(e.total_amount); return out; }, {})).sort((a, b) => b[1] - a[1]);
  const share = matching.reduce((n, e) => n + e.splits.filter(s => s.user_id === userId).reduce((n, s) => n + Number(s.amount), 0), 0);
  const budget = Number(trip.budget_per_person) || 0;
  return { total, categories, share, budget, ratio: budget > 0 ? share / budget : 0, mixedCurrency: matching.length !== expenses.length };
}
