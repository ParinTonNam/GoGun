"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  logout,
  getMe,
  getMyTrips,
  isTripPast,
  updateMe,
  type Trip,
  type User,
} from "@/lib/api";
import {
  HomeBottomNav,
  HomeHeroBanner,
  MaewTopbar,
  PROFILE_CAT_AVATARS,
  getCatAvatarUrl,
} from "@/components/trip-ticket-selector";
import { getDemoTrip, getDemoUser } from "@/lib/demo-trip-data";
import { NOTIFICATIONS_READY } from "@/lib/feature-flags";
import { useLocale } from "@/lib/locale";

type ActiveSheet = "edit" | "language" | "help" | null;

function getSingleInitial(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "ต";
  return cleaned.slice(0, 1);
}

function getDoubleInitials(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned || cleaned === "ต้นน้ำ") return "ตน";
  const consonants = cleaned.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\s]/g, "");
  return (consonants || cleaned).slice(0, 2);
}

function formatThaiPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)]
    .filter(Boolean)
    .join("-");
}

const HELP_TOPICS = [
  {
    q: "วิธีใช้งานแอป",
    a: "คู่มือการใช้งานฟีเจอร์หลัก การจัดการบัญชี และคำแนะนำสำหรับการเริ่มต้นใช้งาน",
  },
  {
    q: "การชำระเงินและการเติมเงิน",
    a: "ระบบรองรับการบันทึกค่าใช้จ่ายหลายสกุลเงิน คำนวณยอดหารอัตโนมัติ และสรุปยอดโอนคืนระหว่างสมาชิกในทริป",
  },
  {
    q: "การจัดการบัญชีและความปลอดภัย",
    a: "สามารถแก้ไขชื่อที่แสดง อีเมล และเบอร์โทรศัพท์ได้ที่หน้าโปรไฟล์ ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย",
  },
  {
    q: "คำถามที่พบบ่อย",
    a: "สร้างทริป เชิญเพื่อนผ่านลิงก์โหวตวันว่าง และวางแผนการเดินทางร่วมกันได้ทันทีโดยไม่ต้องติดตั้งแอปเพิ่มเติม",
  },
  {
    q: "ติดต่อทีมสนับสนุน",
    a: "อีเมล: support@gogun.app · LINE: @gogunapp (จันทร์–ศุกร์ 09:00–18:00 น.)",
  },
];

function TicketBanner() {
  return (
    <section className="maew-home-ticket" aria-label="ส่วนหัวทริปทั้งหมด">
      <svg
        className="maew-home-ticket-bg"
        viewBox="0 0 362 83.6221"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M262.732 0C264.397 3.03309e-05 266.001 0.620817 267.232 1.74023L268.535 2.9248C269.712 3.99453 271.182 4.57233 272.678 4.65234V6.69043H275.354V4.24902C275.973 4.02015 276.568 3.69773 277.114 3.27734L279.57 1.3877C280.74 0.488139 282.174 -4.28539e-06 283.649 0H355.311C359.005 0.000155382 362 2.9959 362 6.69043V76.9316C362 80.6262 359.005 83.6219 355.311 83.6221H283.824C282.242 83.622 280.711 83.0611 279.503 82.0391L277.376 80.2393C276.759 79.7175 276.074 79.3268 275.354 79.0635V76.2627H272.678V78.668C271.089 78.7576 269.53 79.4105 268.325 80.6152L267.278 81.6621C266.024 82.9166 264.322 83.622 262.548 83.6221H6.68945C2.99495 83.6219 0 80.6262 0 76.9316V6.68945C0.000236944 2.99511 2.99509 0.000141465 6.68945 0H262.732ZM272.678 65.5596V70.9111H275.354V65.5596H272.678ZM272.678 54.8555V60.208H275.354V54.8555H272.678ZM272.678 44.1523V49.5039H275.354V44.1523H272.678ZM272.678 33.4492V38.8008H275.354V33.4492H272.678ZM272.678 22.7451V28.0967H275.354V22.7451H272.678ZM272.678 12.042V17.3936H275.354V12.042H272.678Z"
          fill="url(#maew_profile_ticket_gradient)"
        />
        <defs>
          <linearGradient
            id="maew_profile_ticket_gradient"
            x1="44.5"
            y1="11"
            x2="330"
            y2="99"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#D96843" />
            <stop offset="0.576923" stopColor="#AE5336" />
            <stop offset="1" stopColor="#733724" />
          </linearGradient>
        </defs>
      </svg>
      <div className="maew-home-ticket-copy">
        <h1>ทริปทั้งหมดของฉัน</h1>
        <p>รวมทริปทั้งหมดของเหมียว</p>
      </div>
      <Link href="/trips/new" className="maew-home-ticket-action">
        <svg
          width="33"
          height="33"
          viewBox="0 0 33 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M2 28H30" stroke="#FCEDE3" strokeWidth="2" />
          <path
            d="M6.59995 28.3395V10.1895L15.675 4.94999L25.1762 10.1895V28.3395M11.55 28.3395V19.2645H19.8V27.5145"
            stroke="#FCEDE3"
            strokeWidth="2"
          />
        </svg>
        <span>เพิ่มทริป</span>
      </Link>
    </section>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="ปิดหน้าต่าง"
      onClick={onClick}
      className="maew-plan-modal-close"
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M33.5 18C33.5 26.5604 26.5604 33.5 18 33.5C9.43959 33.5 2.5 26.5604 2.5 18C2.5 9.43959 9.43959 2.5 18 2.5C26.5604 2.5 33.5 9.43959 33.5 18Z"
          fill="#E5E1D7"
          stroke="#D9D9D9"
        />
        <path
          d="M17.8393 16.8801L15.0396 14.0803C14.8911 13.9318 14.6896 13.8484 14.4796 13.8484C14.2696 13.8484 14.0682 13.9318 13.9197 14.0803C13.7712 14.2288 13.6877 14.4303 13.6877 14.6403C13.6877 14.8503 13.7712 15.0517 13.9197 15.2002L16.7194 18L13.9197 20.7997C13.7712 20.9483 13.6877 21.1497 13.6877 21.3597C13.6877 21.5697 13.7712 21.7711 13.9197 21.9197C14.0682 22.0682 14.2696 22.1516 14.4796 22.1516C14.6896 22.1516 14.8911 22.0682 15.0396 21.9197L17.8393 19.1199L20.6391 21.9197C20.7876 22.0682 20.989 22.1516 21.199 22.1516C21.409 22.1516 21.6105 22.0682 21.759 21.9197C21.9075 21.7711 21.9909 21.5697 21.9909 21.3597C21.9909 21.1497 21.9075 20.9483 21.759 20.7997L18.9592 18L21.759 15.2002C21.9075 15.0517 21.9909 14.8503 21.9909 14.6403C21.9909 14.4303 21.9075 14.2288 21.759 14.0803C21.6105 13.9318 21.409 13.8484 21.199 13.8484C20.989 13.8484 20.7876 13.9318 20.6391 14.0803L17.8393 16.8801Z"
          fill="#767168"
        />
      </svg>
    </button>
  );
}

export function ProfileView({ demoMode = false }: { demoMode?: boolean }) {
  const router = useRouter();
  const { locale: language, setLocale: setLanguage } = useLocale();
  const [user, setUser] = useState<User | null>(() => demoMode ? getDemoUser() : null);
  const [trips, setTrips] = useState<Trip[]>(() => demoMode ? [getDemoTrip()] : []);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);

  // Settings & Edit states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [draftLanguage, setDraftLanguage] = useState<"th" | "en">("th");
  const [openHelpIdx, setOpenHelpIdx] = useState<number | null>(0);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarColor, setEditAvatarColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        setNotificationsEnabled(localStorage.getItem(demoMode ? "gogun_notif_demo" : "gogun_notif") !== "false");
      } catch {}
    });
    if (demoMode) return () => { active = false; };
    const controller = new AbortController();
    Promise.all([
      getMe({ redirectOnUnauthorized: false, signal: controller.signal }),
      getMyTrips({ redirectOnUnauthorized: false, signal: controller.signal }),
    ])
      .then(([me, myTrips]) => {
        if (!controller.signal.aborted) {
          setUser(me);
          setTrips(myTrips);
        }
      })
      .catch(() => {});

    return () => { active = false; controller.abort(); };
  }, [demoMode]);

  function openSheet(sheet: Exclude<ActiveSheet, null>) {
    setIsModalClosing(false);
    setSaveError(null);
    if (sheet === "edit") {
      setEditName(user?.display_name ?? (demoMode ? "บัญชีตัวอย่าง" : "ต้นน้ำ"));
      setEditEmail(user?.email ?? (demoMode ? "demo@maewtiew.invalid" : "tonnam@gmail.com"));
      setEditPhone(user?.phone ? formatThaiPhone(user.phone) : "");
      setEditAvatarColor(PROFILE_CAT_AVATARS.find((avatar) => avatar.color === user?.avatar_color?.toLowerCase())?.color ?? null);
    } else if (sheet === "language") {
      setDraftLanguage(language);
    } else if (sheet === "help") {
      setOpenHelpIdx(0);
    }
    setActiveSheet(sheet);
  }

  function closeSheet() {
    if (isModalClosing) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setActiveSheet(null);
      setIsModalClosing(false);
      setSaveError(null);
    }, 240);
  }

  async function handleSaveProfile() {
    if (saving) return;
    if (!user) {
      closeSheet();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (demoMode) {
        setUser({ ...user, display_name: editName.trim() || user.display_name, email: editEmail.trim() || user.email, phone: editPhone.trim(), avatar_color: editAvatarColor ?? user.avatar_color });
        closeSheet();
        return;
      }
      const updated = await updateMe({
        display_name: editName.trim() || user.display_name,
        email: editEmail.trim() || user.email,
        phone: editPhone.trim(),
        ...(editAvatarColor && { avatar_color: editAvatarColor }),
      });
      setUser(updated);
      closeSheet();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveLanguage() {
    setLanguage(draftLanguage);
    closeSheet();
  }

  function handleToggleNotifications() {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(demoMode ? "gogun_notif_demo" : "gogun_notif", String(next));
      } catch {}
      return next;
    });
  }

  async function handleLogout() {
    if (demoMode) { router.replace("/trips/demo"); return; }
    setLogoutError(null);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "ออกจากระบบไม่สำเร็จ");
    }
  }

  const userCatAvatar = getCatAvatarUrl(user?.display_name, 0, user?.avatar_color);
  const displayName = user?.display_name || (demoMode ? "บัญชีตัวอย่าง" : "ต้นน้ำ");
  const displayEmail = user?.email || (demoMode ? "demo@maewtiew.invalid" : "tonnam@gmail.com");
  const displayPhone = user?.phone ? formatThaiPhone(user.phone) : "09X-XXX-XXXX";
  const activeTripsCount = trips.filter((t) => !isTripPast(t)).length;

  const tripsOrganized = user
    ? trips.filter((t) => t.organizer_id === user.id).length
    : 2;
  const tripsTotal = user ? trips.length : 4;
  const countriesCount = user
    ? new Set(trips.map((t) => t.destination).filter(Boolean)).size
    : 4;

  return (
    <main className="maew-home-scene maew-profile-page-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={user} />

      <div className="maew-trip-scroll-content">
      {/* Section Hero Banner (Figma 769:8977) */}
      <HomeHeroBanner activeTripsCount={activeTripsCount} />

      {/* Main White Card (Figma 660:10560) */}
      <section className="maew-home-card" aria-label="ข้อมูลโปรไฟล์และการตั้งค่า">
        {/* Identity Row (Figma 660:10679) */}
        <div className="maew-profile-identity">
          <div className="maew-profile-identity-left">
            <div className="maew-profile-avatar">
              <img src={userCatAvatar} alt="" className="maew-profile-avatar-cat" />
            </div>
            <div className="maew-profile-info">
              <p className="maew-profile-name">{displayName}</p>
              <p className="maew-profile-sub">{displayEmail}</p>
              <p className="maew-profile-sub">{displayPhone}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openSheet("edit")}
            className="maew-profile-edit-btn"
          >
            แก้ไข
          </button>
        </div>

        {/* Stats Row (Figma 660:10691) */}
        <div className="maew-profile-stats">
          <div className="maew-profile-stat-col">
            <p className="maew-profile-stat-num">{tripsOrganized}</p>
            <p className="maew-profile-stat-label">ทริปที่จัด</p>
          </div>
          <div className="maew-profile-stat-divider" aria-hidden="true" />
          <div className="maew-profile-stat-col">
            <p className="maew-profile-stat-num">{tripsTotal}</p>
            <p className="maew-profile-stat-label">ทริปทั้งหมด</p>
          </div>
          <div className="maew-profile-stat-divider" aria-hidden="true" />
          <div className="maew-profile-stat-col">
            <p className="maew-profile-stat-num">{countriesCount}</p>
            <p className="maew-profile-stat-label">ประเทศ</p>
          </div>
        </div>

        {/* Settings Menu Rows */}
        <div className="maew-profile-menu-list">
          {/* Row 1: การแจ้งเตือน (Figma 660:10787) */}
          {NOTIFICATIONS_READY && <div className="maew-profile-menu-row maew-profile-menu-row--tall">
            <div className="maew-profile-menu-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                  stroke="#14110D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                  stroke="#14110D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="maew-profile-menu-copy">
              <p className="maew-profile-menu-title">การแจ้งเตือน</p>
              <p className="maew-profile-menu-sub">เปิดแจ้งเตือนทุกทริป</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label="เปิดแจ้งเตือนทุกทริป"
              onClick={handleToggleNotifications}
              className="maew-create-switch"
            >
              <span className="maew-create-switch-knob" />
            </button>
          </div>}

          {/* Row 2: ภาษา (Figma 660:10797) */}
          <button
            type="button"
            onClick={() => openSheet("language")}
            className="maew-profile-menu-row"
          >
            <div className="maew-profile-menu-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#14110D" strokeWidth="1.5" />
                <path
                  d="M12 3C12 3 8.5 7 8.5 12C8.5 17 12 21 12 21"
                  stroke="#14110D"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 3C12 3 15.5 7 15.5 12C15.5 17 12 21 12 21"
                  stroke="#14110D"
                  strokeWidth="1.5"
                />
                <path d="M3 12H21" stroke="#14110D" strokeWidth="1.5" />
                <path d="M4.5 8H19.5M4.5 16H19.5" stroke="#14110D" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="maew-profile-menu-copy">
              <p className="maew-profile-menu-title">ภาษา</p>
            </div>
            <span className="maew-profile-menu-val">
              {language === "en" ? "อังกฤษ" : "ไทย"}
            </span>
            <span className="maew-profile-menu-chevron" aria-hidden="true">
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path
                  d="M1 1L5 5L1 9"
                  stroke="#14110D"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          {/* Row 3: ช่วยเหลือ & ติดต่อ (Figma 660:10809) */}
          <button
            type="button"
            onClick={() => openSheet("help")}
            className="maew-profile-menu-row"
          >
            <div className="maew-profile-menu-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#14110D" strokeWidth="1.5" />
                <path
                  d="M9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 10.88 13.38 11.5 12 12.2V13.5"
                  stroke="#14110D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16.5" r="0.9" fill="#14110D" />
              </svg>
            </div>
            <div className="maew-profile-menu-copy">
              <p className="maew-profile-menu-title">ช่วยเหลือ & ติดต่อ</p>
            </div>
            <span className="maew-profile-menu-val">ดู</span>
            <span className="maew-profile-menu-chevron" aria-hidden="true">
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path
                  d="M1 1L5 5L1 9"
                  stroke="#14110D"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          {/* Row 4: ออกจากระบบ (Figma 660:10819) */}
          <button
            type="button"
            onClick={handleLogout}
            className="maew-profile-menu-row"
          >
            <div className="maew-profile-menu-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H14"
                  stroke="#14110D"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 15L19 12L16 9"
                  stroke="#14110D"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 12H10"
                  stroke="#14110D"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="maew-profile-menu-copy">
              <p className="maew-profile-menu-title">ออกจากระบบ</p>
            </div>
          </button>
          {logoutError && <p className="maew-create-error" role="alert">{logoutError}</p>}
        </div>
      </section>

      </div>

      {/* Bottom Sheet 1: แก้ไขโปรไฟล์ (Figma 660:10868) */}
      {activeSheet === "edit" && (
        <div
          className={`maew-plan-modal-backdrop${isModalClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="maew-profile-edit-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <div className={`maew-fav-sheet maew-profile-edit-sheet${isModalClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle" aria-hidden="true">
              <span />
            </div>

            <div className="maew-profile-edit-fields">
              <div className="maew-plan-modal-head">
                <h2 id="maew-profile-edit-title">โปรไฟล์</h2>
                <CloseButton onClick={closeSheet} />
              </div>

              <div className="maew-profile-edit-field">
                <p id="maew-edit-avatar-label" className="maew-plan-modal-label">รูปโปรไฟล์</p>
                <div className="maew-profile-edit-avatar-options" role="group" aria-labelledby="maew-edit-avatar-label">
                  {PROFILE_CAT_AVATARS.map((avatar, index) => (
                    <button
                      key={avatar.color}
                      type="button"
                      className="maew-profile-edit-avatar-option"
                      aria-label={`รูปโปรไฟล์แมวสีที่ ${index + 1}`}
                      aria-pressed={editAvatarColor === avatar.color}
                      onClick={() => setEditAvatarColor(avatar.color)}
                    >
                      <img src={avatar.src} alt="" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="maew-profile-edit-field">
                <label htmlFor="maew-edit-name" className="maew-plan-modal-label">ชื่อที่แสดง</label>
                <input id="maew-edit-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="ต้นน้ำ" className="maew-plan-modal-input" />
              </div>

              <div className="maew-profile-edit-field">
                <label htmlFor="maew-edit-email" className="maew-plan-modal-label">อีเมล</label>
                <input id="maew-edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="tonnam@gmail.com" className="maew-plan-modal-input" />
              </div>

              <div className="maew-profile-edit-field">
                <label htmlFor="maew-edit-phone" className="maew-plan-modal-label">เบอร์โทร</label>
                <input id="maew-edit-phone" type="tel" inputMode="tel" maxLength={12} value={editPhone} onChange={(e) => setEditPhone(formatThaiPhone(e.target.value))} placeholder="09X-XXX-XXXX" className="maew-plan-modal-input" />
              </div>
            </div>

            {saveError && <p className="maew-create-error">{saveError}</p>}

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="maew-plan-modal-submit"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet 2: เปลี่ยนภาษา (Figma 660:11015) */}
      {activeSheet === "language" && (
        <div
          className={`maew-plan-modal-backdrop${isModalClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="maew-profile-lang-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <div className={`maew-fav-sheet${isModalClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle" aria-hidden="true">
              <span />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="maew-profile-lang-title">ภาษา</h2>
              <CloseButton onClick={closeSheet} />
            </div>

            <div className="maew-profile-lang-list">
              <button
                type="button"
                onClick={() => setDraftLanguage("th")}
                className={`maew-profile-lang-row${
                  draftLanguage !== "th" ? " is-inactive" : ""
                }`}
              >
                <span className="maew-profile-lang-main">ไทย</span>
                <span className="maew-profile-lang-sub">แมวเที่ยว</span>
              </button>

              <button
                type="button"
                onClick={() => setDraftLanguage("en")}
                className={`maew-profile-lang-row${
                  draftLanguage !== "en" ? " is-inactive" : ""
                }`}
              >
                <span className="maew-profile-lang-main">อังกฤษ</span>
                <span className="maew-profile-lang-sub">Maew Tiew</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveLanguage}
              className="maew-plan-modal-submit"
            >
              บันทึก
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet 3: ช่วยเหลือ & ติดต่อ (Figma 660:11102) */}
      {activeSheet === "help" && (
        <div
          className={`maew-plan-modal-backdrop${isModalClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="maew-profile-help-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <div className={`maew-fav-sheet${isModalClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle" aria-hidden="true">
              <span />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="maew-profile-help-title">ช่วยเหลือ & ติดต่อ</h2>
              <CloseButton onClick={closeSheet} />
            </div>

            <div className="maew-profile-help-card">
              {HELP_TOPICS.map((item, idx) => {
                const isOpen = openHelpIdx === idx;
                return (
                  <div key={item.q} className="maew-profile-help-item">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenHelpIdx((prev) => (prev === idx ? null : idx))
                      }
                      className={`maew-profile-help-btn${
                        !isOpen ? " is-collapsed" : ""
                      }`}
                    >
                      <span className="maew-profile-help-q">{item.q}</span>
                      <span
                        className={`maew-home-section-chevron${
                          isOpen ? " is-open" : ""
                        }`}
                        aria-hidden="true"
                      >
                        <svg
                          width="14"
                          height="8.167"
                          viewBox="0 0 14 8.16667"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.04715 7.75275C7.77172 8.0178 7.39836 8.16667 7.00908 8.16667C6.6198 8.16667 6.24644 8.0178 5.97101 7.75275L0.430044 2.41607C0.154599 2.15056 -9.17877e-05 1.7905 4.08604e-08 1.4151C9.18694e-05 1.03971 0.154959 0.67972 0.430533 0.414336C0.706107 0.148953 1.07981 -8.84351e-05 1.46944 3.93679e-08C1.85907 8.85138e-05 2.23271 0.149299 2.50815 0.414808L7.00908 4.75134L11.51 0.414808C11.7869 0.156868 12.1579 0.0140411 12.5431 0.0170897C12.9283 0.0201382 13.2968 0.168818 13.5693 0.431107C13.8417 0.693395 13.9964 1.04831 13.9999 1.4194C14.0035 1.79049 13.8556 2.14807 13.5881 2.41512L8.04813 7.7537L8.04715 7.75275Z"
                            fillRule="evenodd"
                            clipRule="evenodd"
                            fill="#14110D"
                          />
                        </svg>
                      </span>
                    </button>

                    {isOpen && <p className="maew-profile-help-a">{item.a}</p>}

                    {idx < HELP_TOPICS.length - 1 && (
                      <hr className="maew-fav-divider" />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={closeSheet}
              className="maew-plan-modal-submit"
            >
              บันทึก
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (Figma 660:10510) */}
      <HomeBottomNav active="profile" />
    </main>
  );
}

export default function ProfilePage() {
  return <ProfileView />;
}
