"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { type Trip } from "@/lib/api";
import { getTripCoverImage } from "@/lib/trip-themes";
import { useNotifications } from "@/lib/use-notifications";
import { NOTIFICATIONS_READY } from "@/lib/feature-flags";

export { HomeBottomNav, type HomeBottomNavActiveTab } from "@/components/home-bottom-nav";

export type TripTicketVariant = "overview" | "plan" | "money" | "accessory" | "setting";

export type MaewDropdownOption = {
  value: string;
  label: string;
};

export function MaewDropdown({
  value,
  options,
  onChange,
  displayLabel,
  ariaLabel,
  variant = "pill",
  align = "right",
  minMenuWidth,
}: {
  value: string;
  options: MaewDropdownOption[];
  onChange: (value: string) => void;
  displayLabel?: string;
  ariaLabel?: string;
  variant?: "pill" | "field";
  align?: "left" | "right";
  minMenuWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectedOpt = options.find((o) => o.value === value);
  const triggerText = displayLabel ?? selectedOpt?.label ?? "";

  return (
    <div
      ref={rootRef}
      className={`maew-dd-root maew-dd-root--${variant}${open ? " is-open" : ""}`}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={options.length === 0}
        className={
          variant === "field"
            ? `maew-expense-curr-box maew-dd-trigger-field${open ? " is-open" : ""}`
            : `maew-plan-dropdown-pill maew-dd-trigger-pill${open ? " is-open" : ""}`
        }
        onClick={(e) => {
          e.stopPropagation();
          if (options.length > 0) setOpen((prev) => !prev);
        }}
      >
        <span className={variant === "field" ? "maew-expense-curr-val" : "maew-dd-pill-text"}>
          {triggerText}
        </span>
        {variant === "field" ? (
          <svg
            width="9.5"
            height="5.542"
            viewBox="0 0 9.5 5.54167"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={`maew-dd-chevron${open ? " is-open" : ""}`}
          >
            <path
              d="M1 1L4.75 4.54167L8.5 1"
              stroke="#767168"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="7"
            height="4.083"
            viewBox="0 0 7 4.08333"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={`maew-dd-chevron${open ? " is-open" : ""}`}
          >
            <path
              d="M4.02358 3.87638C3.88586 4.0089 3.69918 4.08333 3.50454 4.08333C3.3099 4.08333 3.12322 4.0089 2.9855 3.87638L0.215022 1.20804C0.0772995 1.07528 -4.58939e-05 0.89525 2.04302e-08 0.70755C4.59347e-05 0.519855 0.0774795 0.33986 0.215266 0.207168C0.353053 0.0744765 0.539905 -4.42176e-05 0.73472 1.9684e-08C0.929535 4.42569e-05 1.11635 0.0746495 1.25408 0.207404L3.50454 2.37567L5.755 0.207404C5.89345 0.078434 6.07895 0.00702055 6.27155 0.00854485C6.46415 0.0100691 6.6484 0.084409 6.78465 0.215554C6.92085 0.346698 6.9982 0.524155 6.99995 0.7097C7.00175 0.895245 6.9278 1.07404 6.79405 1.20756L4.02407 3.87685L4.02358 3.87638Z"
              fill="white"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={`maew-dd-menu maew-dd-menu--${align}${
            variant === "field" ? " maew-dd-menu--field" : ""
          }`}
          style={minMenuWidth ? { minWidth: minMenuWidth } : undefined}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`maew-dd-option${isSelected ? " is-selected" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className="maew-dd-option-label">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const CAT_AVATARS = [
  "/images/cat-avatar-1.png",
  "/images/cat-avatar-2.png",
  "/images/cat-avatar-3.png",
  "/images/cat-avatar-4.png",
  "/images/cat-avatar-5.png",
  "/images/cat-avatar-6.png",
] as const;

export const PROFILE_CAT_AVATARS = [
  { src: CAT_AVATARS[0], color: "#fcb585" },
  { src: CAT_AVATARS[1], color: "#fead9c" },
  { src: CAT_AVATARS[3], color: "#b9daef" },
  { src: CAT_AVATARS[2], color: "#d0a0d2" },
  { src: CAT_AVATARS[4], color: "#a8cfd2" },
  { src: CAT_AVATARS[5], color: "#d0dab1" },
] as const;

export function getCatAvatarUrl(seed?: string | null, fallbackIndex = 0, avatarColor?: string | null): string {
  const selected = PROFILE_CAT_AVATARS.find((avatar) => avatar.color === avatarColor?.toLowerCase());
  if (selected) return selected.src;
  const cleaned = (seed ?? "").trim();
  if (!cleaned) {
    return CAT_AVATARS[Math.abs(fallbackIndex) % CAT_AVATARS.length];
  }
  if (cleaned.includes("ต้นน้ำ")) return CAT_AVATARS[0];
  if (cleaned.includes("อาตีฟ")) return CAT_AVATARS[1];
  if (cleaned.includes("นาย")) return CAT_AVATARS[2];
  if (cleaned.includes("เจมส์")) return CAT_AVATARS[3];

  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    hash = (hash * 31 + cleaned.charCodeAt(i)) >>> 0;
  }
  return CAT_AVATARS[(hash + Math.abs(fallbackIndex)) % CAT_AVATARS.length];
}

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

export function formatThaiShortDateRange(trip: Trip): string {
  const startIso =
    trip.date_status === "confirmed"
      ? trip.confirmed_start_date
      : trip.proposed_start_date;
  if (!startIso) return "12 - 15 พ.ย.";

  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "12 - 15 พ.ย.";
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

export function MaewTopbar({
  me,
}: {
  me?: { id?: string | null; display_name?: string | null; avatar_color?: string | null } | null;
}) {
  const demoMode = usePathname().startsWith("/trips/demo");
  const avatarSrc = getCatAvatarUrl(me?.display_name, 0, me?.avatar_color);
  const unreadCount = useNotifications(me?.id ?? null).filter((item) => !item.readAt).length;
  return (
    <header className="maew-home-topbar">
      <Link href={demoMode ? "/trips/demo" : "/trips"} className="maew-home-brand" aria-label="หน้าแรก Maew Tiew">
        <img src="/images/figma-gogun-mark.svg" alt="" width={31} height={30} />
        <div className="maew-home-brand-copy">
          <span className="maew-home-brand-title">Maew Tiew</span>
          <span className="maew-home-brand-sub">Happy Cats, Easy Trips</span>
        </div>
      </Link>

      <div className="maew-home-topbar-actions">
        {NOTIFICATIONS_READY && <Link href={demoMode ? "/trips/demo/notifications" : "/notifications"} className="maew-home-bell" aria-label={unreadCount ? `การแจ้งเตือน ${unreadCount} รายการที่ยังไม่อ่าน` : "การแจ้งเตือน"}>
          <svg
            width="15"
            height="16.5"
            viewBox="0 0 13.7486 15.1667"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M11.6549 5.96095V5.46185C11.6549 2.7215 9.51454 0.5 6.8743 0.5C4.23403 0.5 2.09367 2.7215 2.09367 5.46185V5.96095C2.09367 6.55993 1.92285 7.14544 1.60274 7.64383L0.818306 8.86506C0.101798 9.98055 0.648794 11.4968 1.89497 11.8496C5.15499 12.7724 8.59364 12.7724 11.8536 11.8496C13.0998 11.4968 13.6468 9.98055 12.9303 8.86506L12.1459 7.64383C11.8258 7.14544 11.6549 6.55993 11.6549 5.96095Z"
              stroke="#14110d"
              strokeLinecap="round"
            />
            <path
              d="M3.6868 12.5417C4.15078 13.7797 5.40271 14.6667 6.8743 14.6667C8.34586 14.6667 9.59784 13.7797 10.0618 12.5417"
              stroke="#14110d"
              strokeLinecap="round"
            />
          </svg>
          {unreadCount > 0 && <span className="maew-home-bell-badge" aria-hidden="true">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </Link>}

        <Link
          href={demoMode ? "/trips/demo/profile" : "/profile"}
          className="maew-home-user-pill"
          aria-label={me?.display_name ? `โปรไฟล์ ${me.display_name}` : "โปรไฟล์"}
        >
          <img
            src={avatarSrc}
            alt=""
            className="maew-home-user-cat"
            width={30}
            height={29}
          />
        </Link>
      </div>
    </header>
  );
}

export function HomeHeroBanner({
  activeTripsCount = 0,
}: {
  activeTripsCount?: number;
}) {
  return (
    <div className="maew-home-hero-stack">
      <section className="maew-home-hero-banner" aria-label="สรุปทริปทั้งหมด">
        <div className="maew-home-hero-bg" aria-hidden="true">
          <img src="/images/figma-hero-banner.png" alt="" className="maew-home-hero-img" />
          <div className="maew-home-hero-overlay" />
        </div>

        <div className="maew-home-hero-copy">
          <h1>สรุปทริปทั้งหมด</h1>
          <p>
            {activeTripsCount > 0
              ? `ทริปที่กำลังดำเนินอยู่ ${activeTripsCount} ทริป`
              : "ไม่มีทริปที่ดำเนินอยู่"}
          </p>
        </div>
      </section>
    </div>
  );
}

type SectionTabConfig = {
  variant: Exclude<TripTicketVariant, "setting">;
  label: string;
  getPath: (tripId: string) => string;
};

const SECTION_TABS: SectionTabConfig[] = [
  {
    variant: "overview",
    label: "แพลน",
    getPath: (tripId) => `/trips/${tripId}`,
  },
  {
    variant: "plan",
    label: "จัดวันเที่ยว",
    getPath: (tripId) => `/trips/${tripId}/plan`,
  },
  {
    variant: "money",
    label: "ตังฉัน",
    getPath: (tripId) => `/trips/${tripId}/expenses`,
  },
  {
    variant: "accessory",
    label: "ของวิเศษ",
    getPath: (tripId) => `/trips/${tripId}/group`,
  },
];

function SectionTabIcon({
  variant,
  active,
}: {
  variant: Exclude<TripTicketVariant, "setting">;
  active: boolean;
}) {
  const color = active ? "#FFFFFF" : "#767168";
  if (variant === "overview") {
    return (
      <span className="maew-section-tab-icon-box" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18.75 21.875V6.25H20.8333C21.4063 6.25 21.8969 6.45417 22.3052 6.8625C22.7135 7.27083 22.9174 7.76111 22.9167 8.33333V19.7917C22.9167 20.3646 22.7128 20.8552 22.3052 21.2635C21.8976 21.6719 21.4069 21.8757 20.8333 21.875H18.75ZM10.4167 6.25H14.5833V4.16667H10.4167V6.25ZM8.33333 21.875V4.16667C8.33333 3.59375 8.5375 3.10347 8.94583 2.69583C9.35417 2.28819 9.84444 2.08403 10.4167 2.08333H14.5833C15.1563 2.08333 15.6469 2.2875 16.0552 2.69583C16.4635 3.10417 16.6674 3.59444 16.6667 4.16667V21.875H8.33333ZM4.16667 21.875C3.59375 21.875 3.10347 21.6712 2.69583 21.2635C2.28819 20.8559 2.08403 20.3653 2.08333 19.7917V8.33333C2.08333 7.76042 2.2875 7.27014 2.69583 6.8625C3.10417 6.45486 3.59444 6.25069 4.16667 6.25H6.25V21.875H4.16667Z"
            fill={color}
          />
        </svg>
      </span>
    );
  }
  if (variant === "plan") {
    return (
      <span className="maew-section-tab-icon-box" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19.7917 4.16667H17.7083V2.08333H15.625V4.16667H9.375V2.08333H7.29167V4.16667H5.20833C4.0625 4.16667 3.125 5.10417 3.125 6.25V7.29167H21.875V6.25C21.875 5.10417 20.9375 4.16667 19.7917 4.16667ZM3.125 20.8333C3.125 21.9792 4.0625 22.9167 5.20833 22.9167H19.7917C20.9375 22.9167 21.875 21.9792 21.875 20.8333V8.33333H3.125V20.8333ZM15.625 12.5H17.7083V14.5833H15.625V12.5ZM15.625 16.6667H17.7083V18.75H15.625V16.6667ZM11.4583 12.5H13.5417V14.5833H11.4583V12.5ZM11.4583 16.6667H13.5417V18.75H11.4583V16.6667ZM7.29167 12.5H9.375V14.5833H7.29167V12.5ZM7.29167 16.6667H9.375V18.75H7.29167V16.6667Z"
            fill={color}
          />
        </svg>
      </span>
    );
  }
  if (variant === "money") {
    return (
      <span className="maew-section-tab-icon-box" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21.875 18.75V19.7917C21.875 20.3442 21.6555 20.8741 21.2648 21.2648C20.8741 21.6555 20.3442 21.875 19.7917 21.875H5.20833C4.6558 21.875 4.12589 21.6555 3.73519 21.2648C3.34449 20.8741 3.125 20.3442 3.125 19.7917V5.20833C3.125 4.6558 3.34449 4.12589 3.73519 3.73519C4.12589 3.34449 4.6558 3.125 5.20833 3.125H19.7917C20.3442 3.125 20.8741 3.34449 21.2648 3.73519C21.6555 4.12589 21.875 4.6558 21.875 5.20833V6.25H12.5C11.9475 6.25 11.4176 6.46949 11.0269 6.86019C10.6362 7.25089 10.4167 7.7808 10.4167 8.33333V16.6667C10.4167 17.2192 10.6362 17.7491 11.0269 18.1398C11.4176 18.5305 11.9475 18.75 12.5 18.75M12.5 16.6667H22.9167V8.33333H12.5M16.6667 14.0625C16.2523 14.0625 15.8548 13.8979 15.5618 13.6049C15.2688 13.3118 15.1042 12.9144 15.1042 12.5C15.1042 12.0856 15.2688 11.6882 15.5618 11.3951C15.8548 11.1021 16.2523 10.9375 16.6667 10.9375C17.0811 10.9375 17.4785 11.1021 17.7715 11.3951C18.0645 11.6882 18.2292 12.0856 18.2292 12.5C18.2292 12.9144 18.0645 13.3118 17.7715 13.6049C17.4785 13.8979 17.0811 14.0625 16.6667 14.0625Z"
            fill={color}
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="maew-section-tab-icon-box" aria-hidden="true">
      <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10.8125 6.56249L11.4062 5.37499L12.5938 4.78124L11.4062 4.18749L10.8125 2.99999L10.2188 4.18749L9.03125 4.78124L10.2188 5.37499L10.8125 6.56249ZM5.46875 8.93749L6.45809 6.95844L8.4375 5.96874L6.45809 4.97903L5.46875 2.99999L4.47941 4.97903L2.5 5.96874L4.47941 6.95844L5.46875 8.93749ZM18.5312 13.6875L17.5419 15.6665L15.5625 16.6562L17.5419 17.6459L18.5312 19.625L19.5206 17.6459L21.5 16.6562L19.5206 15.6665L18.5312 13.6875ZM21.1519 6.4968L18.0032 3.34807C17.7716 3.11577 17.4677 2.99999 17.1638 2.99999C16.8598 2.99999 16.5559 3.11577 16.324 3.34807L2.84809 16.824C2.38422 17.2878 2.38422 18.0397 2.84809 18.5032L5.99682 21.6519C6.22875 21.8838 6.53268 21.9996 6.83623 21.9996C7.14016 21.9996 7.44408 21.8838 7.67602 21.6519L21.1519 8.17563C21.6158 7.71251 21.6158 6.9603 21.1519 6.4968ZM15.839 10.5503L13.9497 8.66102L17.1634 5.44735L19.0526 7.33659L15.839 10.5503Z"
          fill={color}
        />
      </svg>
    </span>
  );
}

export function TripTicketSelector({
  trip,
  activeVariant = "overview",
  isOrganizer = false,
  titleOverride,
  subtitleOverride,
}: {
  trip: Trip;
  activeVariant?: TripTicketVariant;
  isOrganizer?: boolean;
  titleOverride?: string;
  subtitleOverride?: string;
}) {
  const statusText = trip.date_status === "confirmed" ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน";
  const displayTitle = titleOverride ?? (trip.destination || trip.name);
  const displayDate = subtitleOverride ?? formatThaiShortDateRange(trip);

  return (
    <div className="maew-trip-header-stack">
      {/* Scenic Hero Banner (Figma 768:4621) */}
      <section className="maew-trip-hero-banner" aria-label="ส่วนหัวทริป">
        <div className="maew-home-hero-bg" aria-hidden="true">
          <img src={getTripCoverImage(trip.theme)} alt="" className="maew-home-hero-img" />
          <div className="maew-home-hero-overlay" />
        </div>

        <div className="maew-trip-hero-content">
          <div className="maew-trip-hero-top-row">
            <h1 className="maew-trip-hero-title">{displayTitle}</h1>
            {isOrganizer && (
              <Link
                href={`/trips/${trip.id}/settings`}
                className="maew-trip-hero-edit-btn"
                aria-current={activeVariant === "setting" ? "page" : undefined}
              >
                แก้ไข
              </Link>
            )}
          </div>

          <div className="maew-trip-hero-date-row">
            <p className="maew-trip-hero-date">{displayDate}</p>
            <span className="maew-trip-hero-status-pill">{statusText}</span>
          </div>
        </div>
      </section>

      {/* 4-Button Section Navigation Bar overlapping banner (Figma 768:4680) */}
      <nav className="maew-section-tabs-card" aria-label="เมนูหมวดหมู่ของทริป">
        {SECTION_TABS.map((tab) => {
          const isActive = activeVariant === tab.variant;
          return (
            <Link
              key={tab.variant}
              href={trip.id === "demo" && tab.variant === "overview" ? "/trips/demo/trip" : tab.getPath(trip.id)}
              aria-current={isActive ? "page" : undefined}
              className={`maew-section-tab-btn${isActive ? " is-active" : ""}`}
            >
              <SectionTabIcon variant={tab.variant} active={isActive} />
              <span className="maew-section-tab-label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
