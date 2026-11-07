"use client";
import Link from "next/link";
import { useState } from "react";
import type { ChangeEventHandler, MouseEventHandler, ReactNode } from "react";

export function AuthBrandHeader({ brandName = "Maew Tiew" }: { brandName?: string }) {
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  return <header className="auth-brand-header">
    <Link href="/" className="auth-brand" aria-label={`${brandName} home`}>
      <img src="/images/figma-gogun-mark.svg" alt="" width="31" height="30" />
      <div className="maew-home-brand-copy">
        <span className="maew-home-brand-title">{brandName}</span>
        <span className="maew-home-brand-sub">Happy Cats, Easy Trips</span>
      </div>
    </Link>
    <div className="auth-language-wrap">
      <button className="auth-language" type="button" aria-haspopup="menu" aria-expanded={languageMenuOpen} onClick={() => setLanguageMenuOpen(open => !open)}>TH<span className={`auth-chevron${languageMenuOpen ? " is-open" : ""}`} /></button>
      {languageMenuOpen && <div className="auth-language-menu" role="menu"><button type="button" role="menuitem" onClick={() => setLanguageMenuOpen(false)} aria-current="true">ไทย <span>TH</span></button><button type="button" role="menuitem" onClick={() => setLanguageMenuOpen(false)}>English <span>EN</span></button></div>}
    </div>
  </header>;
}
export function AuthSegmentBrandHeader({ brandName = "Maew Tiew" }: { brandName?: string }) {
  const [language, setLanguage] = useState<"en" | "th">("th");
  return <header className="auth-brand-header">
    <Link href="/" className="auth-brand" aria-label={`${brandName} home`}>
      <img src="/images/figma-gogun-mark.svg" alt="" width="31" height="30" />
      <div className="maew-home-brand-copy">
        <span className="maew-home-brand-title">{brandName}</span>
        <span className="maew-home-brand-sub">Happy Cats, Easy Trips</span>
      </div>
    </Link>
    <div className="auth-language-segmented" role="group" aria-label="Language">
      <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
      <button type="button" aria-pressed={language === "th"} onClick={() => setLanguage("th")}>TH</button>
    </div>
  </header>;
}
export function AuthFrame({ children, kind }: { children: ReactNode; kind: string }) { return <main className={`auth-scene auth-scene--${kind}`}><AuthBrandHeader brandName="Maew Tiew" />{children}</main>; }
export function AuthField({ id, label, icon, placeholder, value, onChange, type = "text", autoComplete }: { id: string; label: string; icon: string; placeholder: string; value: string; onChange: ChangeEventHandler<HTMLInputElement>; type?: string; autoComplete?: string }) { return <div className="auth-field"><label htmlFor={id}>{label}</label><div className="auth-input-wrap"><img src={icon} alt="" width="15" height="15" /><input id={id} name={id} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required /></div></div>; }
export function AuthPassword({ id, label, value, onChange, visible, onToggle, autoComplete }: { id: string; label: string; value: string; onChange: ChangeEventHandler<HTMLInputElement>; visible: boolean; onToggle: () => void; autoComplete: string }) { return <div className="auth-field"><label htmlFor={id}>{label}</label><div className="auth-input-wrap"><img src="/images/icon-lock.svg" alt="" width="15" height="15" /><input id={id} name={id} type={visible ? "text" : "password"} value={value} onChange={onChange} placeholder="***********" autoComplete={autoComplete} required /><button type="button" className="auth-password-toggle" onClick={onToggle} aria-label={visible ? "Hide password" : "Show password"}><img src="/images/icon-eye-off.svg" alt="" width="17" height="17" /></button></div></div>; }
export function AuthSubmit({ children, loading = false }: { children: ReactNode; loading?: boolean }) { return <button className="auth-submit" type="submit" disabled={loading}>{loading ? "กำลังดำเนินการ…" : children}</button>; }
export function AuthDivider() { return <div className="auth-divider"><span /><span className="auth-divider-label">หรือ</span><span /></div>; }
export function AuthSocialButtons({ onGoogle, onFacebook }: { onGoogle: MouseEventHandler<HTMLButtonElement>; onFacebook: MouseEventHandler<HTMLButtonElement> }) { return <div className="auth-social-buttons"><button className="auth-social-button" type="button" onClick={onFacebook} aria-label="Facebook login"><img src="/images/icon-facebook.svg" alt="" width="27" height="27" /></button><button className="auth-social-button" type="button" onClick={onGoogle} aria-label="Google login"><img src="/images/icon-google.svg" alt="" width="27" height="27" /></button></div>; }
export function AuthMessage({ error }: { error: string }) { return error ? <p className="auth-message" role="alert">{error}</p> : null; }
