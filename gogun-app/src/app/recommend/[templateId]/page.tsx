"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addActivity,
  addDay,
  createTrip,
  getMe,
  postComment,
  type User,
} from "@/lib/api";
import { getTemplate } from "@/lib/trip-templates";
import { MaewDropdown } from "@/components/trip-ticket-selector";
import { useLocale } from "@/lib/locale";
import { formatTripDayLabel } from "@/lib/day-label";

function upcomingSaturdayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7) + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  const router = useRouter();
  const { locale } = useLocale();
  const template = getTemplate(templateId);

  const [user, setUser] = useState<User | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMe({ redirectOnUnauthorized: false, signal: controller.signal })
      .then((me) => {
        if (!controller.signal.aborted) setUser(me);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!template) {
    return (
      <main className="maew-fav-page-scene">
        <div className="maew-home-empty">
          <p className="maew-home-empty-title">ไม่พบทริปแนะนำนี้</p>
          <Link href="/recommend" className="maew-plan-modal-submit" style={{ textDecoration: "none" }}>
            กลับไปหน้าทริปแนะนำ
          </Link>
        </div>
      </main>
    );
  }

  async function useThisTrip() {
    if (!template || creating) return;
    if (!user) {
      router.push(`/login?returnTo=/recommend/${template.id}`);
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
        name: template.name,
        destination: template.destination,
        icon: template.emoji,
        trip_type: template.trip_type,
        duration_days: template.duration_days,
        currency: template.currency,
        proposed_start_date: upcomingSaturdayISO(),
      });
      for (const [dayIdx, day] of template.days.entries()) {
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

  const activeDay = template.days[selectedDayIdx] ?? template.days[0];

  return (
    <main className="maew-fav-page-scene maew-fav-fixed-scene">
      <div className="maew-plan-modal-handle" aria-hidden="true">
        <span />
      </div>

      <div className="maew-plan-modal-head">
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 500, letterSpacing: "0.08px", color: "#14110d" }}>
          {template.name}
        </h1>
        <Link
          href="/recommend"
          aria-label="กลับไปหน้าทริปแนะนำ"
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
        </Link>
      </div>

      {/* Inner White Card (Figma 660:10208) */}
      <div className="maew-fav-card">
        <div className="maew-fav-card-head">
          <h2 className="maew-fav-card-title">แพลนวันเที่ยว</h2>

          <MaewDropdown
            ariaLabel="เลือกวันเที่ยว"
            value={String(selectedDayIdx)}
            displayLabel={formatTripDayLabel(selectedDayIdx + 1, locale)}
            options={template.days.map((d, idx) => ({
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
              <div
                key={`${act.time}-${act.title}`}
                style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}
              >
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
        onClick={useThisTrip}
        disabled={creating}
        className="maew-plan-modal-submit"
      >
        {creating ? "กำลังเพิ่มทริป..." : "เพิ่มเป็นทริปของฉัน"}
      </button>
    </main>
  );
}
