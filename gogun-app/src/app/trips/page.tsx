"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  getMe,
  getMyTrips,
  formatTripDateRange,
  isTripPast,
  type User,
  type Trip,
} from "@/lib/api";
import {
  HomeBottomNav,
  HomeHeroBanner,
  MaewTopbar,
  getCatAvatarUrl,
} from "@/components/trip-ticket-selector";
import { getDemoTrip, getDemoUser } from "@/lib/demo-trip-data";

function SectionChevron({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={`maew-home-section-chevron${isOpen ? " is-open" : ""}`} aria-hidden="true">
      <svg width="14" height="8.167" viewBox="0 0 14 8.16667" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8.04715 7.75275C7.77172 8.0178 7.39836 8.16667 7.00908 8.16667C6.6198 8.16667 6.24644 8.0178 5.97101 7.75275L0.430044 2.41607C0.154599 2.15056 -9.17877e-05 1.7905 4.08604e-08 1.4151C9.18694e-05 1.03971 0.154959 0.67972 0.430533 0.414336C0.706107 0.148953 1.07981 -8.84351e-05 1.46944 3.93679e-08C1.85907 8.85138e-05 2.23271 0.149299 2.50815 0.414808L7.00908 4.75134L11.51 0.414808C11.7869 0.156868 12.1579 0.0140411 12.5431 0.0170897C12.9283 0.0201382 13.2968 0.168818 13.5693 0.431107C13.8417 0.693395 13.9964 1.04831 13.9999 1.4194C14.0035 1.79049 13.8556 2.14807 13.5881 2.41512L8.04813 7.7537L8.04715 7.75275Z"
          fillRule="evenodd"
          clipRule="evenodd"
          fill="#D96843"
        />
      </svg>
    </span>
  );
}

function TripListItem({ trip, demoMode = false }: { trip: Trip; demoMode?: boolean }) {
  const statusText = trip.date_status === "confirmed" ? "ยืนยันแล้ว" : "วันที่เสนอ · รอยืนยันวัน";
  return (
    <Link href={demoMode ? "/trips/demo/trip" : `/trips/${trip.id}`} className="maew-home-trip-row">
      <div className="maew-home-trip-row-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <p className="maew-home-trip-row-sub">
          <span>{formatTripDateRange(trip)}</span><span aria-hidden="true"> · </span><span>{statusText}</span>
        </p>
      </div>
    </Link>
  );
}

export function TripsView({ demoMode = false }: { demoMode?: boolean }) {
  const [user, setUser] = useState<User | null>(() => demoMode ? getDemoUser() : null);
  const [trips, setTrips] = useState<Trip[]>(() => demoMode ? [getDemoTrip()] : []);
  const [loading, setLoading] = useState(!demoMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [activeOpen, setActiveOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);

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
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setUnauthorized(error instanceof ApiError && error.status === 401);
          setLoadError(error instanceof Error ? error.message : "โหลดทริปไม่สำเร็จ");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt, demoMode]);

  const activeTrips = trips.filter((t) => !isTripPast(t));
  const pastTrips = trips.filter(isTripPast);
  const userCatAvatar = getCatAvatarUrl(user?.display_name, 0, user?.avatar_color);

  return (
    <main className="maew-home-scene maew-app-fixed-scene maew-central-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={user} />

      <div className="maew-trip-scroll-content">
      {/* Section Hero Banner (Figma 769:8977) */}
      <HomeHeroBanner activeTripsCount={activeTrips.length} loading={loading} variant="central" />

      {/* Main White Card (Figma 796:6318 / 660:9358) */}
      <section className="maew-home-card" aria-live="polite">
        {loading ? (
          <div className="maew-home-loading" role="status" aria-label="กำลังโหลดทริปของคุณ">
            <span className="maew-home-loading-heading" aria-hidden="true" />
            {[0, 1, 2].map((item) => (
              <span className="maew-home-loading-row" aria-hidden="true" key={item}>
                <span className="maew-home-loading-icon" />
                <span className="maew-home-loading-lines"><span /><span /></span>
              </span>
            ))}
          </div>
        ) : loadError && !unauthorized ? (
          <div className="maew-home-empty" role="alert">
            <p className="maew-home-empty-title">ยังโหลดทริปไม่ได้</p>
            <p className="maew-home-empty-sub">{loadError}</p>
            <button
              type="button"
              className="maew-home-retry-btn"
              onClick={() => {
                setLoadError(null);
                setLoading(true);
                setAttempt((v) => v + 1);
              }}
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : (
          <div className="maew-home-trips-list">
            {/* ทริปที่กำลังดำเนินการ (Figma 796:6319) */}
            <button
              type="button"
              className="maew-home-section-head"
              aria-expanded={activeOpen}
              onClick={() => setActiveOpen((v) => !v)}
            >
              <span className="maew-home-section-title--active">ทริปที่กำลังดำเนินการ</span>
              <SectionChevron isOpen={activeOpen} />
            </button>
            {activeOpen && (
              activeTrips.length > 0 ? (
                <div className="maew-home-trips-group">
                  {activeTrips.map((trip) => (
                    <TripListItem key={trip.id} trip={trip} demoMode={demoMode} />
                  ))}
                </div>
              ) : (
                <div className="maew-home-empty">
                  <img
                    src="/images/figma-empty-trips-cat.svg"
                    alt=""
                    width={180}
                    height={169}
                    className="maew-home-empty-illustration"
                  />
                  <p className="maew-home-empty-title">ยังไม่มีทริปเลยนะะ</p>
                  <p className="maew-home-empty-sub">
                    เริ่มต้นโดยการสร้างทริป
                    <br />
                    แล้วเชิญเพื่อนเลยโลดดดดดดด
                  </p>
                </div>
              )
            )}

            {/* ทริปที่จบไปแล้ว (Figma 796:6344) */}
            <button
              type="button"
              className="maew-home-section-head"
              aria-expanded={pastOpen}
              onClick={() => setPastOpen((v) => !v)}
            >
              <span className="maew-home-section-title--past">ทริปที่จบไปแล้ว</span>
              <SectionChevron isOpen={pastOpen} />
            </button>
            {pastOpen && pastTrips.length > 0 && (
              <div className="maew-home-trips-group">
                {pastTrips.map((trip) => (
                  <TripListItem key={trip.id} trip={trip} demoMode={demoMode} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      </div>

      {/* Bottom Navigation Bar (Figma 660:13135) */}
      <HomeBottomNav />
    </main>
  );
}

export default function TripsPage() {
  return <TripsView />;
}
