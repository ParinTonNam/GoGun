"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// GIS ต้อง initialize() แค่ครั้งเดียวต่อ session (เรียกซ้ำแล้ว Google เตือนว่า
// "only the last initialized instance will be used" ทำให้ปุ่มที่ render ไปก่อน
// หน้านั้นหลุดการเชื่อมกับ callback) — ใช้ module-level flag กันเรียกซ้ำเวลา
// component นี้ mount ใหม่ทุกครั้งที่เปลี่ยนหน้า (login/signin/link-account/หน้าแรก)
let gisInitialized = false;
// callback ต้อง route ไปหน้าที่ mount อยู่ปัจจุบันเสมอ ไม่ใช่หน้าแรกที่เคย
// initialize ไว้ — เก็บเป็น module-level เพราะ initialize() ผูก callback ครั้งเดียว
let currentCredentialHandler: ((credential: string) => void) | null = null;

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

function GoogleGLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// ปุ่ม "Sign in with Google" (Google Identity Services) — ได้ credential แล้ว
// ส่งต่อให้ parent จัดการเรียก API เอง ถ้าไม่ได้ตั้ง NEXT_PUBLIC_GOOGLE_CLIENT_ID
// จะไม่แสดงปุ่มเลย
//
// variant "official" = ปุ่มหน้าตามาตรฐานของ Google, "styled" = ปุ่มสไตล์เดียวกับ
// ปุ่มอื่นในแอป โดยซ่อนปุ่มจริงของ GIS แบบโปร่งใสทับไว้เต็มพื้นที่ให้รับคลิกแทน
// (GIS ไม่มี API ให้ยิง sign-in flow จากปุ่ม custom ตรง ๆ)
export default function GoogleSignInButton({
  onCredential,
  variant = "official",
  label = "เข้าสู่ระบบด้วย Google",
}: {
  onCredential: (credential: string) => void;
  variant?: "official" | "styled";
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const retryRef = useRef<number | null>(null);

  // หน้าไหน mount component นี้อยู่ ให้ credential ที่ได้กลับไปหาหน้านั้นเสมอ
  useEffect(() => {
    currentCredentialHandler = onCredential;
  }, [onCredential]);

  // render ปุ่ม GIS ลง container — retry จนกว่า (1) script พร้อม และ (2) container
  // มีความกว้างจริง เพราะปุ่มโปร่งใสของ GIS ต้องเต็มพื้นที่ปุ่มที่เห็น ไม่งั้นจะกด
  // โดนบ้างไม่โดนบ้าง; เคลียร์ container ก่อน render กัน iframe ซ้อนตอน mount ใหม่
  const render = useCallback(() => {
    // function declaration (hoisted) เพื่อ self-reference retry ได้โดยไม่ชน TDZ
    function attempt(n: number) {
      const el = containerRef.current;
      if (!el || !CLIENT_ID) return;
      const google = window.google;
      if (!google || el.clientWidth === 0) {
        if (n < 25) retryRef.current = window.setTimeout(() => attempt(n + 1), 120);
        return;
      }
      if (!gisInitialized) {
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => currentCredentialHandler?.(response.credential),
        });
        gisInitialized = true;
      }
      el.innerHTML = "";
      google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        locale: "th",
        width: Math.min(el.clientWidth, 400),
      });
    }
    attempt(0);
  }, []);

  // เรียกทุกครั้งที่ mount — ครอบเคสที่ GIS script โหลดไว้ก่อนแล้ว (สลับหน้า
  // login/signin/link-account) ซึ่ง onReady ของ <Script> จะไม่ยิงซ้ำให้
  useEffect(() => {
    render();
    return () => {
      if (retryRef.current !== null) window.clearTimeout(retryRef.current);
    };
  }, [render]);

  if (!CLIENT_ID) return null;

  const script = (
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => render()} />
  );

  if (variant === "styled") {
    return (
      <div className="relative w-full cursor-pointer">
        <div className="flex w-full items-center justify-center gap-[10px] rounded-[18px] border border-[#e5e1d7] bg-white py-[15px]">
          <GoogleGLogo />
          <span className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">{label}</span>
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-[18px] opacity-0">
          <div ref={containerRef} className="flex size-full scale-y-[1.3] items-center justify-center" />
        </div>
        {script}
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="mb-[24px] flex min-h-[44px] w-full justify-center" />
      {script}
    </>
  );
}
