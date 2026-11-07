"use client";

import { useEffect, useState, type ReactNode } from "react";

const DESKTOP_QUERY = "(min-width: 900px)";

function DesktopGate() {
  return (
    <main className="desktop-gate" aria-label="ใช้งานเหมียวเที่ยวบนมือถือ">
      <div className="desktop-gate-stage">
        <section className="desktop-gate-card">
          <div className="desktop-gate-brand">
            <img src="/images/desktop-gate/logo.svg" alt="" width="81" height="78" />
            <div className="desktop-gate-brand-copy">
              <strong>Maew Tiew</strong>
              <span>Happy Cats, Easy Trips</span>
            </div>
          </div>
          <div className="desktop-gate-message">
            <h1>เหมียวยังไม่พร้อมเที่ยวบนจอใหญ่ 🐾</h1>
            <p>ตอนนี้ลองใช้ผ่านมือถือไปก่อนนะเหมียว</p>
          </div>
          <img className="desktop-gate-qr" src="/images/desktop-gate/qr.svg" alt="สแกน QR เพื่อเปิดเว็บเหมียวเที่ยวบนมือถือ" width="296" height="296" />
          <p className="desktop-gate-caption">สแกนเพื่อไปเที่ยวกันเลย 🐾</p>
        </section>
        <img className="desktop-gate-cat" src="/images/desktop-gate/cat.svg" alt="" aria-hidden="true" width="234" height="246" />
      </div>
    </main>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <>
      <div className="app-frame-mobile">{desktop ? null : children}</div>
      <DesktopGate />
    </>
  );
}
