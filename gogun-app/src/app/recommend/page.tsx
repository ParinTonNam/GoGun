"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addActivity,
  addDay,
  createTrip,
  getMe,
  getMyTrips,
  isTripPast,
  postComment,
  type Trip,
  type User,
} from "@/lib/api";
import { HomeBottomNav, HomeHeroBanner, MaewDropdown, MaewTopbar } from "@/components/trip-ticket-selector";
import { getDemoTrip, getDemoUser } from "@/lib/demo-trip-data";
import { useLocale } from "@/lib/locale";
import { formatTripDayLabel } from "@/lib/day-label";
import {
  TEMPLATE_FILTERS,
  TRIP_TEMPLATES,
  type TemplateFilter,
  type TripTemplate,
} from "@/lib/trip-templates";

function getSingleInitial(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "ต";
  return cleaned.slice(0, 1);
}

function upcomingSaturdayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7) + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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
          fill="url(#maew_recommend_ticket_gradient)"
        />
        <defs>
          <linearGradient
            id="maew_recommend_ticket_gradient"
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

export function RecommendView({ demoMode = false }: { demoMode?: boolean }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => demoMode ? getDemoUser() : null);
  const [trips, setTrips] = useState<Trip[]>(() => demoMode ? [getDemoTrip()] : []);
  const [activeFilter, setActiveFilter] = useState<TemplateFilter>("ทั้งหมด");
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) return;
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
    return () => controller.abort();
  }, [demoMode]);

  const filtered =
    activeFilter === "ทั้งหมด"
      ? TRIP_TEMPLATES
      : TRIP_TEMPLATES.filter((t) => t.tags.includes(activeFilter));

  const activeTripsCount = trips.filter((t) => !isTripPast(t)).length;

  function openTemplateSheet(template: TripTemplate) {
    setIsModalClosing(false);
    setSelectedDayIdx(0);
    setError(null);
    setSelectedTemplate(template);
  }

  function closeTemplateSheet() {
    if (isModalClosing) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedTemplate(null);
      setIsModalClosing(false);
      setError(null);
    }, 240);
  }

  async function handleUseTemplate() {
    if (!selectedTemplate || creating) return;
    if (demoMode) {
      router.push("/trips/demo");
      return;
    }
    if (!user) {
      router.push(`/login?returnTo=/recommend/${selectedTemplate.id}`);
      return;
    }
    if (user.is_guest) {
      router.push("/link-account");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const trip = await createTrip({
        name: selectedTemplate.name,
        destination: selectedTemplate.destination,
        icon: selectedTemplate.emoji,
        trip_type: selectedTemplate.trip_type,
        duration_days: selectedTemplate.duration_days,
        currency: selectedTemplate.currency,
        proposed_start_date: upcomingSaturdayISO(),
      });
      for (const [dayIdx, day] of selectedTemplate.days.entries()) {
        const createdDay = await addDay(trip.id, {
          day_number: dayIdx + 1,
          date: upcomingSaturdayISO(dayIdx),
          label: day.label,
        });
        for (const [i, act] of day.activities.entries()) {
          const createdAct = await addActivity(trip.id, createdDay.id, {
            time: act.time,
            title: act.title,
            sort_order: i,
          });
          if (act.description) {
            await postComment(trip.id, "activity", createdAct.id, act.description).catch(() => {});
          }
        }
      }
      router.push("/trips");
    } catch {
      setError("สร้างทริปไม่สำเร็จ ลองใหม่อีกครั้ง");
      setCreating(false);
    }
  }

  const activeDay =
    selectedTemplate?.days[selectedDayIdx] ?? selectedTemplate?.days[0] ?? null;

  return (
    <main className="maew-home-scene maew-app-fixed-scene maew-central-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={user} />

      <div className="maew-trip-scroll-content">
      {/* Section Hero Banner (Figma 769:8977) */}
      <HomeHeroBanner activeTripsCount={activeTripsCount} variant="central" />

      {/* Main White Card (Figma 660:9544) */}
      <section className="maew-home-card" aria-label="รายการทริปแนะนำ">
        {/* Filter Pills (Figma 660:9862) */}
        <div className="maew-recommend-filters" role="group" aria-label="หมวดหมู่ทริปแนะนำ">
          {TEMPLATE_FILTERS.map((label) => {
            const isActive = activeFilter === label;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(label)}
                className={`maew-recommend-pill${isActive ? " is-active" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Recommended Trip Rows (Figma 660:9548) */}
        <div className="maew-recommend-list">
          {filtered.map((trip) => (
            <button
              key={trip.id}
              type="button"
              onClick={() => openTemplateSheet(trip)}
              className="maew-home-trip-row"
            >
              <div className="maew-home-trip-row-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.75 12L10.5 9.75V4.5C10.5 4.10218 10.342 3.72064 10.0607 3.43934C9.77936 3.15804 9.39782 3 9 3C8.60218 3 8.22064 3.15804 7.93934 3.43934C7.65804 3.72064 7.5 4.10218 7.5 4.5V9.75L2.25 12V13.5L7.5 12V15L6 16.5V17.25L9 16.5L12 17.25V16.5L10.5 15V12L15.75 13.5V12Z"
                    stroke="#14110D"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="maew-home-trip-row-body">
                <p className="maew-home-trip-row-title">{trip.name}</p>
                <p className="maew-home-trip-row-sub">{trip.meta}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      </div>

      {/* Bottom Sheet: รายละเอียดทริปแนะนำ / เพิ่มเป็นทริปของฉัน (Figma 660:9923) */}
      {selectedTemplate && (
        <div
          className={`maew-plan-modal-backdrop${isModalClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="maew-fav-trip-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTemplateSheet();
          }}
        >
          <div className={`maew-fav-sheet${isModalClosing ? " is-closing" : ""}`}>
            <div className="maew-plan-modal-handle" aria-hidden="true">
              <span />
            </div>

            <div className="maew-plan-modal-head">
              <h2 id="maew-fav-trip-title">{selectedTemplate.name}</h2>
              <button
                type="button"
                aria-label="ปิดหน้าต่าง"
                onClick={closeTemplateSheet}
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

            {/* Inner White Card (Figma 660:10208) */}
            <div className="maew-fav-card">
              <div className="maew-fav-card-head">
                <h3 className="maew-fav-card-title">แพลนวันเที่ยว</h3>

                <MaewDropdown
                  ariaLabel="เลือกวันเที่ยว"
                  value={String(selectedDayIdx)}
                  displayLabel={formatTripDayLabel(selectedDayIdx + 1, locale)}
                  options={selectedTemplate.days.map((d, idx) => ({
                    value: String(idx),
                    label: `${formatTripDayLabel(idx + 1, locale)} — ${d.label}`,
                  }))}
                  onChange={(val) => setSelectedDayIdx(Number(val))}
                  minMenuWidth={160}
                />
              </div>

              {activeDay && (
                <div className="maew-fav-activities">
                  {activeDay.activities.map((act, idx) => (
                    <div key={`${act.time}-${act.title}`} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="maew-fav-activity-row">
                        <p className="maew-create-activity-time">{act.time}</p>
                        <div className="maew-create-activity-body">
                          <p className="maew-create-activity-title">{act.title}</p>
                          <p className="maew-create-activity-desc">
                            {act.description || activeDay.label}
                          </p>
                        </div>
                      </div>
                      {idx < activeDay.activities.length - 1 && (
                        <hr className="maew-fav-divider" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="maew-create-error">{error}</p>}

            <button
              type="button"
              onClick={handleUseTemplate}
              disabled={creating}
              className="maew-plan-modal-submit"
            >
              {creating ? "กำลังเพิ่มทริป..." : "เพิ่มเป็นทริปของฉัน"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (Figma 660:9494) */}
      <HomeBottomNav active="recommend" />
    </main>
  );
}

export default function RecommendPage() {
  return <RecommendView />;
}
