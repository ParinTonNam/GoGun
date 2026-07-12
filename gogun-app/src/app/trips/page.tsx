"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import {
  getMe,
  getMyTrips,
  formatTripDateRange,
  isTripPast,
  type User,
  type Trip,
} from "@/lib/api";

function TripIcon({ destination }: { destination: string }) {
  return (
    <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fcede3]">
      <span className="text-[16px] font-medium text-[#e85a2c]">
        {destination.slice(0, 1)}
      </span>
    </div>
  );
}

function TripCard({
  trip,
  actionLabel,
}: {
  trip: Trip;
  actionLabel: string;
}) {
  return (
    <div className="flex items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[15px] py-[13px]">
      <TripIcon destination={trip.destination} />
      <div className="flex flex-1 flex-col gap-[2px]">
        <p className="text-[13.5px] font-medium leading-[16.875px] tracking-[0.08px] text-[#14110d]">
          {trip.name}
        </p>
        <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">
          {formatTripDateRange(trip)}
        </p>
      </div>
      <Link
        href={`/trips/${trip.id}`}
        className="flex shrink-0 items-center justify-center rounded-[9px] bg-[#14110d] px-[14px] py-[7px]"
      >
        <span className="text-[12px] font-medium text-[#f7f5f0]">{actionLabel}</span>
      </Link>
    </div>
  );
}

export default function TripsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMe(), getMyTrips()])
      .then(([me, myTrips]) => {
        setUser(me);
        setTrips(myTrips);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  const activeTrips = trips.filter((t) => !isTripPast(t));
  const pastTrips = trips.filter((t) => isTripPast(t));

  const displayName = user?.display_name ?? "";
  const avatarColor = user?.avatar_color ?? "#c0613e";

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="w-full max-w-[430px] pb-[96px]">
        {trips.length > 0 ? (
          /* ── Trips list ── */
          <div className="flex flex-col gap-[24px] px-[24px] pb-[30px] pt-[24px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[7px]">
                <img src="/images/logo.svg" alt="" className="size-[19px]" />
                <span className="text-[11px] tracking-[0.08px] text-[#767168]">GOGUN</span>
                <span className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ไปกัน</span>
              </div>
              <div className="flex h-[33px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white p-[7px]">
                <div
                  className="flex size-[22px] items-center justify-center rounded-full text-[12px] font-medium text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {displayName.slice(0, 1)}
                </div>
                <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                  {displayName}
                </span>
              </div>
            </div>

            {/* Title row with create-trip button */}
            <div className="flex items-center justify-between">
              <h1 className="text-[28px] font-medium leading-[30.8px] tracking-[-0.28px] text-[#14110d]">
                ทริปของฉัน
              </h1>
              <Link
                href="/trips/new"
                className="flex items-center gap-[10px] rounded-[18px] border border-[#e5e1d7] bg-[#e85a2c] px-[20px] py-[10px]"
              >
                <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
                <span className="text-[13px] font-medium tracking-[0.08px] text-white">สร้างทริปใหม่</span>
              </Link>
            </div>

            {/* Active trips */}
            {activeTrips.length > 0 && (
              <div className="flex flex-col gap-[10px]">
                <div className="flex items-start justify-between">
                  <span className="pt-[1px] text-[11px] uppercase text-[#767168]">ต้องจัดการ</span>
                  <span className="text-[12px] font-medium tracking-[0.12px] text-[#e85a2c]">
                    {activeTrips.length} รายการ
                  </span>
                </div>
                <div className="flex flex-col gap-[8px]">
                  {activeTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} actionLabel="จัดการ" />
                  ))}
                </div>
              </div>
            )}

            {/* Past trips */}
            {pastTrips.length > 0 && (
              <div className="flex flex-col gap-[10px]">
                <div className="flex items-start justify-between">
                  <span className="pt-[1px] text-[11px] uppercase text-[#767168]">ทริปที่จบไปแล้ว</span>
                  <span className="text-[12px] font-medium tracking-[0.12px] text-[#e85a2c]">
                    {pastTrips.length} รายการ
                  </span>
                </div>
                <div className="flex flex-col gap-[8px]">
                  {pastTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} actionLabel="ดู" />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex min-h-screen flex-col items-center justify-center gap-[24px] px-[24px] pb-[96px]">
            <div className="flex w-[171px] flex-col items-center gap-[18px] px-[30px] pb-[18px] pt-[19px]">
              <div
                className="flex size-[110px] items-center justify-center rounded-full"
                style={{ backgroundColor: avatarColor }}
              >
                <span className="text-[20px] font-medium text-white">
                  {displayName.slice(0, 2)}
                </span>
              </div>
              <p className="text-[24px] font-medium tracking-[0.08px] text-[#14110d]">ยังไม่มีทริป</p>
              <div className="text-center text-[13px] font-light uppercase leading-normal text-[#767168]">
                <p>เริ่มต้นโดยการสร้างทริปแล้วเชิญเพื่อนเข้าร่วม</p>
                <p>ไม่ต้องสมัครสมาชิก ใช้ลิงก์เดียวจบ</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-[10px]">
              <Link
                href="/trips/new"
                className="flex w-[258px] items-center justify-center gap-[10px] rounded-[18px] border border-[#e5e1d7] bg-[#e85a2c] px-[57.5px] py-[15px]"
              >
                <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
                <span className="text-[15px] font-medium tracking-[0.08px] text-white">สร้างทริปใหม่</span>
              </Link>
              <div className="flex w-[171px] items-center justify-center rounded-[18px] border border-[#e5e1d7] px-[57.5px] py-[15px]">
                <span className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">เริ่มทริปกันเลย</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav active="trips" />
    </main>
  );
}
