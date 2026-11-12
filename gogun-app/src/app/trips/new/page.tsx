"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  addActivity,
  addDay,
  createTrip,
  getMe,
  postComment,
  updateTrip,
  type CreateTripBody,
  type Trip,
  type User,
} from "@/lib/api";
import { inviteUrl } from "@/lib/invite";
import { TRIP_ICONS, TRIP_THEMES, type TripThemeId } from "@/lib/trip-themes";
import { HomeBottomNav, MaewTopbar } from "@/components/trip-ticket-selector";
import { useLocale } from "@/lib/locale";
import { formatTripDayLabel } from "@/lib/day-label";
import {
  localCalendarDate,
  readTripDraft,
  TRIP_DRAFT_KEY,
  TRIP_TEXT_MAX_LENGTH,
} from "@/lib/trip-creation-draft";

type DestinationOption = {
  code: string;
  label: string;
};

const DESTINATION_ROWS: DestinationOption[][] = [
  [
    { code: "ไทย", label: "Thailand" },
    { code: "日", label: "Japan" },
    { code: "台", label: "Taiwan" },
  ],
  [
    { code: "韓", label: "South Korea" },
    { code: "EU", label: "Europe" },
    { code: "越", label: "Vietnam" },
  ],
];

const TIME_OPTIONS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

type DraftActivity = {
  id: string;
  time: string;
  noTime: boolean;
  title: string;
  description: string;
};

type DraftDay = {
  dayNumber: number;
  activities: DraftActivity[];
};

function getSingleInitial(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "ต";
  return cleaned.slice(0, 1);
}

const PROGRESS_CONFIG: Record<1 | 2 | 3 | 4, { width: string; catLeft: string }> = {
  1: { width: "24.83%", catLeft: "47px" },
  2: { width: "49.65%", catLeft: "113px" },
  3: { width: "74.83%", catLeft: "185px" },
  4: { width: "100%", catLeft: "251px" },
};

export default function NewTripPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 state
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");

  // Step 2 state (Days + Plans)
  const [days, setDays] = useState<DraftDay[]>([]);
  const [modalDayNumber, setModalDayNumber] = useState<number | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isCatWalking, setIsCatWalking] = useState(false);
  const prevStep = useRef(step);
  const [planTitle, setPlanTitle] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planTime, setPlanTime] = useState("19:00");
  const [planNoTime, setPlanNoTime] = useState(false);

  useEffect(() => {
    if (prevStep.current !== step) {
      prevStep.current = step;
      setIsCatWalking(true);
      const timer = setTimeout(() => {
        setIsCatWalking(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Step 3 state (Trip permissions)
  const [allowExpenses, setAllowExpenses] = useState(true);
  const [allowItineraryEdit, setAllowItineraryEdit] = useState(true);
  const [allowInvite, setAllowInvite] = useState(false);
  const [tripIcon, setTripIcon] = useState<string>(TRIP_ICONS[0].emoji);
  const [tripTheme, setTripTheme] = useState<TripThemeId>("sakura");
  const [editingAppearance, setEditingAppearance] = useState(false);
  const [draftIcon, setDraftIcon] = useState<string>(TRIP_ICONS[0].emoji);
  const [draftTheme, setDraftTheme] = useState<TripThemeId>("sakura");

  function openAppearancePicker() {
    setDraftIcon(tripIcon);
    setDraftTheme(tripTheme);
    setEditingAppearance(true);
  }

  function confirmAppearance() {
    setTripIcon(draftIcon);
    setTripTheme(draftTheme);
    setEditingAppearance(false);
  }

  // Submission & Step 4 state
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
  const [copied, setCopied] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    getMe({ redirectOnUnauthorized: false, signal: controller.signal })
      .then((me) => {
        if (!controller.signal.aborted) setUser(me);
      })
      .catch(() => {});

    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      try {
        const draft = readTripDraft(sessionStorage);
        if (draft) {
          setName(draft.name);
          setDestination(draft.destination);
          setStartDate(draft.startDate);
          if (draft.icon && TRIP_ICONS.some((item) => item.emoji === draft.icon)) setTripIcon(draft.icon);
          if (draft.theme && TRIP_THEMES.some((item) => item.id === draft.theme)) setTripTheme(draft.theme as TripThemeId);
        }
      } catch {
        // Browser may disallow sessionStorage
      }
    });
    return () => controller.abort();
  }, []);

  function handleSelectDestination(label: string) {
    setDestination((prev) => (prev === label ? "" : label));
  }

  function handleAddDay() {
    setDays((prev) => [
      ...prev,
      {
        dayNumber: prev.length + 1,
        activities: [],
      },
    ]);
  }

  function openPlanModal(dayNumber: number) {
    setIsModalClosing(false);
    setModalDayNumber(dayNumber);
    setEditingActivityId(null);
    setPlanTitle("");
    setPlanDesc("");
    setPlanTime("19:00");
    setPlanNoTime(false);
  }

  function openEditPlanModal(dayNumber: number, act: DraftActivity) {
    setIsModalClosing(false);
    setModalDayNumber(dayNumber);
    setEditingActivityId(act.id);
    setPlanTitle(act.title);
    setPlanDesc(act.description);
    setPlanNoTime(act.noTime);
    setPlanTime(act.noTime ? "19:00" : act.time);
  }

  function closePlanModal() {
    if (isModalClosing) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setModalDayNumber(null);
      setEditingActivityId(null);
      setIsModalClosing(false);
    }, 250);
  }

  function handleDeletePlan() {
    if (modalDayNumber === null || !editingActivityId) return;
    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === modalDayNumber
          ? {
              ...d,
              activities: d.activities.filter((a) => a.id !== editingActivityId),
            }
          : d
      )
    );
    closePlanModal();
  }

  function handleAddPlanSubmit() {
    if (modalDayNumber === null) return;
    const title = planTitle.trim() || "ออกเดินทางไปญี่ปุ่น";
    const description = planDesc.trim();
    const displayTime = planNoTime ? "--:--" : planTime || "08:00";

    if (editingActivityId) {
      setDays((prev) =>
        prev.map((d) =>
          d.dayNumber === modalDayNumber
            ? {
                ...d,
                activities: d.activities.map((a) =>
                  a.id === editingActivityId
                    ? {
                        ...a,
                        time: displayTime,
                        noTime: planNoTime,
                        title,
                        description,
                      }
                    : a
                ),
              }
            : d
        )
      );
    } else {
      setDays((prev) =>
        prev.map((d) =>
          d.dayNumber === modalDayNumber
            ? {
                ...d,
                activities: [
                  ...d.activities,
                  {
                    id: `${d.dayNumber}-${Date.now()}`,
                    time: displayTime,
                    noTime: planNoTime,
                    title,
                    description,
                  },
                ],
              }
            : d
        )
      );
    }
    closePlanModal();
  }

  async function handleSubmitTrip() {
    if (submitting.current || !name.trim()) return;
    submitting.current = true;
    setCreating(true);
    setCreateError(null);
    setUnauthorized(false);

    const body: CreateTripBody = {
      name: name.trim(),
      destination: destination.trim() || "ไม่ระบุ",
      duration_days: Math.max(1, days.length),
      currency: "THB",
      proposed_start_date: startDate || undefined,
      icon: tripIcon,
      theme: tripTheme,
    };

    try {
      const trip = await createTrip(body, { redirectOnUnauthorized: false });

      // Update trip permissions if any differ from defaults
      if (!allowExpenses || !allowItineraryEdit || allowInvite) {
        try {
          await updateTrip(trip.id, {
            allow_member_expenses: allowExpenses,
            allow_member_itinerary_edit: allowItineraryEdit,
            allow_member_invite: allowInvite,
          });
        } catch {
          // Non-fatal if permission patch fails
        }
      }

      // Persist any days & activities created in Step 2
      if (days.length > 0) {
        const baseDateStr = startDate || localCalendarDate();
        for (const day of days) {
          try {
            const d = new Date(baseDateStr);
            d.setDate(d.getDate() + day.dayNumber - 1);
            const isoDate = d.toISOString().slice(0, 10);
            const savedDay = await addDay(trip.id, {
              day_number: day.dayNumber,
              date: isoDate,
              label: formatTripDayLabel(day.dayNumber, locale),
            });
            for (let i = 0; i < day.activities.length; i++) {
              const act = day.activities[i];
              const savedAct = await addActivity(trip.id, savedDay.id, {
                time: act.noTime ? "08:00" : act.time,
                title: act.title,
                sort_order: i,
              });
              if (act.description) {
                await postComment(trip.id, "activity", savedAct.id, act.description).catch(() => {});
              }
            }
          } catch {
            // Continue saving remaining days
          }
        }
      }

      try {
        sessionStorage.removeItem(TRIP_DRAFT_KEY);
      } catch {
        // Ignore sessionStorage errors
      }

      setCreatedTrip(trip);
      setStep(4);
      setCreating(false);
      submitting.current = false;
    } catch (error) {
      setUnauthorized(error instanceof ApiError && error.status === 401);
      setCreateError(
        error instanceof Error
          ? `สร้างทริปไม่สำเร็จ: ${error.message}`
          : "สร้างทริปไม่สำเร็จ กรุณาลองอีกครั้ง"
      );
      submitting.current = false;
      setCreating(false);
    }
  }

  async function handleCopyInvite() {
    const code = createdTrip?.invite_code || "tokyo-kyoto-x4";
    const fullUrl = inviteUrl(code);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  }

  const avatarBg = user?.avatar_color || "#c0613e";
  const progress = PROGRESS_CONFIG[step];

  return (
    <main className="maew-home-scene maew-app-fixed-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={user} />

      <div className="maew-trip-scroll-content">

      {/* Main White Card (Figma 362 × 658 at top: 109px) */}
      <section className={`maew-create-card${step === 3 ? " maew-create-card--settings" : ""}`} aria-live="polite">
        <div className="maew-create-top">
          {/* Shared Progress Bar + Walking Cat across Steps 1–4 */}
          <div className="maew-create-progress">
            <div className="maew-create-progress-row">
              <div className="maew-create-progress-track">
                <div className="maew-create-progress-fill" style={{ width: progress.width }} />
              </div>
              <span className="maew-create-progress-count">{step}/4</span>
            </div>
            <div
              className={`maew-create-progress-cat${isCatWalking ? " is-walking" : ""}`}
              style={{ left: progress.catLeft }}
            >
              <img src="/images/figma-walking-cat.svg" alt="" />
            </div>
          </div>

          {/* Step 1 Content: ตั้งชื่อทริป (Figma 660:13299) */}
          {step === 1 && (
            <>
              <div className="maew-create-badge-row">
                <span className="maew-create-badge-num">1</span>
                <span className="maew-create-badge-label">ตั้งชื่อทริป</span>
              </div>

              <h1 className="maew-create-title">จะไปไหนกันดี?</h1>
              <p className="maew-create-subtitle">
                ตั้งชื่อสั้นๆ ให้จำง่าย ค่อยมาเปลี่ยนก้ได้เหมียว!
              </p>

              <div className="maew-create-field">
                <label htmlFor="maew-trip-name" className="maew-create-label">
                  <span>ชื่อทริป </span>
                  <span className="maew-create-label-req">*</span>
                </label>
                <div className="maew-create-name-wrap">
                  <input
                    id="maew-trip-name"
                    name="name"
                    type="text"
                    required
                    maxLength={TRIP_TEXT_MAX_LENGTH}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น ทริปพายเรือดูแมว"
                    className="maew-create-name-input"
                  />
                </div>
              </div>

              <div className="maew-create-field">
                <p className="maew-create-label">จุดหมาย</p>
                <div className="maew-create-chips-grid">
                  {DESTINATION_ROWS.map((row, rowIdx) => (
                    <div key={rowIdx} className="maew-create-chips-row">
                      {row.map((item) => {
                        const selected = destination === item.label;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => handleSelectDestination(item.label)}
                            className={`maew-create-chip${selected ? " is-selected" : ""}`}
                          >
                            <span className="maew-create-chip-code">{item.code}</span>
                            <span className="maew-create-chip-name">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2 Content: แพลนวันเที่ยว (Figma 660:13482 & 664:14189) */}
          {step === 2 && (
            <>
              <div className="maew-create-badge-row">
                <span className="maew-create-badge-num">2</span>
                <span className="maew-create-badge-label">แพลนวันเที่ยว</span>
              </div>

              <h1 className="maew-create-title">แต่ละวันเที่ยวไหนบ้าง</h1>
              <p className="maew-create-subtitle maew-create-subtitle--spaced">
                ปรับได้ทุกอย่างทีหลังในเมนูแพลนวันเที่ยว
              </p>

              {days.length > 0 && <div className="maew-create-divider" />}

              {days.map((day) => (
                <div key={day.dayNumber} className="maew-create-day-block">
                  <div className="maew-create-day-head">
                    <h2 className="maew-create-day-title">{formatTripDayLabel(day.dayNumber, locale)}</h2>
                    <button
                      type="button"
                      onClick={() => openPlanModal(day.dayNumber)}
                      className="maew-create-add-plan-btn"
                    >
                      เพิ่มแพลน
                    </button>
                  </div>

                  {day.activities.map((act) => (
                    <div
                      key={act.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEditPlanModal(day.dayNumber, act)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openEditPlanModal(day.dayNumber, act);
                        }
                      }}
                      className="maew-create-activity-row"
                      title="กดเพื่อแก้ไขแพลน"
                      style={{ cursor: "pointer" }}
                    >
                      <p className="maew-create-activity-time">{act.time}</p>
                      <div className="maew-create-activity-body">
                        <p className="maew-create-activity-title">{act.title}</p>
                        {act.description && (
                          <p className="maew-create-activity-desc">{act.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddDay}
                className="maew-create-outline-btn"
              >
                เพิ่มวัน
              </button>
            </>
          )}

          {/* Step 3 Content: ตั้งค่าทริป (Figma 660:13807) */}
          {step === 3 && (
            <>
              <div className="maew-create-badge-row">
                <span className="maew-create-badge-num">3</span>
                <span className="maew-create-badge-label">ตั้งค่า</span>
              </div>

              <h1 className="maew-create-title">ตั้งค่าทริป</h1>
              <p className="maew-create-subtitle maew-create-subtitle--spaced">
                ปรับได้ทุกอย่างทีหลังในเมนู Settings
              </p>

              <div className="maew-create-settings-list">
                <div className="maew-create-setting-row">
                  <div className="maew-create-setting-copy">
                    <p className="maew-create-setting-title">เพิ่มค่าใช้จ่ายเองได้</p>
                    <p className="maew-create-setting-sub">ทุกคนเพิ่มบิลของตัวเองได้</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowExpenses}
                    aria-label="เพิ่มค่าใช้จ่ายเองได้"
                    onClick={() => setAllowExpenses((v) => !v)}
                    className="maew-create-switch"
                  >
                    <span className="maew-create-switch-knob" />
                  </button>
                </div>

                <div className="maew-create-setting-row">
                  <div className="maew-create-setting-copy">
                    <p className="maew-create-setting-title">แก้แผนเดินทางได้</p>
                    <p className="maew-create-setting-sub">สมาชิกแก้ itinerary ร่วมกัน</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowItineraryEdit}
                    aria-label="แก้แผนเดินทางได้"
                    onClick={() => setAllowItineraryEdit((v) => !v)}
                    className="maew-create-switch"
                  >
                    <span className="maew-create-switch-knob" />
                  </button>
                </div>

                <div className="maew-create-setting-row">
                  <div className="maew-create-setting-copy">
                    <p className="maew-create-setting-title">เชิญคนอื่นเพิ่มได้</p>
                    <p className="maew-create-setting-sub">ถ้าปิด มีแค่คุณที่เชิญเพิ่มได้</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowInvite}
                    aria-label="เชิญคนอื่นเพิ่มได้"
                    onClick={() => setAllowInvite((v) => !v)}
                    className="maew-create-switch"
                  >
                    <span className="maew-create-switch-knob" />
                  </button>
                </div>
                <button type="button" className="maew-create-setting-row maew-create-appearance-row" onClick={openAppearancePicker}>
                  <span className="maew-create-setting-copy">
                    <span className="maew-create-setting-title">แก้ไอคอนทริป</span>
                    <span className="maew-create-setting-sub">เพิ่มสัญลักษณ์ของทริป</span>
                  </span>
                  <span className="maew-create-icon-preview">
                    <img src={TRIP_ICONS.find((item) => item.emoji === tripIcon)?.image ?? TRIP_ICONS[0].image} alt="" />
                  </span>
                </button>
                <button type="button" className="maew-create-setting-row maew-create-appearance-row" onClick={openAppearancePicker}>
                  <span className="maew-create-setting-copy">
                    <span className="maew-create-setting-title">แก้ไขธีมทริป</span>
                    <span className="maew-create-setting-sub">เพิ่มสีสันของทริป</span>
                  </span>
                  <img className="maew-create-theme-preview" src={TRIP_THEMES.find((item) => item.id === tripTheme)?.image} alt="" />
                </button>
              </div>

              {createError && (
                <p role="alert" className="maew-create-error">
                  {createError}
                </p>
              )}
              {unauthorized && (
                <Link
                  href="/login?returnTo=%2Ftrips%2Fnew"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(
                        TRIP_DRAFT_KEY,
                        JSON.stringify({ name, destination, startDate, icon: tripIcon, theme: tripTheme })
                      );
                    } catch {
                      // Ignore storage error
                    }
                  }}
                  className="text-[13px] text-[#e85a2c] underline"
                >
                  เข้าสู่ระบบอีกครั้ง แล้วกลับมาสร้างทริปต่อ
                </Link>
              )}
            </>
          )}

          {/* Step 4 Content: ทริปพร้อมแล้ว (Figma 666:14345) */}
          {step === 4 && (
            <>
              <div className="maew-create-badge-row">
                <span className="maew-create-badge-num">4</span>
                <span className="maew-create-badge-label">ทริปพร้อมแล้ว</span>
              </div>

              <h1 className="maew-create-title">ได้เวลาชวนเพื่อนโลดด</h1>
              <p className="maew-create-subtitle">
                แชร์ลิงค์เพื่อให้เพื่อเข้าร่วมได้เลย
              </p>

              <div className="maew-create-success-hero" style={{ marginTop: "5px" }}>
                <img
                  src="/images/figma-trip-success-cat.svg"
                  alt=""
                  className="maew-create-success-cat"
                />
                <p className="maew-create-success-title">เปิดทริปสำเร็จ</p>
                <p className="maew-create-success-sub">ได้เวลาไปเที่ยวแล้ววว!!</p>
              </div>
            </>
          )}
        </div>

        {/* Bottom Action Area per Step */}
        {step === 1 && (
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => setStep(2)}
            className="maew-create-primary-btn"
          >
            ถัดไป
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(3)}
            className="maew-create-outline-btn"
          >
            ข้าม
          </button>
        )}

        {step === 3 && (
          <button
            type="button"
            disabled={creating}
            onClick={handleSubmitTrip}
            className="maew-create-primary-btn"
          >
            {creating ? "กำลังสร้างทริป..." : "ถัดไป"}
          </button>
        )}

        {step === 4 && (
          <div className="maew-create-bottom-stack">
            <div className="maew-create-invite-box">
              <p className="maew-create-invite-url">
                {`gogun.app/t/${createdTrip?.invite_code || "tokyo-kyoto-x4"}`}
              </p>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="maew-create-invite-copy"
              >
                {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push("/trips")}
              className="maew-create-primary-btn"
            >
              เสร็จสิ้น
            </button>
          </div>
        )}
      </section>

      </div>

      {editingAppearance && (
        <div
          className="maew-plan-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="maew-appearance-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setEditingAppearance(false);
          }}
        >
          <div className="maew-plan-modal-sheet maew-appearance-sheet">
            <div className="maew-plan-modal-handle" aria-hidden="true"><span /></div>
            <div className="maew-plan-modal-head">
              <h2 id="maew-appearance-title">ตั้งค่าไอคอนและธีม</h2>
              <button type="button" className="maew-appearance-close" aria-label="ปิด" onClick={() => setEditingAppearance(false)}>×</button>
            </div>
            <p className="maew-appearance-label">เลือกไอคอนทริป</p>
            <div className="maew-appearance-icon-grid">
              {TRIP_ICONS.map((item) => (
                <button
                  type="button"
                  key={item.emoji}
                  className="maew-appearance-icon-option"
                  aria-label={item.label}
                  aria-pressed={draftIcon === item.emoji}
                  onClick={() => setDraftIcon(item.emoji)}
                >
                  <img src={item.image} alt="" />
                </button>
              ))}
            </div>
            <p className="maew-appearance-label">เลือกธีมทริป</p>
            <div className="maew-appearance-theme-grid">
              {TRIP_THEMES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="maew-appearance-theme-option"
                  aria-label={item.label}
                  aria-pressed={draftTheme === item.id}
                  onClick={() => setDraftTheme(item.id)}
                >
                  <img src={item.image} alt="" />
                </button>
              ))}
            </div>
            <button type="button" className="maew-plan-modal-submit" onClick={confirmAppearance}>ยืนยัน</button>
          </div>
        </div>
      )}

      {/* Modal: เพิ่มแพลนเที่ยว (Figma 660:13965) */}
      {modalDayNumber !== null && (
        <div
          className={`maew-plan-modal-backdrop${isModalClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="maew-add-plan-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePlanModal();
          }}
        >
          <div className={`maew-plan-modal-sheet${isModalClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle" aria-hidden="true">
              <span />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="maew-add-plan-title">
                {editingActivityId ? "แก้ไขแพลนเที่ยว" : "เพิ่มแพลนเที่ยว"}
              </h2>
              <button
                type="button"
                aria-label="ปิดหน้าต่าง"
                onClick={closePlanModal}
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
            </div>

            <label htmlFor="maew-plan-title" className="maew-plan-modal-label">
              แพลนเวลานี้
            </label>
            <input
              id="maew-plan-title"
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="ออกเดินทางไปญี่ปุ่น"
              className="maew-plan-modal-input"
            />

            <label htmlFor="maew-plan-desc" className="maew-plan-modal-label">
              รายละเอียด
            </label>
            <textarea
              id="maew-plan-desc"
              value={planDesc}
              onChange={(e) => setPlanDesc(e.target.value)}
              placeholder="ออกเดินทางไปญี่ปุ่น"
              className="maew-plan-modal-textarea"
            />

            <div className="maew-plan-modal-time-row">
              <label htmlFor="maew-plan-time" className="maew-plan-modal-label">
                เวลา
              </label>
              <div className="maew-plan-modal-time-controls">
                <div
                  className={`maew-plan-modal-time-select-wrap${planNoTime ? " is-disabled" : ""}`}
                >
                  <span className="maew-plan-modal-time-val">
                    {planTime || "19:00"}
                  </span>
                  <svg
                    width="9.5"
                    height="5.54"
                    viewBox="0 0 9.5 5.54167"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M5.46057 5.2608C5.27367 5.44065 5.02031 5.54167 4.75616 5.54167C4.49201 5.54167 4.23865 5.44065 4.05175 5.2608L0.291815 1.63947C0.104907 1.45931 -6.22845e-05 1.21498 2.77267e-08 0.960248C6.234e-05 0.705515 0.105151 0.461238 0.292147 0.281157C0.479144 0.101075 0.732731 -6.00095e-05 0.997122 2.67139e-08C1.26151 6.0063e-05 1.51505 0.10131 1.70196 0.281477L4.75616 3.22412L7.81037 0.281477C7.99828 0.106446 8.25003 0.00952792 8.51139 0.0115966C8.77275 0.0136652 9.02281 0.114555 9.20771 0.292537C9.39261 0.470518 9.49757 0.71135 9.49996 0.963162C9.50235 1.21497 9.402 1.45762 9.22051 1.63883L5.46123 5.26144L5.46057 5.2608Z"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      fill="#767168"
                    />
                  </svg>
                  <input
                    type="time"
                    id="maew-plan-time"
                    value={planTime}
                    disabled={planNoTime}
                    onChange={(e) => setPlanTime(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {}
                    }}
                    className="maew-plan-modal-time-native"
                    aria-label="เลือกเวลา"
                  />
                </div>

                <button
                  type="button"
                  aria-pressed={planNoTime}
                  onClick={() => setPlanNoTime((v) => !v)}
                  className="maew-plan-modal-notime-btn"
                >
                  <span
                    className={`maew-plan-modal-checkbox${planNoTime ? " is-checked" : ""}`}
                    aria-hidden="true"
                  />
                  <span>ไม่ระบุเวลา</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddPlanSubmit}
              className="maew-plan-modal-submit"
            >
              {editingActivityId ? "บันทึกการแก้ไข" : "เพิ่มค่าใช้จ่าย"}
            </button>

            {editingActivityId && (
              <button
                type="button"
                onClick={handleDeletePlan}
                className="maew-plan-modal-delete-btn"
              >
                ลบแพลนนี้
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation (Figma 660:13299 / 660:13134) */}
      <HomeBottomNav />
    </main>
  );
}
