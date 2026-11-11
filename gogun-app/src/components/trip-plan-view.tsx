"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTripWorkspace } from "@/components/trip-workspace";
import {
  HomeBottomNav,
  MaewDropdown,
  MaewTopbar,
  TripTicketSelector,
} from "@/components/trip-ticket-selector";
import {
  addActivity,
  addDay,
  deleteActivity,
  getAvailability,
  getItinerary,
  getMemberAvailability,
  getMyAvailability,
  setAvailability,
  setMemberAvailability,
  updateActivity,
  updateTrip,
  type AvailabilityDay,
  type ItineraryActivity,
  type ItineraryDay,
  type MyAvailability,
  type Trip,
} from "@/lib/api";
import { useDragPaint } from "@/lib/use-drag-paint";

type AvailabilityStatus = "available" | "uncertain" | "unavailable";

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const DAY_HEADERS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function getSingleInitial(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "ต";
  return cleaned.slice(0, 1);
}

function splitActivityTitleAndDesc(rawTitle: string): { title: string; desc: string } {
  const parts = rawTitle.split(/\r?\n/);
  const title = (parts[0] || "").trim();
  const desc = parts.slice(1).join(" ").trim();
  return { title, desc };
}

function buildCalendarGrid(year: number, month: number): Array<{ date: number; inMonth: boolean }> {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: Array<{ date: number; inMonth: boolean }> = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: daysInPrev - i, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: d, inMonth: true });
  }
  const rem = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= rem; d++) {
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}

function dateKey(year: number, month: number, date: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

function monthRangeKeys(year: number, month: number): { start: string; end: string } {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return {
    start: dateKey(year, month, 1),
    end: dateKey(year, month, daysInMonth),
  };
}

function toIsoDateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTripStartEndIso(trip: Trip): { startIso: string; endIso: string } {
  const rawStart =
    trip.date_status === "confirmed"
      ? trip.confirmed_start_date
      : trip.proposed_start_date;
  const baseDate = rawStart ? new Date(rawStart) : new Date("2026-11-12T00:00:00");
  const startDate = Number.isNaN(baseDate.getTime())
    ? new Date("2026-11-12T00:00:00")
    : baseDate;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(1, trip.duration_days) - 1);
  return {
    startIso: toIsoDateOnly(startDate),
    endIso: toIsoDateOnly(endDate),
  };
}

function formatThaiBuddhistDate(isoDate: string): string {
  if (!isoDate) return "";
  const parsed = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  const day = parsed.getDate();
  const month = THAI_MONTHS_SHORT[parsed.getMonth()] || "";
  const buddhistYear = parsed.getFullYear() + 543;
  return `${day}  ${month} ${buddhistYear}`;
}

function formatThaiShortRange(startIso: string, endIso: string): string {
  const start = new Date(`${startIso.slice(0, 10)}T00:00:00`);
  const end = new Date(`${endIso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = THAI_MONTHS_SHORT[start.getMonth()] || "";
  const endMonth = THAI_MONTHS_SHORT[end.getMonth()] || "";
  if (startIso.slice(0, 10) === endIso.slice(0, 10)) {
    return `${startDay} ${startMonth}`;
  }
  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

function groupConsecutiveDates(dates: string[]): Array<{ start: string; end: string }> {
  const sorted = [...dates].sort();
  const groups: Array<{ start: string; end: string }> = [];
  for (const d of sorted) {
    const last = groups[groups.length - 1];
    if (last) {
      const next = new Date(`${last.end}T00:00:00`);
      next.setDate(next.getDate() + 1);
      if (toIsoDateOnly(next) === d) {
        last.end = d;
        continue;
      }
    }
    groups.push({ start: d, end: d });
  }
  return groups;
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

function CalendarInputIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M15.8333 15.8333H4.16667V6.66667H15.8333M13.3333 0.833333V2.5H6.66667V0.833333H5V2.5H4.16667C3.24167 2.5 2.5 3.24167 2.5 4.16667V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H15.8333C16.2754 17.5 16.6993 17.3244 17.0118 17.0118C17.3244 16.6993 17.5 16.2754 17.5 15.8333V4.16667C17.5 3.72464 17.3244 3.30072 17.0118 2.98816C16.6993 2.67559 16.2754 2.5 15.8333 2.5H15V0.833333M14.1667 10H10V14.1667H14.1667V10Z"
        fill="#B5B0A4"
      />
    </svg>
  );
}

export function TripPlanView({ initialSummaryMode = false }: { initialSummaryMode?: boolean }) {
  const { trip, me, permissions, refresh } = useTripWorkspace();
  const isOrganizer = permissions.isOrganizer;
  const avatarBg = me?.avatar_color || "#c0613e";

  // Initial calendar month from trip proposed/confirmed start date or current date
  const initialDate = useMemo(() => {
    const startIso = trip.confirmed_start_date || trip.proposed_start_date;
    if (startIso) {
      const parsed = new Date(startIso);
      if (!Number.isNaN(parsed.getTime())) {
        return { year: parsed.getFullYear(), month: parsed.getMonth() };
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [trip.confirmed_start_date, trip.proposed_start_date]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);

  // Target selector for Organizer: me.id, member.user_id, or "summary" ("สรุป")
  const [selectedTarget, setSelectedTarget] = useState<string>(
    initialSummaryMode && isOrganizer ? "summary" : me.id
  );

  // Status maps & aggregate availability
  const [statusMap, setStatusMap] = useState<Record<string, AvailabilityStatus>>({});
  const [aggrMap, setAggrMap] = useState<Record<string, AvailabilityDay>>({});
  const [brush, setBrush] = useState<AvailabilityStatus>("available");
  const [savingAvail, setSavingAvail] = useState(false);

  // Itinerary days
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const canEditItinerary = permissions.canEditItinerary;

  // Itinerary Add / Edit Activity Sheet (respects allow_member_itinerary_edit)
  const [actSheetOpen, setActSheetOpen] = useState(false);
  const [actSheetClosing, setActSheetClosing] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [actTime, setActTime] = useState("09:00");
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [savingAct, setSavingAct] = useState(false);
  const [actError, setActError] = useState("");

  // Confirm Day Bottom Sheet (Figma 674:11135) & Confirmed Travel Dates state (Figma 692:3874)
  const [selectedRecommendIdx, setSelectedRecommendIdx] = useState<number | null>(null);
  const [confirmSheetOpen, setConfirmSheetOpen] = useState(false);
  const [confirmSheetClosing, setConfirmSheetClosing] = useState(false);
  const [confirmStartDate, setConfirmStartDate] = useState("");
  const [confirmEndDate, setConfirmEndDate] = useState("");
  const [confirmingSaving, setConfirmingSaving] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [datesConfirmedLocal, setDatesConfirmedLocal] = useState(
    trip.date_status === "confirmed"
  );
  const [confirmedRangeOverride, setConfirmedRangeOverride] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [editingItineraryList, setEditingItineraryList] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

  const saveTimerRef = useRef<number | null>(null);

  const joinedMembers = useMemo(() => {
    const list = trip.members.filter((m) => m.status === "joined");
    if (list.length > 0) {
      return [...list].sort((a, b) =>
        a.user_id === me.id ? -1 : b.user_id === me.id ? 1 : 0
      );
    }
    return [
      {
        id: "organizer-fallback",
        trip_id: trip.id,
        user_id: trip.organizer_id,
        role: "organizer" as const,
        status: "joined" as const,
        joined_at: null,
        user: trip.organizer || {
          id: me.id,
          display_name: me.display_name,
          avatar_color: me.avatar_color,
        },
      },
    ];
  }, [trip.members, trip.id, trip.organizer_id, trip.organizer, me]);

  // Month options (12 months around initialDate)
  const monthOptions = useMemo(() => {
    const list: Array<{ key: string; year: number; month: number; label: string }> = [];
    const base = new Date(initialDate.year, initialDate.month - 2, 1);
    for (let i = 0; i < 14; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      list.push({
        key: `${y}-${m}`,
        year: y,
        month: m,
        label: `${THAI_MONTHS_SHORT[m]} ${y + 543}`,
      });
    }
    return list;
  }, [initialDate.year, initialDate.month]);

  // Load itinerary
  useEffect(() => {
    let active = true;
    getItinerary(trip.id)
      .then((res) => {
        if (!active) return;
        setDays(res);
        if (res.length > 0) setSelectedDayNum(res[0].day_number);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [trip.id]);

  // Load aggregate availability for current month
  useEffect(() => {
    let active = true;
    getAvailability(trip.id, monthRangeKeys(viewYear, viewMonth))
      .then((list) => {
        if (!active) return;
        const next: Record<string, AvailabilityDay> = {};
        for (const item of list) next[item.date] = item;
        setAggrMap((prev) => ({ ...prev, ...next }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [trip.id, viewYear, viewMonth]);

  // Load individual member availability when selectedTarget changes
  const activeUserId = selectedTarget === "summary" ? null : selectedTarget || me.id;

  useEffect(() => {
    if (!activeUserId) return;
    let active = true;
    const loader =
      activeUserId === me.id
        ? getMyAvailability(trip.id)
        : isOrganizer
        ? getMemberAvailability(trip.id, activeUserId)
        : Promise.resolve([] as MyAvailability[]);

    loader
      .then((entries) => {
        if (!active) return;
        const map: Record<string, AvailabilityStatus> = {};
        for (const e of entries) {
          map[e.date] = e.status;
        }
        setStatusMap(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [trip.id, activeUserId, me.id, isOrganizer]);

  async function persistAvailability(nextMap: Record<string, AvailabilityStatus>, targetUserId: string) {
    setSavingAvail(true);
    try {
      const entries: MyAvailability[] = Object.entries(nextMap).map(([date, status]) => ({
        date,
        status,
      }));
      if (targetUserId === me.id) {
        await setAvailability(trip.id, entries);
      } else if (isOrganizer) {
        await setMemberAvailability(trip.id, targetUserId, entries);
      }
      const list = await getAvailability(trip.id, monthRangeKeys(viewYear, viewMonth));
      const nextAggr: Record<string, AvailabilityDay> = {};
      for (const item of list) nextAggr[item.date] = item;
      setAggrMap((prev) => ({ ...prev, ...nextAggr }));
    } catch {
      // ignore network error during background save
    } finally {
      setSavingAvail(false);
    }
  }

  function scheduleAutoSave(nextMap: Record<string, AvailabilityStatus>, targetUserId: string) {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistAvailability(nextMap, targetUserId);
    }, 450);
  }

  const canPaint =
    selectedTarget !== "summary" && (selectedTarget === me.id || isOrganizer);

  const { onCellPointerDown, onCellClick } = useDragPaint<AvailabilityStatus>({
    paintable: () => canPaint,
    selectedValue: brush,
    applyPaint: (key, value) => {
      const targetUserId = selectedTarget === "summary" ? me.id : selectedTarget;
      setStatusMap((prev) => {
        const next = { ...prev, [key]: value };
        scheduleAutoSave(next, targetUserId);
        return next;
      });
    },
  });

  const gridCells = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const totalMemberCount = Math.max(1, joinedMembers.length);

  // Recommended date ranges in summary mode
  const recommendedRanges = useMemo(() => {
    const allDates = Object.values(aggrMap)
      .filter((d) => d.variant === "all" || (d.member_count > 0 && d.available >= d.member_count))
      .map((d) => d.date);
    const groups = groupConsecutiveDates(allDates);
    if (groups.length > 0) return groups.slice(0, 2);

    const { startIso, endIso } = getTripStartEndIso(trip);
    return [{ start: startIso, end: endIso }];
  }, [aggrMap, trip]);

  function openConfirmDaySheet(startIso?: string, endIso?: string) {
    const fallback = getTripStartEndIso(trip);
    setConfirmStartDate(startIso || fallback.startIso);
    setConfirmEndDate(endIso || fallback.endIso);
    setConfirmError("");
    setConfirmSheetClosing(false);
    setConfirmSheetOpen(true);
  }

  function closeConfirmDaySheet() {
    setConfirmSheetClosing(true);
    window.setTimeout(() => {
      setConfirmSheetOpen(false);
      setConfirmSheetClosing(false);
    }, 240);
  }

  async function handleConfirmTripDates() {
    if (confirmingSaving || !confirmStartDate || !confirmEndDate) return;
    setConfirmingSaving(true);
    setConfirmError("");
    try {
      const start = new Date(`${confirmStartDate}T00:00:00`);
      const end = new Date(`${confirmEndDate}T00:00:00`);
      const duration =
        !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
          ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
          : trip.duration_days;

      await updateTrip(trip.id, {
        confirmed_start_date: confirmStartDate,
        date_status: "confirmed",
        duration_days: duration,
      });
      setConfirmedRangeOverride({ start: confirmStartDate, end: confirmEndDate });
      setDatesConfirmedLocal(true);
      refresh();
      closeConfirmDaySheet();
    } catch {
      setConfirmError("ยืนยันวันไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setConfirmingSaving(false);
    }
  }

  async function handleDeleteActivityRow(actId: string) {
    if (deletingActivityId) return;
    setDeletingActivityId(actId);
    try {
      await deleteActivity(trip.id, actId);
      const updatedDays = await getItinerary(trip.id);
      setDays(updatedDays);
    } catch {
      setDays((prev) =>
        prev.map((d) => ({
          ...d,
          activities: d.activities.filter((a) => a.id !== actId),
        }))
      );
    } finally {
      setDeletingActivityId(null);
    }
  }

  async function handleSwitchToSummary() {
    if (activeUserId) {
      await persistAvailability(statusMap, activeUserId);
    }
    setSelectedTarget("summary");
  }

  function openAddActSheet() {
    if (!canEditItinerary) return;
    setActError("");
    setEditingActivityId(null);
    setActTime("09:00");
    setActTitle("");
    setActDesc("");
    setActSheetClosing(false);
    setActSheetOpen(true);
  }

  function openEditActSheet(act: ItineraryActivity) {
    if (!canEditItinerary) return;
    setActError("");
    const { title, desc } = splitActivityTitleAndDesc(act.title);
    setEditingActivityId(act.id);
    setActTime(act.time || "09:00");
    setActTitle(title);
    setActDesc(desc);
    setActSheetClosing(false);
    setActSheetOpen(true);
  }

  function closeActSheet() {
    setActSheetClosing(true);
    window.setTimeout(() => {
      setActSheetOpen(false);
      setActSheetClosing(false);
    }, 240);
  }

  async function ensureActiveDay(): Promise<ItineraryDay | null> {
    const existing = days.find((d) => d.day_number === selectedDayNum) || days[0];
    if (existing) return existing;
    const { startIso } = getTripStartEndIso(trip);
    try {
      const created = await addDay(trip.id, {
        day_number: 1,
        date: startIso,
        label: "วันที่ 1",
      });
      setDays([created]);
      setSelectedDayNum(created.day_number);
      return created;
    } catch {
      return null;
    }
  }

  async function handleSaveActivity() {
    if (savingAct || !actTitle.trim()) return;
    setActError("");
    setSavingAct(true);
    try {
      const dayObj = await ensureActiveDay();
      if (!dayObj) {
        setActError("โหลดวันเที่ยวไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      const combinedTitle = actDesc.trim()
        ? `${actTitle.trim()}\n${actDesc.trim()}`
        : actTitle.trim();
      if (editingActivityId) {
        await updateActivity(trip.id, editingActivityId, {
          time: actTime || "09:00",
          title: combinedTitle,
        });
      } else {
        await addActivity(trip.id, dayObj.id, {
          time: actTime || "09:00",
          title: combinedTitle,
          sort_order: dayObj.activities.length,
        });
      }
      const updatedDays = await getItinerary(trip.id);
      setDays(updatedDays);
      closeActSheet();
    } catch (error) {
      setActError(error instanceof Error ? error.message : "บันทึกรายละเอียดไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSavingAct(false);
    }
  }

  async function handleDeleteActivity() {
    if (savingAct || !editingActivityId) return;
    setSavingAct(true);
    try {
      await deleteActivity(trip.id, editingActivityId);
      const updatedDays = await getItinerary(trip.id);
      setDays(updatedDays);
      closeActSheet();
    } catch {
      closeActSheet();
    } finally {
      setSavingAct(false);
    }
  }

  const isDatesConfirmed = datesConfirmedLocal || trip.date_status === "confirmed";
  const confirmedDisplayRange = useMemo(() => {
    if (confirmedRangeOverride) {
      return formatThaiShortRange(
        confirmedRangeOverride.start,
        confirmedRangeOverride.end
      );
    }
    const { startIso, endIso } = getTripStartEndIso(trip);
    return formatThaiShortRange(startIso, endIso);
  }, [confirmedRangeOverride, trip]);

  const isSummaryMode = isOrganizer && selectedTarget === "summary";
  const selectedMemberLabel =
    selectedTarget === "summary"
      ? "สรุป"
      : joinedMembers.find((m) => m.user_id === selectedTarget)?.user.display_name ||
        me.display_name;
  const selectedMonthLabel = `${THAI_MONTHS_SHORT[viewMonth]} ${viewYear + 543}`;

  const activeDay =
    days.find((d) => d.day_number === selectedDayNum) || days[0] || null;
  const sortedActivities = activeDay
    ? [...activeDay.activities].sort((a, b) => a.time.localeCompare(b.time))
    : [];

  return (
    <main className="maew-home-scene maew-trip-fixed-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={me} />

      <div className="maew-trip-scroll-content">
      {/* Section Hero Banner + 4-Button Section Bar */}
      <TripTicketSelector trip={trip} activeVariant="plan" isOrganizer={isOrganizer} />

      {/* Card 1: สรุปวันเดินทาง (เมื่อยืนยันวันแล้ว - Figma 692:3874) หรือ เลือกวันว่าง (Figma 608:1215 / 674:5472 / 666:15959) */}
      {isDatesConfirmed ? (
        <section
          className="maew-plan-card"
          aria-label="สรุปวันเดินทาง"
          role={isOrganizer ? "button" : undefined}
          tabIndex={isOrganizer ? 0 : undefined}
          style={{
            gap: 10,
            cursor: isOrganizer ? "pointer" : "default",
          }}
          onClick={() => {
            if (isOrganizer) openConfirmDaySheet();
          }}
          onKeyDown={(e) => {
            if (isOrganizer && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              openConfirmDaySheet();
            }
          }}
        >
          <div className="maew-overview-field" style={{ width: "100%" }}>
            <p className="maew-overview-label">สรุปวันเดินทาง</p>
            <div className="maew-overview-date-row">
              <p className="maew-overview-value">{confirmedDisplayRange}</p>
              <p className="maew-overview-date-status">(ยืนยันแล้ว)</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="maew-plan-card" aria-label="เลือกวันว่าง">
          <div className="maew-plan-card-head">
            <h2 className="maew-plan-card-title">เลือกวันว่าง</h2>

            <div className="maew-plan-card-pills">
              {/* Organizer Only: Member / Summary Selector Pill (Figma 609:7385 / 674:5476) */}
              {isOrganizer && (
                <MaewDropdown
                  ariaLabel="เลือกสมาชิกหรือดูสรุปวันว่าง"
                  value={selectedTarget}
                  displayLabel={selectedMemberLabel}
                  options={[
                    ...joinedMembers.map((m) => ({
                      value: m.user_id,
                      label: m.user.display_name,
                    })),
                    { value: "summary", label: "สรุป" },
                  ]}
                  onChange={(val) => setSelectedTarget(val)}
                  minMenuWidth={136}
                />
              )}

              {/* Month / Year Selector Pill (Figma 672:5035) */}
              <MaewDropdown
                ariaLabel="เลือกเดือนและปี"
                value={`${viewYear}-${viewMonth}`}
                displayLabel={selectedMonthLabel}
                options={monthOptions.map((opt) => ({
                  value: opt.key,
                  label: opt.label,
                }))}
                onChange={(val) => {
                  const [y, m] = val.split("-").map(Number);
                  if (!Number.isNaN(y) && !Number.isNaN(m)) {
                    setViewYear(y);
                    setViewMonth(m);
                  }
                }}
                minMenuWidth={136}
              />
            </div>
          </div>

          <p className="maew-plan-calendar-note">
            {isSummaryMode
              ? "สีเขียว = ทุกคนว่างตรงกัน ยังไม่ใช่วันเดินทางที่ยืนยันแล้ว"
              : "สีเขียว = วันว่างของสมาชิกที่เลือก ยังไม่ใช่วันเดินทางที่ยืนยันแล้ว"}
          </p>

          {/* 7-Column Calendar Grid */}
          <div className="maew-plan-cal-grid">
            <div className="maew-plan-cal-row">
              {DAY_HEADERS.map((dow) => (
                <div key={dow} className="maew-plan-cal-dow">
                  {dow}
                </div>
              ))}
            </div>

            {Array.from({ length: Math.ceil(gridCells.length / 7) }).map((_, rowIdx) => (
              <div key={rowIdx} className="maew-plan-cal-row">
                {gridCells.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
                  if (!cell.inMonth) {
                    return (
                      <div
                        key={colIdx}
                        className="maew-plan-cal-cell"
                        style={{ backgroundColor: "transparent", color: "#767168", cursor: "default" }}
                      >
                        <span className="maew-plan-cal-daynum">{cell.date}</span>
                      </div>
                    );
                  }

                  const key = dateKey(viewYear, viewMonth, cell.date);

                  if (isSummaryMode) {
                    const aggrDay = aggrMap[key];
                    const mCount = aggrDay?.member_count || totalMemberCount;
                    const availCount = aggrDay?.available ?? 0;
                    const uncertainCount = aggrDay?.uncertain ?? 0;
                    const isAllAvail = mCount > 0 && availCount >= mCount;
                    const hasSomeOrUncertain = !isAllAvail && (availCount > 0 || uncertainCount > 0);

                    const bg = isAllAvail
                      ? "#2e8b5c"
                      : hasSomeOrUncertain
                      ? "#faefcb"
                      : "#f2efe8";
                    const textColor = isAllAvail
                      ? "#ffffff"
                      : hasSomeOrUncertain
                      ? "#d9a21b"
                      : "#14110d";
                    const subLabel = isAllAvail
                      ? "ทุกคนว่าง"
                      : `${availCount}/${mCount}`;

                    return (
                      <button
                        key={colIdx}
                        type="button"
                        className="maew-plan-cal-cell"
                        style={{ backgroundColor: bg, color: textColor }}
                        onClick={() => openConfirmDaySheet(key, key)}
                      >
                        <span className="maew-plan-cal-daynum">{cell.date}</span>
                        <span className="maew-plan-cal-sub">{subLabel}</span>
                      </button>
                    );
                  }

                  // Individual Member Edit Mode (Organizer or Participant)
                  const st = statusMap[key] ?? "unavailable";
                  const bg =
                    st === "available"
                      ? "#2e8b5c"
                      : st === "uncertain"
                      ? "#faefcb"
                      : "#f2efe8";
                  const textColor =
                    st === "available"
                      ? "#ffffff"
                      : st === "uncertain"
                      ? "#d9a21b"
                      : "#14110d";

                  return (
                    <button
                      key={colIdx}
                      type="button"
                      data-daykey={key}
                      disabled={!canPaint}
                      onPointerDown={onCellPointerDown(key)}
                      onClick={onCellClick(key)}
                      className="maew-plan-cal-cell"
                      style={{ backgroundColor: bg, color: textColor }}
                    >
                      <span className="maew-plan-cal-daynum">{cell.date}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer Controls inside Card 1 */}
          {isSummaryMode ? (
            <>
              <p className="maew-plan-calendar-note">เลือกช่วงวันที่ แล้วกด “ยืนยันวัน” เพื่อกำหนดวันเดินทาง</p>
              <hr className="maew-overview-divider" />

              <div className="maew-plan-summary-sec">
                <p className="maew-plan-summary-heading">สรุปวันว่าง</p>

                <div className="maew-plan-recommend-row">
                  <p className="maew-plan-summary-heading">แนะนำ</p>

                  <div className="maew-plan-recommend-chips">
                    {recommendedRanges.map((range, idx) => (
                      <button
                        key={`${range.start}-${range.end}`}
                        type="button"
                        className={`maew-plan-recommend-chip${selectedRecommendIdx === idx ? " is-active" : ""}`}
                        onClick={() => {
                          setSelectedRecommendIdx(idx);
                          setConfirmStartDate(range.start);
                          setConfirmEndDate(range.end);
                        }}
                      >
                        {formatThaiShortRange(range.start, range.end)}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="maew-plan-recommend-chip"
                      onClick={() => openConfirmDaySheet()}
                    >
                      เลือกด้วยตัวเอง
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`maew-plan-primary-btn${selectedRecommendIdx === null ? " is-soft" : ""}`}
                onClick={() => {
                  if (selectedRecommendIdx !== null && recommendedRanges[selectedRecommendIdx]) {
                    const chosen = recommendedRanges[selectedRecommendIdx];
                    openConfirmDaySheet(chosen.start, chosen.end);
                  } else {
                    openConfirmDaySheet();
                  }
                }}
              >
                ยืนยันวัน
              </button>
            </>
          ) : (
            <>
              <p className="maew-plan-hint">เลือกสถานะแล้วลากบนปฏิทินเพื่อระบุวันว่าง</p>
              <p className="maew-plan-calendar-note">
                {isOrganizer
                  ? "ต่อไป กด “สรุปวันว่าง” เพื่อเลือกช่วงวัน แล้วกด “ยืนยันวัน”"
                  : "ระบุวันว่างของคุณ แล้วรอผู้จัดทริปยืนยันวันเดินทาง"}
              </p>

              <div className="maew-plan-brush-row">
                <p className="maew-plan-brush-label">เปลี่ยนสถานะ</p>
                <div className="maew-plan-brush-pills">
                  <button
                    type="button"
                    className={`maew-plan-brush-btn maew-plan-brush-btn--available${
                      brush === "available" ? " is-active" : ""
                    }`}
                    onClick={() => setBrush("available")}
                  >
                    วันว่าง
                  </button>
                  <button
                    type="button"
                    className={`maew-plan-brush-btn maew-plan-brush-btn--unavailable${
                      brush === "unavailable" ? " is-active" : ""
                    }`}
                    onClick={() => setBrush("unavailable")}
                  >
                    วันไม่ว่าง
                  </button>
                  <button
                    type="button"
                    className={`maew-plan-brush-btn maew-plan-brush-btn--uncertain${
                      brush === "uncertain" ? " is-active" : ""
                    }`}
                    onClick={() => setBrush("uncertain")}
                  >
                    ไม่แน่ใจ
                  </button>
                </div>
              </div>

              {isOrganizer && (
                <>
                  <hr className="maew-overview-divider" />
                  <button
                    type="button"
                    className="maew-plan-primary-btn"
                    disabled={savingAvail}
                    onClick={handleSwitchToSummary}
                  >
                    สรุปวันว่าง
                  </button>
                </>
              )}
            </>
          )}
        </section>
      )}

      {/* Card 2: แพลนวันเที่ยว (Figma 692:3874 / 660:11202 / 674:5546 / 666:16195) */}
      <section className="maew-fav-card maew-day-plan-card" style={{ marginTop: 10 }} aria-label="แพลนวันเที่ยว">
        <div className="maew-fav-card-head">
          <h2 className="maew-fav-card-title">แพลนวันเที่ยว</h2>

          <div className="maew-plan-card-pills">
            {canEditItinerary && !isDatesConfirmed && (
              <button
                type="button"
                className="maew-overview-edit-pill"
                onClick={openAddActSheet}
              >
                + เพิ่มแพลน
              </button>
            )}

            <MaewDropdown
              ariaLabel="เลือกวันที่ต้องการดูแพลน"
              value={String(activeDay?.day_number ?? 1)}
              displayLabel={`Day ${activeDay ? activeDay.day_number : 1}`}
              options={
                days.length > 0
                  ? days.map((d) => ({
                      value: String(d.day_number),
                      label: `Day ${d.day_number}`,
                    }))
                  : [{ value: "1", label: "Day 1" }]
              }
              onChange={(val) => setSelectedDayNum(Number(val))}
              minMenuWidth={120}
            />

            {canEditItinerary && isDatesConfirmed && (
              <button
                type="button"
                className="maew-overview-edit-pill"
                onClick={() => setEditingItineraryList((v) => !v)}
              >
                {editingItineraryList ? "เสร็จสิ้น" : "แก้ไข"}
              </button>
            )}
          </div>
        </div>

        <div className="maew-fav-activities">
          {sortedActivities.length === 0 ? (
            <p className="maew-home-empty-sub" style={{ textAlign: "left" }}>
              ยังไม่มีแพลนในวันนี้
            </p>
          ) : (
            sortedActivities.map((act, idx) => {
              const { title, desc } = splitActivityTitleAndDesc(act.title);
              return (
                <div key={act.id} className="maew-plan-day-activity">
                  <div className="maew-plan-day-activity-line">
                    <div
                      className="maew-fav-activity-row"
                      role={canEditItinerary ? "button" : undefined}
                      tabIndex={canEditItinerary ? 0 : undefined}
                      style={{
                        flex: "1 0 0",
                        minWidth: 0,
                        cursor: canEditItinerary ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (canEditItinerary) openEditActSheet(act);
                      }}
                      onKeyDown={(e) => {
                        if (
                          canEditItinerary &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          openEditActSheet(act);
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        {editingItineraryList && (
                          <svg
                            width="21"
                            height="21"
                            viewBox="0 0 21 21"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                            style={{ flexShrink: 0 }}
                          >
                            <path
                              d="M4.63402 6.5H16.634M4.49805 11H16.495M4.63402 15.5H16.629"
                              stroke="#E85A2C"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        <p className="maew-wiz-activity-time">{act.time || "--:--"}</p>
                      </div>
                      <div className="maew-wiz-activity-body">
                        <p className="maew-wiz-activity-title">{title}</p>
                        {desc && <p className="maew-wiz-activity-desc">{desc}</p>}
                      </div>
                    </div>

                    {editingItineraryList && canEditItinerary && (
                      <button
                        type="button"
                        aria-label={`ลบ ${title}`}
                        disabled={deletingActivityId === act.id}
                        onClick={() => void handleDeleteActivityRow(act.id)}
                        style={{
                          width: 24,
                          height: 24,
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: deletingActivityId === act.id ? "wait" : "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width="15.679"
                          height="15.679"
                          viewBox="0 0 15.6786 15.6786"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M7.83932 6.71941L5.03956 3.91966C4.89105 3.77115 4.68963 3.68772 4.47961 3.68772C4.26959 3.68772 4.06817 3.77115 3.91966 3.91966C3.77115 4.06817 3.68772 4.26959 3.68772 4.47961C3.68772 4.68963 3.77115 4.89105 3.91966 5.03956L6.71941 7.83932L3.91966 10.6391C3.77115 10.7876 3.68772 10.989 3.68772 11.199C3.68772 11.409 3.77115 11.6105 3.91966 11.759C4.06817 11.9075 4.26959 11.9909 4.47961 11.9909C4.68963 11.9909 4.89105 11.9075 5.03956 11.759L7.83932 8.95922L10.6391 11.759C10.7876 11.9075 10.989 11.9909 11.199 11.9909C11.409 11.9909 11.6105 11.9075 11.759 11.759C11.9075 11.6105 11.9909 11.409 11.9909 11.199C11.9909 10.989 11.9075 10.7876 11.759 10.6391L8.95922 7.83932L11.759 5.03956C11.9075 4.89105 11.9909 4.68963 11.9909 4.47961C11.9909 4.26959 11.9075 4.06817 11.759 3.91966C11.6105 3.77115 11.409 3.68772 11.199 3.68772C10.989 3.68772 10.7876 3.77115 10.6391 3.91966L7.83932 6.71941Z"
                            fill="#767168"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  {idx < sortedActivities.length - 1 && <div className="maew-plan-day-divider" aria-hidden="true" />}
                </div>
              );
            })
          )}
        </div>

        {canEditItinerary && isDatesConfirmed && (
          <button
            type="button"
            className="maew-create-outline-btn"
            onClick={openAddActSheet}
          >
            เพิ่มแพลน
          </button>
        )}
      </section>

      </div>

      {/* Bottom Navigation Bar */}
      <HomeBottomNav />

      {/* Add / Edit Itinerary Activity Slide-Up Bottom Sheet */}
      {actSheetOpen && (
        <div
          className={`maew-plan-modal-backdrop${actSheetClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="act-sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeActSheet();
          }}
        >
          <div className={`maew-plan-modal-sheet${actSheetClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle-wrap" aria-hidden="true">
              <div className="maew-plan-modal-handle" />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="act-sheet-title" className="maew-plan-modal-title">
                {editingActivityId ? "แก้ไขแพลนวันเที่ยว" : "เพิ่มแพลนวันเที่ยว"}
              </h2>
              <button
                type="button"
                className="maew-plan-modal-close"
                aria-label="ปิดหน้าต่าง"
                onClick={closeActSheet}
              >
                <SheetCloseIcon />
              </button>
            </div>

            <label className="maew-plan-modal-label" htmlFor="act-time-input">
              เวลา
            </label>
            <input
              id="act-time-input"
              type="time"
              className="maew-plan-modal-input"
              value={actTime}
              onChange={(e) => setActTime(e.target.value)}
            />

            <label className="maew-plan-modal-label" htmlFor="act-title-input">
              สถานที่ / กิจกรรม
            </label>
            <input
              id="act-title-input"
              type="text"
              className="maew-plan-modal-input"
              placeholder="เช่น ตลาดคุโรมง (Kuromon Market)"
              value={actTitle}
              onChange={(e) => setActTitle(e.target.value)}
            />

            <label className="maew-plan-modal-label" htmlFor="act-desc-input">
              รายละเอียดเพิ่มเติม
            </label>
            <input
              id="act-desc-input"
              type="text"
              className="maew-plan-modal-input"
              placeholder="เช่น แวะกินอาหารทะเลสดๆ ช่วงเช้า"
              value={actDesc}
              onChange={(e) => setActDesc(e.target.value)}
            />

            {actError && <p className="maew-plan-modal-error" role="alert">{actError}</p>}

            <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
              {editingActivityId && (
                <button
                  type="button"
                  className="maew-plan-modal-submit"
                  style={{
                    flex: "0 0 auto",
                    width: "auto",
                    padding: "0 18px",
                    backgroundColor: "#f2efe8",
                    color: "#767168",
                  }}
                  disabled={savingAct}
                  onClick={() => void handleDeleteActivity()}
                >
                  ลบ
                </button>
              )}
              <button
                type="button"
                className="maew-plan-modal-submit"
                style={{ flex: 1 }}
                disabled={savingAct || !actTitle.trim()}
                onClick={() => void handleSaveActivity()}
              >
                {savingAct ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Day Slide-Up Bottom Sheet (Figma 674:11135) */}
      {confirmSheetOpen && (
        <div
          className={`maew-plan-modal-backdrop${confirmSheetClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-day-sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirmDaySheet();
          }}
        >
          <div className={`maew-plan-modal-sheet${confirmSheetClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle-wrap" aria-hidden="true">
              <div className="maew-plan-modal-handle" />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="confirm-day-sheet-title" className="maew-plan-modal-title">
                ยืนยันวัน
              </h2>
              <button
                type="button"
                className="maew-plan-modal-close"
                aria-label="ปิดหน้าต่างยืนยันวัน"
                onClick={closeConfirmDaySheet}
              >
                <SheetCloseIcon />
              </button>
            </div>

            <div className="maew-confirm-day-rows">
              <div className="maew-confirm-day-row">
                <p className="maew-confirm-day-label">ไป</p>
                <div className="maew-confirm-day-box">
                  <p className="maew-confirm-day-val">
                    {formatThaiBuddhistDate(confirmStartDate)}
                  </p>
                  <CalendarInputIcon />
                  <input
                    type="date"
                    aria-label="วันไป"
                    className="maew-confirm-day-native"
                    value={confirmStartDate}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setConfirmStartDate(nextStart);
                      if (confirmEndDate && nextStart > confirmEndDate) {
                        setConfirmEndDate(nextStart);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="maew-confirm-day-row">
                <p className="maew-confirm-day-label">กลับ</p>
                <div className="maew-confirm-day-box">
                  <p className="maew-confirm-day-val">
                    {formatThaiBuddhistDate(confirmEndDate)}
                  </p>
                  <CalendarInputIcon />
                  <input
                    type="date"
                    aria-label="วันกลับ"
                    className="maew-confirm-day-native"
                    min={confirmStartDate}
                    value={confirmEndDate}
                    onChange={(e) => setConfirmEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {confirmError && <p className="maew-plan-modal-error" role="alert">{confirmError}</p>}
            <button
              type="button"
              className="maew-plan-modal-submit"
              disabled={confirmingSaving}
              onClick={handleConfirmTripDates}
            >
              {confirmingSaving ? "กำลังบันทึก…" : "ยืนยันวัน"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

