"use client";

import Link from "next/link";
import type { ChangeEventHandler, ReactNode } from "react";

const asset = "/images/auth-v2/";
type Screen = "home" | "register" | "login" | "reset" | "check";

export function AuthScreen({ kind, children }: { kind: Screen; children: ReactNode }) {
  return (
    <main className={`maew-auth maew-auth--${kind}`}>
      <div className="maew-auth-background" aria-hidden="true" />
      <header className="maew-auth-header">
        <Link href="/" className="maew-auth-brand" aria-label="Maew Tiew หน้าแรก">
          <img src={`${asset}${kind === "home" ? "home-figma/logo" : "logo"}.svg`} alt="" width="31" height="30" />
          <span className="maew-auth-brand-copy"><strong>Maew Tiew</strong><small>Happy Cats, Easy Trips</small></span>
        </Link>
        <LanguageSwitch />
      </header>
      {children}
    </main>
  );
}

function LanguageSwitch() {
  return <div className="maew-auth-language" role="group" aria-label="Language">
    <button type="button" disabled aria-label="English ยังไม่เปิดใช้งาน">EN</button>
    <button type="button" aria-pressed="true">TH</button>
  </div>;
}

export function AuthField({ id, label, icon, placeholder, value, onChange, type = "text", autoComplete }: {
  id: string; label: string; icon: "user" | "email"; placeholder: string; value: string;
  onChange: ChangeEventHandler<HTMLInputElement>; type?: string; autoComplete?: string;
}) {
  return <div className="maew-auth-field">
    <label htmlFor={id}>{label}</label>
    <div className="maew-auth-input"><img src={`${asset}${icon}.svg`} alt="" width="15" height="15" />
      <input id={id} name={id} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required />
    </div>
  </div>;
}

export function AuthPassword({ id, label, value, onChange, visible, onToggle, autoComplete }: {
  id: string; label: string; value: string; onChange: ChangeEventHandler<HTMLInputElement>;
  visible: boolean; onToggle: () => void; autoComplete: string;
}) {
  return <div className="maew-auth-field">
    <label htmlFor={id}>{label}</label>
    <div className="maew-auth-input"><img src={`${asset}lock.svg`} alt="" width="15" height="15" />
      <input id={id} name={id} type={visible ? "text" : "password"} value={value} onChange={onChange} placeholder="***********" autoComplete={autoComplete} required />
      <button className="maew-auth-eye" type="button" onClick={onToggle} aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
        <img src={`${asset}eye-off.svg`} alt="" width="15" height="15" />
      </button>
    </div>
  </div>;
}

export function AuthButton({ children, loading = false }: { children: ReactNode; loading?: boolean }) {
  return <button className="maew-auth-primary" type="submit" disabled={loading}>{loading ? "กำลังดำเนินการ..." : children}</button>;
}

export function AuthDivider() {
  return <div className="maew-auth-divider" aria-hidden="true"><img src={`${asset}divider.svg`} alt="" width="98" height="1" /><span>หรือ</span><img src={`${asset}divider.svg`} alt="" width="98" height="1" /></div>;
}

export function AuthMessage({ error }: { error: string }) {
  return error ? <p className="maew-auth-message" role="alert">{error}</p> : null;
}
