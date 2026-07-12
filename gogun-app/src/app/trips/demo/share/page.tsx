"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INVITE_LINK = "gogun.app/t/tokyo-kyoto-x4";
const FULL_URL = `https://${INVITE_LINK}`;

export default function SharePage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  async function copyLink(feedbackSetter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(FULL_URL);
      feedbackSetter(true);
      setTimeout(() => feedbackSetter(false), 1500);
    } catch {}
  }

  function openLine() {
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(FULL_URL)}`, "_blank");
  }

  function openMessenger() {
    // try deep-link first (iOS/Android Messenger app), fallback to web share
    const deepLink = `fb-messenger://share/?link=${encodeURIComponent(FULL_URL)}`;
    const webLink = `https://www.facebook.com/dialog/share?href=${encodeURIComponent(FULL_URL)}`;
    const start = Date.now();
    window.location.href = deepLink;
    setTimeout(() => {
      if (Date.now() - start < 1500) window.open(webLink, "_blank");
    }, 800);
  }

  const BUTTONS = [
    {
      label: "Link",
      circleBg: "#14110d",
      icon: "/images/icon-share-link.svg",
      iconSize: "size-[19.5px]",
      padding: "p-[9px]",
      onClick: () => copyLink(setLinkCopied),
      active: linkCopied,
      activeLabel: "คัดลอกแล้ว",
    },
    {
      label: "LINE",
      circleBg: "#06c755",
      icon: "/images/icon-share-line.svg",
      iconSize: "size-[20px]",
      padding: "p-[8px]",
      onClick: openLine,
      active: false,
      activeLabel: null,
    },
    {
      label: "Messenger",
      circleBg: "#1877f2",
      icon: "/images/icon-share-messenger.svg",
      iconSize: "size-[20px]",
      padding: "p-[8px]",
      onClick: openMessenger,
      active: false,
      activeLabel: null,
    },
    {
      label: "QR",
      circleBg: showQr ? "#14110d" : "#e85a2c",
      icon: "/images/icon-share-qr.svg",
      iconSize: "size-[20px]",
      padding: "p-[8px]",
      onClick: () => setShowQr((v) => !v),
      active: showQr,
      activeLabel: null,
    },
  ] as const;

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col items-center justify-center gap-[8px] px-[32px] py-[40px]">

        {/* Mascot */}
        <div className="relative size-[176px] shrink-0">
          <img src="/images/mascot.svg" alt="GoGun" className="size-full object-contain" />
        </div>

        {/* Trip info */}
        <div className="flex flex-col items-center pb-[20px]">
          <p className="text-[13.5px] font-light leading-[21.6px] tracking-[0.08px] text-[#767168]">
            ทริปใหม่ · Japan
          </p>
          <p className="text-[13.5px] font-light leading-[21.6px] tracking-[0.08px] text-[#767168]">
            10 พ.ย. – 13 พ.ย. · 4 คน
          </p>
        </div>

        {/* Share card */}
        <div className="w-full pb-[8px]">
          <div className="flex w-full flex-col gap-[10px] rounded-[18px] border border-[#e5e1d7] bg-white p-[19px]">

            {/* Label */}
            <p className="text-[10px] uppercase tracking-[0.1px] text-[#767168]">
              {showQr ? "คิวอาโค้ดเชิญเพื่อน" : "ลิงก์เชิญเพื่อน"}
            </p>

            {/* Link row / QR toggle */}
            <div className="pb-[2px]">
              {showQr ? (
                <div className="flex items-center justify-center rounded-[12px] bg-[#f2efe8] p-[20px]">
                  <img src="/images/qr-code.png" alt="QR Code" className="size-[130px] object-contain" />
                </div>
              ) : (
                <div className="flex items-center gap-[10px] rounded-[12px] bg-[#f2efe8] px-[14px] py-[12px]">
                  <div className="flex min-w-0 flex-1 py-[9px]">
                    <p className="truncate text-[12.5px] tracking-[0.08px] text-[#14110d]">
                      {INVITE_LINK}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyLink(setCopied)}
                    className="shrink-0 rounded-[8px] bg-[#14110d] px-[12px] py-[7px] text-[12px] font-medium text-[#f7f5f0] transition-opacity active:opacity-70"
                  >
                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                  </button>
                </div>
              )}
            </div>

            {/* 4 share buttons — Link · LINE · Messenger · QR */}
            <div className="flex gap-[8px]">
              {BUTTONS.map(({ label, circleBg, icon, iconSize, padding, onClick, active, activeLabel }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex min-w-0 flex-1 flex-col items-center gap-[6px] overflow-hidden rounded-[12px] bg-[#f2efe8] py-[10px] transition-opacity active:opacity-70"
                >
                  <div
                    className={`flex shrink-0 items-center justify-center rounded-[18px] size-[36px] ${padding}`}
                    style={{ backgroundColor: circleBg }}
                  >
                    <img src={icon} alt="" className={`shrink-0 ${iconSize}`} />
                  </div>
                  <p className={`whitespace-nowrap text-[10.5px] font-light tracking-[0.21px] transition-colors ${active && activeLabel ? "text-[#e85a2c]" : "text-[#767168]"}`}>
                    {active && activeLabel ? activeLabel : label}
                  </p>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Manage trip */}
        <button
          type="button"
          onClick={() => router.push("/trips/demo")}
          className="flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#14110d] text-[14px] font-medium tracking-[0.14px] text-[#f7f5f0] transition-opacity active:opacity-80"
        >
          จัดการทริป
        </button>

      </div>
    </main>
  );
}
