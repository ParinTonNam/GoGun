"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTrip, type Trip } from "@/lib/api";

type Tab = "link" | "qr";

export default function SharePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("link");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getTrip(tripId).then(setTrip).catch(console.error);
  }, [tripId]);

  const inviteLink = trip ? `gogun.app/t/${trip.invite_code}` : "กำลังโหลด...";
  const fullUrl = trip ? `https://gogun.app/t/${trip.invite_code}` : "";

  async function copyLink() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  async function shareVia() {
    if (!fullUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: fullUrl, title: trip?.name ?? "ทริปใหม่" });
        return;
      } catch {
        // cancelled or unsupported
      }
    }
    copyLink();
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-[8px] justify-center px-[32px] py-[40px]">
        {/* Mascot */}
        <div className="relative size-[176px] shrink-0">
          <img src="/images/mascot.svg" alt="GoGun" className="size-full object-contain" />
        </div>

        {/* Trip info */}
        <div className="flex flex-col items-center pb-[12px]">
          <p className="text-[13.5px] font-light leading-[21.6px] tracking-[0.08px] text-[#767168]">
            {trip?.name ?? "ทริปใหม่"}
          </p>
          <p className="text-[13.5px] font-light leading-[21.6px] tracking-[0.08px] text-[#767168]">
            {trip?.destination} · {trip?.duration_days} วัน · {trip?.members.length} คน
          </p>
        </div>

        {/* Share card */}
        <div className="w-full pb-[8px]">
          <div className="flex w-full flex-col gap-[10px] rounded-[18px] border border-[#e5e1d7] bg-white p-[19px]">
            <p className="text-[10px] uppercase tracking-[0.1px] text-[#767168]">
              {activeTab === "link" ? "ลิงก์เชิญเพื่อน" : "คิวอาโค้ดเชิญเพื่อน"}
            </p>

            {activeTab === "link" ? (
              <div className="pb-[2px]">
                <div className="flex items-center gap-[10px] rounded-[12px] bg-[#f2efe8] px-[14px] py-[12px]">
                  <div className="flex min-w-0 flex-1 flex-col py-[9px]">
                    <p className="truncate text-[12.5px] tracking-[0.08px] text-[#14110d]">
                      {inviteLink}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 rounded-[8px] bg-[#14110d] px-[12px] py-[7px] text-[12px] font-medium text-[#f7f5f0]"
                  >
                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pb-[2px]">
                <div className="flex items-center justify-center rounded-[12px] bg-[#f2efe8] p-[20px]">
                  <div className="flex size-[130px] items-center justify-center rounded-[8px] bg-[#14110d] p-[16px]">
                    <div className="grid grid-cols-3 gap-[6px]">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className="size-[22px] rounded-[2px]"
                          style={{ backgroundColor: [0,2,4,6,8].includes(i) ? "white" : "#14110d" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-[8px]">
              <button
                type="button"
                onClick={() => setActiveTab("link")}
                className="flex flex-1 flex-col items-center gap-[6px] rounded-[12px] bg-[#f2efe8] px-[16.5px] py-[10px]"
              >
                <div className="flex size-[36px] items-center justify-center rounded-[18px] bg-[#14110d]">
                  <img src="/images/icon-link-filled.svg" alt="" className="size-[19.5px]" />
                </div>
                <p className="text-[10.5px] font-light tracking-[0.21px] text-[#767168]">Link</p>
              </button>

              <button
                type="button"
                onClick={shareVia}
                className="flex flex-1 flex-col items-center gap-[6px] rounded-[12px] bg-[#f2efe8] px-[16.5px] py-[10px]"
              >
                <div className="flex size-[36px] items-center justify-center rounded-[18px] bg-[#06c755]">
                  <div className="relative size-[20px]">
                    <div className="absolute inset-[12.5%_8.33%_15.72%_8.33%]">
                      <img src="/images/icon-line.svg" alt="" className="size-full" />
                    </div>
                  </div>
                </div>
                <p className="text-[10.5px] font-light tracking-[0.21px] text-[#767168]">LINE</p>
              </button>

              <button
                type="button"
                onClick={shareVia}
                className="flex flex-1 flex-col items-center gap-[6px] rounded-[12px] bg-[#f2efe8] py-[10px]"
              >
                <div className="flex size-[36px] items-center justify-center rounded-[18px] bg-[#1877f2]">
                  <div className="relative size-[20px]">
                    <div className="absolute inset-[8.45%_8.33%_8.75%_8.33%]">
                      <img src="/images/icon-messenger.svg" alt="" className="size-full" />
                    </div>
                  </div>
                </div>
                <p className="text-[10.5px] font-light tracking-[0.21px] text-[#767168]">Messenger</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("qr")}
                className="flex flex-1 flex-col items-center gap-[6px] rounded-[12px] bg-[#f2efe8] px-[16.5px] py-[10px]"
              >
                <div className="flex size-[36px] items-center justify-center rounded-[18px] bg-[#e85a2c]">
                  <div className="relative size-[20px]">
                    <div className="absolute inset-[16.67%]">
                      <div className="absolute inset-[-6.25%]">
                        <img src="/images/icon-qr-share-a.svg" alt="" className="size-full" />
                      </div>
                    </div>
                    <div className="absolute inset-[33.33%]">
                      <img src="/images/icon-qr-share-b.svg" alt="" className="size-full" />
                    </div>
                  </div>
                </div>
                <p className="text-[10.5px] font-light tracking-[0.21px] text-[#767168]">QR</p>
              </button>
            </div>
          </div>
        </div>

        {/* Manage trip */}
        <button
          type="button"
          onClick={() => router.push(`/trips/${tripId}`)}
          className="flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#14110d] text-[14px] font-medium tracking-[0.14px] text-[#f7f5f0]"
        >
          จัดการทริป
        </button>
      </div>
    </main>
  );
}
