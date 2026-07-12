"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTrip, joinTrip, getInitial, type Trip } from "@/lib/api";

export default function JoinTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getTrip(tripId)
      .then(setTrip)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tripId]);

  async function handleJoin() {
    setJoining(true);
    setError("");
    try {
      await joinTrip(tripId);
      router.push(`/trips/${tripId}/member`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setJoining(false);
    }
  }

  if (loading || !trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] pb-[30px] pt-[92px] px-[24px]">
        {/* Trip info header */}
        <div className="flex flex-col gap-[8px] pb-[20px]">
          <p className="text-[10px] uppercase tracking-[0.6px] text-[#767168]">คุณถูกเชิญเข้าทริป</p>
          <p className="text-[32px] font-medium leading-[1.15] tracking-[-0.32px] text-[#14110d]">
            {trip.name}
          </p>
          <div className="flex items-center gap-[10px] text-[13px] tracking-[0.08px]">
            <span className="text-[#767168]">{trip.destination}</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">{trip.duration_days} วัน</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">{trip.members.length} คน</span>
          </div>
          <div className="flex items-center gap-[6px]">
            <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">
              {trip.date_status === "confirmed" ? "วันที่ยืนยันแล้ว" : "ยังอยู่ระหว่างหาวัน"}
            </p>
            <div className="h-[3px] w-[56px] rounded-[3px] bg-[#e5e1d7]" />
          </div>
        </div>

        {/* Members preview */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[13px] tracking-[0.08px] text-[#767168]">สมาชิกที่เข้าร่วมแล้ว</p>
          <div className="grid grid-cols-2 gap-y-[12px]">
            {trip.members.filter((m) => m.status === "joined" || m.role === "organizer").map((m) => (
              <div key={m.id} className="flex items-center gap-[10px]">
                <div
                  className="flex size-[36px] shrink-0 items-center justify-center rounded-[18px] text-[14px] font-medium text-white"
                  style={{ backgroundColor: m.user.avatar_color }}
                >
                  {getInitial(m.user.display_name)}
                </div>
                <div>
                  <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
                    {m.user.display_name}
                  </p>
                  <p className="text-[10px] font-light uppercase tracking-[0.4px] text-[#767168]">
                    {m.role === "organizer" ? "จัดทริป" : "ร่วมทริป"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join button */}
        {error && (
          <p className="text-[12px] text-red-500">{error}</p>
        )}
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#e85a2c] text-[15px] font-medium tracking-[0.14px] text-white disabled:opacity-50"
        >
          {joining ? "กำลังเข้าร่วม..." : "เข้าร่วมทริปนี้"}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-[4px]">
          <p className="text-[11px] font-light tracking-[0.44px] text-[#b5b0a4]">
            ไม่ใช่ทริปที่คุณต้องการ?
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="border-b border-[#d4cfc2] pb-px text-[11px] font-light tracking-[0.44px] text-[#14110d]"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    </main>
  );
}
