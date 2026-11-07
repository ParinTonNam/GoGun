import type { Trip, User } from "./api";

export type TripSection = "overview" | "plan" | "expenses" | "group";

export const TRIP_SECTIONS: { id: TripSection; label: string; path: string; icon: string }[] = [
  { id: "overview", label: "ภาพรวม", path: "", icon: "icon-tab-trip.svg" },
  { id: "plan", label: "แผนเที่ยว", path: "/plan", icon: "icon-tab-calendar.svg" },
  { id: "expenses", label: "ค่าใช้จ่าย", path: "/expenses", icon: "icon-tab-wallet.svg" },
  { id: "group", label: "กลุ่ม", path: "/group", icon: "icon-tool-vote.svg" },
];

export function tripPath(tripId: string, path = "") {
  return `/trips/${encodeURIComponent(tripId)}${path}`;
}

export function getTripSection(pathname: string, tripId: string): TripSection {
  const base = tripPath(tripId);
  const path = pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : "";
  if (/^\/(expenses|member\/wallet)(\/|$)/.test(path)) return "expenses";
  if (/^\/(plan|itinerary|availability|member\/availability)(\/|$)/.test(path)
    || /^\/tools\/(checklist|packing)(\/|$)/.test(path)) return "plan";
  if (/^\/(group|members|settings|share|join|tools)(\/|$)/.test(path)) return "group";
  return "overview";
}

export function tripPermissions(trip: Trip, me: Pick<User, "id">) {
  const member = trip.members.find((item) => item.user_id === me.id && item.status !== "declined");
  const isOrganizer = !!member && trip.organizer_id === me.id;
  return {
    isOrganizer,
    canEditItinerary: !!member && (isOrganizer || trip.allow_member_itinerary_edit),
    canEditExpenses: !!member && (isOrganizer || trip.allow_member_expenses),
    canEditOwnExpenses: !!member && (isOrganizer || (trip.allow_member_expense_edit ?? true)),
    canInvite: !!member && trip.id !== "demo" && (isOrganizer || trip.allow_member_invite),
    canCreatePolls: !!member && (isOrganizer || (trip.allow_member_polls ?? true)),
    canStartEvents: !!member && (isOrganizer || (trip.allow_member_quests ?? true)),
  };
}

export function localCalendarDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Calendar dates are compared as dates, not converted from local midnight to UTC. */
export function getTripPhase(trip: Pick<Trip, "date_status" | "confirmed_start_date" | "duration_days">, today = localCalendarDate()) {
  if (trip.date_status !== "confirmed" || !trip.confirmed_start_date) return "planning";
  const start = trip.confirmed_start_date.slice(0, 10);
  const endDate = new Date(`${start}T12:00:00Z`);
  if (Number.isNaN(endDate.getTime())) return "planning";
  endDate.setUTCDate(endDate.getUTCDate() + Math.max(1, trip.duration_days) - 1);
  const end = endDate.toISOString().slice(0, 10);
  if (today < start) return "preparing";
  if (today <= end) return "travelling";
  return "settling";
}

export const PHASE_LABELS = {
  planning: "กำลังนัดวัน",
  preparing: "เตรียมเดินทาง",
  travelling: "กำลังเที่ยว",
  settling: "หลังเดินทาง",
};
