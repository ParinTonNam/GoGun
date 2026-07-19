"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { PageHeader } from "@/components/page-header";
import {
  getMe,
  getMyTrips,
  formatTripDateRange,
  isTripPast,
  type User,
  type Trip,
} from "@/lib/api";

function TripIcon({ icon, destination }: { icon: string | null; destination: string }) {
  return (
    <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fcede3]">
      {icon ? (
        <span className="text-[16px]">{icon}</span>
      ) : (
        <span className="text-[16px] font-medium text-[#e85a2c]">
          {destination.slice(0, 1)}
        </span>
      )}
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
      <TripIcon icon={trip.icon} destination={trip.destination} />
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

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="w-full max-w-[420px] pb-[96px]">
        {trips.length > 0 ? (
          /* ── Trips list ── */
          <div className="flex flex-col gap-[24px] px-[24px] pb-[30px] pt-[24px]">
            {/* Header */}
            <PageHeader user={user} />

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
          <div className="flex min-h-screen flex-col px-[24px] pb-[96px] pt-[24px]">
            <PageHeader user={user} />
            <div className="flex flex-1 flex-col items-center justify-center gap-[28px]">
              <img src="/images/mascot.svg" alt="" className="size-[150px] object-contain" />
              <div className="flex flex-col items-center gap-[10px] text-center">
                <p className="text-[24px] font-medium tracking-[0.08px] text-[#14110d]">ยังไม่มีทริป</p>
                <p className="text-[13.5px] font-light leading-[1.7] text-[#767168]">
                  เริ่มต้นสร้างทริปแล้วเชิญเพื่อนเข้าร่วม
                  <br />
                  ไม่ต้องสมัครสมาชิก ใช้ลิงก์เดียวจบ
                </p>
              </div>
              <div className="flex w-full max-w-[280px] flex-col gap-[10px]">
                <Link
                  href="/trips/new"
                  className="flex items-center justify-center gap-[10px] rounded-[18px] bg-[#e85a2c] py-[15px]"
                >
                  <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
                  <span className="text-[15px] font-medium tracking-[0.08px] text-white">สร้างทริปใหม่</span>
                </Link>
                <Link
                  href="/recommend"
                  className="flex items-center justify-center rounded-[18px] border border-[#e5e1d7] bg-white py-[15px]"
                >
                  <span className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">แนะนำทริป</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav active="trips" />
    </main>
  );
}
