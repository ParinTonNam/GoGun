"use client";

import Link from "next/link";
import { useState } from "react";
import { useTripWorkspace } from "@/components/trip-workspace";
import {
  HomeBottomNav,
  MaewTopbar,
  TripTicketSelector,
  getCatAvatarUrl,
} from "@/components/trip-ticket-selector";
import { removeMember, updateTrip, type Trip } from "@/lib/api";

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

function getSingleInitial(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "ต";
  return cleaned.slice(0, 1);
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

function formatThaiShortDateRange(trip: Trip): string {
  const startIso =
    trip.date_status === "confirmed"
      ? trip.confirmed_start_date
      : trip.proposed_start_date;
  if (!startIso) return "ยังไม่กำหนดวัน";

  const start = new Date(startIso);
  const end = new Date(startIso);
  end.setDate(end.getDate() + Math.max(1, trip.duration_days) - 1);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = THAI_MONTHS_SHORT[start.getMonth()] || "";
  const endMonth = THAI_MONTHS_SHORT[end.getMonth()] || "";

  if (trip.duration_days <= 1) {
    return `${startDay} ${startMonth}`;
  }
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay} - ${endDay} ${endMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
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

function MemberDeleteBadgeIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M27.9167 14.9999C27.9167 22.1336 22.1337 27.9165 15 27.9165C7.86634 27.9165 2.08335 22.1336 2.08335 14.9999C2.08335 7.8662 7.86634 2.08321 15 2.08321C22.1337 2.08321 27.9167 7.8662 27.9167 14.9999Z"
        fill="#E5E1D7"
        strokeWidth="0.833333"
        stroke="#D9D9D9"
      />
      <path
        d="M14.866 14.0667L12.5329 11.7336C12.4091 11.6099 12.2413 11.5403 12.0663 11.5403C11.8913 11.5403 11.7234 11.6099 11.5997 11.7336C11.4759 11.8574 11.4064 12.0252 11.4064 12.2002C11.4064 12.3753 11.4759 12.5431 11.5997 12.6669L13.9328 15L11.5997 17.3331C11.4759 17.4569 11.4064 17.6247 11.4064 17.7998C11.4064 17.9748 11.4759 18.1426 11.5997 18.2664C11.7234 18.3901 11.8913 18.4597 12.0663 18.4597C12.2413 18.4597 12.4091 18.3901 12.5329 18.2664L14.866 15.9333L17.1992 18.2664C17.3229 18.3901 17.4908 18.4597 17.6658 18.4597C17.8408 18.4597 18.0087 18.3901 18.1324 18.2664C18.2562 18.1426 18.3257 17.9748 18.3257 17.7998C18.3257 17.6247 18.2562 17.4569 18.1324 17.3331L15.7993 15L18.1324 12.6669C18.2562 12.5431 18.3257 12.3753 18.3257 12.2002C18.3257 12.0252 18.2562 11.8574 18.1324 11.7336C18.0087 11.6099 17.8408 11.5403 17.6658 11.5403C17.4908 11.5403 17.3229 11.6099 17.1992 11.7336L14.866 14.0667Z"
        fill="#767168"
      />
    </svg>
  );
}



export function TripOverview() {
  const { trip, me, permissions, refresh } = useTripWorkspace();
  const [copied, setCopied] = useState(false);

  // Member edit mode (Figma 660:8587)
  const [editingMembers, setEditingMembers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Edit trip bottom sheet (Figma 673:5354)
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSheetClosing, setEditSheetClosing] = useState(false);
  const [draftDestination, setDraftDestination] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [savingTrip, setSavingTrip] = useState(false);

  const isOrganizer = permissions.isOrganizer;
  const avatarBg = me?.avatar_color || "#c0613e";

  const joinedMembers = trip.members.filter((m) => m.status === "joined");
  const membersToDisplay =
    joinedMembers.length > 0
      ? joinedMembers
      : [
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

  function openEditTripSheet() {
    const { startIso, endIso } = getTripStartEndIso(trip);
    setDraftDestination(trip.destination || "");
    setDraftStartDate(startIso);
    setDraftEndDate(endIso);
    setEditSheetClosing(false);
    setEditSheetOpen(true);
  }

  function closeEditTripSheet() {
    setEditSheetClosing(true);
    window.setTimeout(() => {
      setEditSheetOpen(false);
      setEditSheetClosing(false);
    }, 240);
  }

  async function handleSaveTripInfo() {
    if (savingTrip) return;
    setSavingTrip(true);
    try {
      const start = new Date(`${draftStartDate}T00:00:00`);
      const end = new Date(`${draftEndDate}T00:00:00`);
      const diffDays =
        !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
          ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
          : trip.duration_days;

      const patchBody: Partial<Trip> = {
        destination: draftDestination.trim() || trip.destination,
        duration_days: diffDays,
        ...(trip.date_status === "confirmed"
          ? { confirmed_start_date: draftStartDate }
          : { proposed_start_date: draftStartDate }),
      };

      await updateTrip(trip.id, patchBody);
      refresh();
      closeEditTripSheet();
    } catch {
      closeEditTripSheet();
    } finally {
      setSavingTrip(false);
    }
  }

  async function handleRemoveMember(userId: string, isHostMember: boolean) {
    if (removingUserId || isHostMember) return;
    setRemovingUserId(userId);
    try {
      await removeMember(trip.id, userId);
      refresh();
    } catch {
      // ignore error if host or network issue
    } finally {
      setRemovingUserId(null);
    }
  }

  async function handleCopyInvite() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = trip.invite_code
      ? `${origin}/t/${trip.invite_code}`
      : `${origin}/trips/${trip.id}`;

    const shareMessage = `พร้อมไปเที่ยวหรือยังงง 🎒\nทริป ${trip.name} ขอเชิญเข้าร่วม!\n${inviteUrl}`;

    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="maew-home-scene maew-trip-fixed-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={me} />

      <div className="maew-trip-scroll-content">
      {/* Section Hero Banner + 4-Button Section Bar (Figma 768:4621 & 768:4680) */}
      <TripTicketSelector trip={trip} activeVariant="overview" isOrganizer={isOrganizer} />

      {/* Card 1: สถานที่เที่ยว & วันที่เดินทาง (Figma 590:6605) */}
      <section className="maew-overview-card" aria-label="ข้อมูลสถานที่และวันเดินทาง">
        <div className="maew-overview-field-row">
          <img
            src="/images/icon-location-pin.svg"
            alt=""
            width={20}
            height={20}
            className="maew-overview-field-icon"
          />
          <div className={`maew-overview-field${isOrganizer ? " maew-overview-field--editable" : ""}`}>
            <div className="maew-overview-field-head">
              <p className="maew-overview-label">สถานที่เที่ยว</p>
              {isOrganizer && (
                <button
                  type="button"
                  className="maew-overview-edit-pill"
                  onClick={openEditTripSheet}
                >
                  แก้ไข
                </button>
              )}
            </div>
            <p className="maew-overview-value">{trip.destination || trip.name}</p>
          </div>
        </div>

        <hr className="maew-overview-divider" />

        <div className="maew-overview-field-row">
          <img
            src="/images/icon-calendar-filled.svg"
            alt=""
            width={20}
            height={20}
            className="maew-overview-field-icon"
          />
          <div className="maew-overview-field">
            <p className="maew-overview-label maew-overview-date-label">{trip.date_status === "confirmed" ? "วันที่เดินทาง" : "ช่วงวันที่เสนอ"}</p>
            <div className="maew-overview-date-row">
              <p className="maew-overview-value">{formatThaiShortDateRange(trip)}</p>
              <p className="maew-overview-date-status">
                {trip.date_status === "confirmed" ? "(ยืนยันแล้ว)" : "(รอยืนยันวัน)"}
              </p>
            </div>
            {trip.date_status !== "confirmed" && (
              <p className="maew-overview-date-help">
                วันสีเขียวในปฏิทินหมายถึงวันว่าง ยังไม่ใช่วันเดินทางที่ยืนยันแล้ว{" "}
                <Link href={`/trips/${trip.id}/plan`}>
                  {isOrganizer ? "ดูวันว่างและยืนยันวัน" : "ดูวันว่างของฉัน"}
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Card 2: สมาชิก (Figma 591:6651 / 660:7507) */}
      <section className="maew-overview-members-card" aria-label="สมาชิกในทริป">
        <div className="maew-overview-members-head">
          <div className="maew-overview-members-title-wrap">
            <img
              src="/images/icon-folder-user.svg"
              alt=""
              width={26}
              height={26}
              className="maew-overview-members-icon"
            />
            <h2 className="maew-overview-members-title">สมาชิก</h2>
          </div>
          <div className="maew-overview-members-actions">
            {permissions.canInvite && (
              <button
                type="button"
                className="maew-overview-copy-btn"
                onClick={handleCopyInvite}
              >
                {copied ? "คัดลอกแล้ว" : "คัดลอกลิงค์เชิญ"}
              </button>
            )}
            {isOrganizer && (
              <button
                type="button"
                className="maew-overview-edit-pill"
                aria-pressed={editingMembers}
                onClick={() => setEditingMembers((v) => !v)}
              >
                {editingMembers ? "เสร็จสิ้น" : "แก้ไข"}
              </button>
            )}
          </div>
        </div>

        <div className="maew-overview-members-grid">
          {membersToDisplay.map((member, idx) => {
            const isHost =
              member.role === "organizer" || member.user_id === trip.organizer_id;
            const catSrc = getCatAvatarUrl(member.user.display_name, idx, member.user.avatar_color);
            return (
              <div key={member.id} className="maew-overview-member-item">
                <div className="maew-overview-member-avatar-wrap">
                  <img
                    src={catSrc}
                    alt=""
                    className="maew-overview-member-cat"
                    width={48}
                    height={48}
                  />
                  {isOrganizer && editingMembers && (
                    <button
                      type="button"
                      className="maew-overview-member-delete"
                      aria-label={`ลบ ${member.user.display_name} ออกจากทริป`}
                      disabled={removingUserId === member.user_id || isHost}
                      onClick={() => handleRemoveMember(member.user_id, isHost)}
                    >
                      <MemberDeleteBadgeIcon />
                    </button>
                  )}
                </div>
                <p className="maew-overview-member-name">{member.user.display_name}</p>
                {isHost && <p className="maew-overview-member-host">ผู้จัดทริป</p>}
              </div>
            );
          })}
        </div>
      </section>

      {trip.id === "demo" && (
        <section className="maew-demo-register-card" aria-label="สมัครใช้ทริปจริง">
          <h2>อยากใช้งานจริงไหม?</h2>
          <p>สมัครสมาชิกเพื่อสร้างทริปของคุณและวางแผนกับเพื่อน</p>
          <Link href="/signin" className="maew-demo-register-link">สมัครสมาชิก</Link>
        </section>
      )}

      </div>

      {/* Bottom Navigation Bar (Figma 590:6453) */}
      <HomeBottomNav />

      {/* Edit Trip Info Slide-Up Bottom Sheet (Figma 673:5354) */}
      {editSheetOpen && (
        <div
          className={`maew-plan-modal-backdrop${editSheetClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-trip-sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditTripSheet();
          }}
        >
          <div className={`maew-plan-modal-sheet${editSheetClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle-wrap" aria-hidden="true">
              <div className="maew-plan-modal-handle" />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="edit-trip-sheet-title" className="maew-plan-modal-title">
                แก้ไขข้อมูลทริป
              </h2>
              <button
                type="button"
                className="maew-plan-modal-close"
                aria-label="ปิดหน้าต่างแก้ไขข้อมูลทริป"
                onClick={closeEditTripSheet}
              >
                <SheetCloseIcon />
              </button>
            </div>

            <label className="maew-plan-modal-label" htmlFor="edit-trip-destination">
              สถานที่เที่ยว
            </label>
            <input
              id="edit-trip-destination"
              type="text"
              className="maew-plan-modal-input"
              placeholder="ญี่ปุ่น โอซาก้า"
              value={draftDestination}
              onChange={(e) => setDraftDestination(e.target.value)}
            />

            <label className="maew-plan-modal-label" htmlFor="edit-trip-start-date">
              สรุปวันเดินทาง
            </label>
            <div className="maew-edit-trip-dates-row">
              <div className="maew-edit-trip-date-box">
                <p className="maew-edit-trip-date-text">
                  {formatThaiBuddhistDate(draftStartDate)}
                </p>
                <input
                  id="edit-trip-start-date"
                  type="date"
                  className="maew-edit-trip-date-native"
                  aria-label="วันเริ่มเดินทาง"
                  value={draftStartDate}
                  onChange={(e) => {
                    const nextStart = e.target.value;
                    setDraftStartDate(nextStart);
                    if (draftEndDate && nextStart > draftEndDate) {
                      setDraftEndDate(nextStart);
                    }
                  }}
                />
              </div>

              <p className="maew-edit-trip-date-to">ถึง</p>

              <div className="maew-edit-trip-date-box">
                <p className="maew-edit-trip-date-text">
                  {formatThaiBuddhistDate(draftEndDate)}
                </p>
                <input
                  id="edit-trip-end-date"
                  type="date"
                  className="maew-edit-trip-date-native"
                  aria-label="วันสิ้นสุดการเดินทาง"
                  min={draftStartDate}
                  value={draftEndDate}
                  onChange={(e) => setDraftEndDate(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="maew-plan-modal-submit"
              disabled={savingTrip}
              onClick={handleSaveTripInfo}
            >
              {savingTrip ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
