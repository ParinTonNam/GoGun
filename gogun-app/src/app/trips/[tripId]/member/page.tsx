"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { LoadError } from "@/components/load-error";
import { useLoad } from "@/lib/use-load";
import {
  getTrip,
  getItinerary,
  getMe,
  formatShortDate,
  getInitial,
  type Trip,
  type ItineraryDay,
  type User,
} from "@/lib/api";
import { MemberBottomNav } from "@/components/member-bottom-nav";


export default function MemberOverviewPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [me, setMe] = useState<User | null>(null);

  const { loading, error: loadError, retry } = useLoad(async () => {
    const [t, d, u] = await Promise.all([getTrip(tripId), getItinerary(tripId), getMe()]);
    setTrip(t);
    setDays(d);
    setMe(u);
  }, [tripId]);

  if (loadError) {
    return <LoadError message={loadError} onRetry={retry} />;
  }

  if (loading || !trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  const dateLabel = trip.confirmed_start_date
    ? formatShortDate(trip.confirmed_start_date)
    : trip.proposed_start_date
    ? formatShortDate(trip.proposed_start_date)
    : "ยังไม่กำหนด";

  const dateStatus =
    trip.date_status === "confirmed" ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน";

  // ยังไม่กำหนดวันเดินทาง → ไม่โชว์วันที่ใต้เลข Day
  const hasTripDate = Boolean(trip.confirmed_start_date || trip.proposed_start_date);

  // แก้ itinerary ได้เมื่อเป็น organizer หรือทริปเปิดสิทธิ์ให้สมาชิกแก้
  const canEditItinerary = !!(me && (me.id === trip.organizer_id || trip.allow_member_itinerary_edit));

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] px-[24px] pb-[100px] pt-[24px]">
        {/* Header */}
        <PageHeader user={me} />

        {/* Trip info */}
        <div className="-mt-[4px] flex flex-col gap-[8px]">
          <div className="flex items-center gap-[10px] text-[13px] tracking-[0.08px]">
            <span className="text-[#767168]">{trip.duration_days} วัน</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">{trip.destination}</span>
          </div>
          <p className="text-[26px] font-medium tracking-[0.08px] text-[#14110d]">
            {trip.name}
          </p>
          <div className="flex items-center gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]">
            <div className="flex flex-1 flex-col gap-[5px]">
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">วันที่ (เสนอ)</p>
              <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                {dateLabel}
              </p>
            </div>
            <div className="flex h-[24px] items-center justify-center rounded-[31px] bg-[#faefcb] px-[10px]">
              <p className="text-[12px] font-medium tracking-[0.08px] text-[#d9a21b]">
                {dateStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Guest nudge — link an email to lock this name */}
        {me?.is_guest && (
          <button
            type="button"
            onClick={() => router.push(`/link-account?returnTo=/trips/${tripId}/member`)}
            className="flex items-center gap-[12px] rounded-[18px] border border-[#f3d9cc] bg-[#fdf3ee] px-[16px] py-[14px] text-left"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <rect x="3.5" y="9" width="13" height="8" rx="2.5" stroke="#e85a2c" strokeWidth="1.6" />
              <path d="M6.5 9V6.5a3.5 3.5 0 0 1 6.93-.7" stroke="#e85a2c" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="10" cy="13" r="1.2" fill="#e85a2c" />
            </svg>
            <span className="flex flex-1 flex-col gap-[2px]">
              <span className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
                บันทึกทริปนี้ไว้ด้วยการเชื่อมอีเมล
              </span>
              <span className="text-[11px] font-light leading-[1.5] tracking-[0.08px] text-[#767168]">
                ชื่อ {me.display_name} ยังไม่ล็อก ใครมีลิงก์ก็เข้าได้ จนกว่าจะเชื่อมอีเมล
              </span>
            </span>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0">
              <path d="M1 1l5 5-5 5" stroke="#e85a2c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Members */}
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center justify-between text-[13px] tracking-[0.08px]">
            <p className="text-[#767168]">เพื่อนร่วมทริป</p>
            <p className="font-medium text-[#14110d]">{trip.members.length} คน</p>
          </div>
          <div className="flex flex-wrap gap-[2px]">
            {trip.members.map((m) => (
              <div
                key={m.id}
                className="flex flex-col items-center gap-[8px] rounded-[18px] p-[10px]"
              >
                <div
                  className="flex size-[50px] items-center justify-center rounded-[25px] text-[15px] font-medium text-white"
                  style={{ backgroundColor: m.user.avatar_color }}
                >
                  {getInitial(m.user.display_name)}
                </div>
                <p className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                  {m.user.display_name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[13px] tracking-[0.08px] text-[#767168]">ข้อมูลทริป</p>
          <div className="flex gap-[10px]">
            {[
              { label: "ระยะเวลา", value: String(trip.duration_days), unit: "วัน" },
              { label: "สกุลเงิน", value: trip.currency, unit: "" },
              { label: "สมาชิก", value: String(trip.members.length), unit: "คน" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-1 flex-col gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[15px] py-[10px]"
              >
                <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                  {s.label}
                </p>
                <p className="text-[17px] font-medium tracking-[0.08px] text-[#14110d]">
                  {s.value}
                </p>
                {s.unit && (
                  <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
                    {s.unit}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Itinerary */}
        <div className="flex flex-col gap-[20px]">
          <div className="flex items-center justify-between text-[13px] tracking-[0.08px]">
            <p className="text-[#767168]">แผนการเดินทาง</p>
            {canEditItinerary ? (
              <button
                type="button"
                onClick={() => router.push(`/trips/${tripId}/itinerary`)}
                className="flex items-center gap-[4px] font-medium text-[#e85a2c]"
              >
                แก้ไข
                <svg width="6" height="10" viewBox="0 0 7 12" fill="none">
                  <path d="M1 1l5 5-5 5" stroke="#e85a2c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <p className="font-medium text-[#14110d]">อ่านเท่านั้น</p>
            )}
          </div>
          <div className="flex flex-col gap-[10px]">
            {days.map((day, di) => {
              const acts = [...day.activities].sort((a, b) => a.time.localeCompare(b.time));
              return (
              <div key={day.id}>
                <div className="flex gap-[25px]">
                  <div className="flex w-[55px] shrink-0 flex-col">
                    <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">Day</p>
                    <p className="text-[32px] font-light leading-[1.2] text-[#14110d]">
                      {String(day.day_number).padStart(2, "0")}
                    </p>
                    {hasTripDate && (
                      <p className="text-[15px] tracking-[0.08px] text-[#767168]">
                        {formatShortDate(day.date)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-1 min-w-0 flex-col gap-[10px]">
                    <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                      {day.label}
                    </p>
                    <div className="flex gap-[10px]">
                      <div className="flex w-[38px] shrink-0 flex-col gap-[5px]">
                        {acts.map((ev) => (
                          <p key={ev.id} className="h-[18px] text-[12px] font-light text-[#767168]">
                            {ev.time}
                          </p>
                        ))}
                      </div>
                      <div className="flex flex-1 min-w-0 flex-col gap-[5px]">
                        {acts.map((ev) => (
                          <p
                            key={ev.id}
                            className="h-[18px] truncate text-[12px] font-medium text-[#767168]"
                          >
                            {ev.title}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {di < days.length - 1 && <div className="mt-[10px] h-px w-full bg-[#e5e1d7]" />}
              </div>
              );
            })}
          </div>
        </div>
      </div>

      <MemberBottomNav active="trip" tripId={tripId} />
    </main>
  );
}
