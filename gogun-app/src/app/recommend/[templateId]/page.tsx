"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { PageHeader } from "@/components/page-header";
import { getMe, createTrip, addDay, addActivity, type User } from "@/lib/api";
import { getTemplate } from "@/lib/trip-templates";

// วันเสาร์ถัดไป + offset วัน (เจ้าของทริปแก้วันได้ทีหลัง)
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
  const template = getTemplate(templateId);

  const [user, setUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // หน้านี้เปิดดูได้โดยไม่ล็อกอิน — getMe ใช้แค่โชว์ avatar บน header
    // พลาดก็ปล่อยผ่าน (token หมดอายุ api client จะ redirect ไป /login ให้เอง)
    getMe().then(setUser).catch(() => {});
  }, []);

  if (!template) {
    return (
      <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-[16px] px-[24px] pt-[80px]">
          <p className="text-[14px] font-light text-[#767168]">ไม่พบทริปแนะนำนี้</p>
          <Link
            href="/recommend"
            className="rounded-[12px] bg-[#14110d] px-[20px] py-[10px] text-[13px] font-medium text-[#f7f5f0]"
          >
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
        const created = await addDay(trip.id, {
          day_number: dayIdx + 1,
          date: upcomingSaturdayISO(dayIdx),
          label: day.label,
        });
        for (const [i, act] of day.activities.entries()) {
          await addActivity(trip.id, created.id, {
            time: act.time,
            title: act.title,
            sort_order: i,
          });
        }
      }
      router.push(`/trips/${trip.id}/itinerary`);
    } catch {
      setError("สร้างทริปไม่สำเร็จ ลองใหม่อีกครั้ง");
      setCreating(false);
    }
  }

  const multiDay = template.days.length > 1;

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="w-full max-w-[420px] pb-[96px]">
        <div className="flex flex-col gap-[16px] px-[24px] pb-[30px] pt-[24px]">

          <PageHeader user={user} title="ทริปแนะนำ" backHref="/recommend" />

          {/* Template card */}
          <div className="flex flex-col gap-[16px] rounded-[16px] border border-[#e5e1d7] bg-white p-[20px]">
            <div className="flex items-center gap-[12px]">
              <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[#fcede3]">
                <span className="text-[18px]">{template.emoji}</span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <p className="text-[15px] font-medium leading-[19px] tracking-[0.08px] text-[#14110d]">
                  {template.name}
                </p>
                <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">
                  {template.meta}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-[6px]">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#e5e1d7] bg-[#f7f5f0] px-[10px] py-[4px] text-[10px] font-light tracking-[0.08px] text-[#767168]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="h-px bg-[#edeae2]" />

            {/* กำหนดการ */}
            <div className="flex flex-col gap-[12px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#767168]">
                กำหนดการ
              </p>
              {template.days.map((day, dayIdx) => (
                <div key={day.label} className="flex flex-col gap-[10px]">
                  {multiDay && (
                    <p className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                      วันที่ {dayIdx + 1} · <span className="font-light text-[#767168]">{day.label}</span>
                    </p>
                  )}
                  {day.activities.map((act) => (
                    <div key={`${day.label}-${act.time}`} className="flex items-baseline gap-[12px]">
                      <span className="w-[42px] shrink-0 text-[12px] font-medium tracking-[0.08px] text-[#e85a2c]">
                        {act.time}
                      </span>
                      <span className="text-[13px] font-light leading-[17px] tracking-[0.08px] text-[#14110d]">
                        {act.title}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-[12px] font-light text-[#c0392b]">{error}</p>
            )}

            <button
              type="button"
              onClick={useThisTrip}
              disabled={creating}
              className="flex w-full items-center justify-center rounded-[12px] bg-[#14110d] py-[12px] disabled:opacity-60"
            >
              <span className="text-[13px] font-medium text-[#f7f5f0]">
                {creating ? "กำลังเพิ่มทริป..." : "ใช้ทริปนี้"}
              </span>
            </button>
            <p className="-mt-[8px] text-center text-[11px] font-light tracking-[0.08px] text-[#767168]">
              เพิ่มเป็นทริปของคุณพร้อมกำหนดการ แก้ไขได้ทุกอย่าง
            </p>
          </div>

        </div>
      </div>
      <BottomNav active="recommend" />
    </main>
  );
}
