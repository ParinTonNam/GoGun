"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTripByInvite, claimMember, joinAsGuest, joinTripByInvite, getMe, ApiError, type Trip, type User } from "@/lib/api";
import { getCatAvatarUrl, formatThaiShortDateRange } from "@/components/trip-ticket-selector";
import { getTripCoverImage } from "@/lib/trip-themes";
import "./invite.css";

export default function InviteClient({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<"account" | "guest" | null>(null);
  const [guestId, setGuestId] = useState("");
  const [name, setName] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const returnTo = `/t/${encodeURIComponent(inviteCode)}`;
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [t, user] = await Promise.all([
          getTripByInvite(inviteCode),
          getMe({ redirectOnUnauthorized: false }).catch(e => {
            if (e instanceof ApiError && e.status === 401) return null;
            throw e;
          }),
        ]);
        if (!active) return;
        setTrip(t); setMe(user);
        if (user && !user.is_guest) setMode("account");
      } catch (e) {
        if (active) setLoadError(e instanceof Error ? e.message : "โหลดทริปไม่สำเร็จ");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [inviteCode, attempt]);

  const joined = trip?.members.filter(m => m.status === "joined") ?? [];
  const guests = joined.filter(m => m.user.is_guest);
  const selectedGuest = guests.find(m => m.id === guestId);
  const accountReady = !!me && !me.is_guest;
  const selectedName = mode === "account" ? me?.display_name : selectedGuest?.user.display_name ?? name.trim();

  async function confirmJoin() {
    if (submitting.current || !reviewing || !mode) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      if (mode === "account") {
        if (!accountReady) { router.push(loginHref); return; }
        const result = await joinTripByInvite(inviteCode);
        router.replace(`/trips/${result.trip_id}`);
      } else {
        const result = guestId ? await claimMember(inviteCode, guestId) : await joinAsGuest(inviteCode, name.trim());
        router.replace(`/trips/${result.trip_id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าร่วมไม่สำเร็จ กรุณาลองใหม่");
      submitting.current = false; setBusy(false);
    }
  }

  return <main className="maew-invite-page"><div className="maew-invite-content">
    <header className="maew-invite-brand"><Link href="/" aria-label="Maew Tiew หน้าแรก" className="maew-home-brand">
      <img src="/images/figma-gogun-mark.svg" alt="" width={31} height={30} />
      <span className="maew-home-brand-copy"><span className="maew-home-brand-title">Maew Tiew</span><span className="maew-home-brand-sub">Happy Cats, Easy Trips</span></span>
    </Link></header>

    {loading ? <section className="maew-invite-card" role="status">กำลังเปิดลิงก์เชิญ…</section>
      : !trip || loadError ? <section className="maew-invite-card maew-invite-error">
        <h1>เปิดลิงก์เชิญไม่สำเร็จ</h1><p role="alert">{loadError}</p>
        <button type="button" className="maew-invite-primary" onClick={() => { setLoadError(""); setLoading(true); setAttempt(a => a + 1); }}>ลองอีกครั้ง</button>
        <Link href="/trips">กลับหน้าทริปของฉัน</Link>
      </section> : <>
        <section className="maew-invite-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(63,31,87,.25), transparent 75%), url("${getTripCoverImage(trip.theme)}")` }}>
          <h1>คุณได้รับเชิญเข้าทริป<br /><span data-user-content>{trip.name}</span></h1>
          <div className="maew-invite-hero-meta"><span>{trip.proposed_start_date || trip.confirmed_start_date ? formatThaiShortDateRange(trip) : "ยังไม่กำหนดวัน"}</span><span className="maew-invite-status">{trip.date_status === "confirmed" ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}</span></div>
        </section>

        {reviewing ? <section className="maew-invite-card maew-invite-choice" aria-labelledby="join-review">
          <h2 id="join-review">ยืนยันเข้าร่วมทริป</h2>
          <p>ทริป <strong data-user-content>{trip.name}</strong></p>
          <p>ใช้ชื่อ <strong>{selectedName}</strong> · {mode === "guest" ? "Guest" : "บัญชีที่ล็อกอิน"}</p>
          <p className="maew-invite-hint">{mode === "guest" ? "ชื่อ Guest นี้ใครที่มีลิงก์ก็เลือกเข้าใช้ได้ ผูกบัญชีภายหลังเพื่อล็อกชื่อได้" : "ชื่อนี้เข้าใช้ได้ด้วยการล็อกอินบัญชีของคุณเท่านั้น"}</p>
          <p className="maew-invite-hint">ยืนยันแล้วเข้าทริปได้ทันที ไม่ต้องรอผู้จัดอนุมัติ</p>
          {error && <p className="maew-invite-form-error" role="alert">{error}</p>}
          <button type="button" className="maew-invite-primary" onClick={confirmJoin} disabled={busy}>{busy ? "กำลังเข้าทริป…" : "ยืนยันและเข้าทริป"}</button>
          <button type="button" className="maew-invite-back" disabled={busy} onClick={() => { setReviewing(false); setError(""); }}>ย้อนกลับ</button>
        </section> : <section className="maew-invite-card maew-invite-choice" aria-labelledby="join-choice-heading">
          <h2 id="join-choice-heading">ต้องการเข้าร่วมแบบไหน?</h2>
          <div className="maew-invite-options">
            <button type="button" className="maew-invite-option" aria-pressed={mode === "account"} onClick={() => setMode("account")}><strong>ล็อกอิน</strong><small>ใช้บัญชีของฉัน</small></button>
            <button type="button" className="maew-invite-option" aria-pressed={mode === "guest"} onClick={() => setMode("guest")}><strong>Guest</strong><small>ตั้งชื่อ ไม่ต้องสมัคร</small></button>
          </div>
          {mode === "account" && (accountReady ? <div className="maew-invite-mode-content">
            <p className="maew-invite-hint">เข้าร่วมในชื่อ <strong data-user-content>{me.display_name}</strong></p>
            <button type="button" className="maew-invite-primary" onClick={() => setReviewing(true)}>เข้าทริป</button>
            <Link className="maew-invite-account-link" href={loginHref}>ใช้บัญชีอื่น</Link>
          </div> : <div className="maew-invite-mode-content">
            <p className="maew-invite-hint">ล็อกอินก่อน แล้วกลับมายืนยันเข้าร่วมทริปนี้</p>
            <Link className="maew-invite-primary" href={loginHref}>เข้าสู่ระบบ</Link>
            <p className="maew-invite-signup">ถ้ายังไม่มีแอคเคาท์ ? <Link href={`/signin?returnTo=${encodeURIComponent(returnTo)}`}>ลงทะเบียนเลย</Link></p>
          </div>)}
          {mode === "guest" && <form className="maew-invite-mode-content maew-invite-guest-form" onSubmit={e => { e.preventDefault(); if (selectedGuest || name.trim()) setReviewing(true); }}>
            <p className="maew-invite-hint">ใครมีลิงก์ก็เข้าร่วมเป็น Guest ได้ เมื่อตั้งชื่อจะปรากฏในสมาชิกทริป</p>
            {guests.length > 0 && <label className="maew-invite-field"><span>Guest ใหม่ หรือชื่อเดิมของคุณ</span><select value={guestId} onChange={e => setGuestId(e.target.value)}><option value="">ตั้งชื่อ Guest ใหม่</option>{guests.map(m => <option key={m.id} value={m.id}>{m.user.display_name} · Guest</option>)}</select></label>}
            {!guestId && <label className="maew-invite-field"><span>ชื่อที่แสดงในทริป <small>({name.length}/50 ตัวอักษร)</small></span><input autoComplete="nickname" required maxLength={50} value={name} onChange={e => setName(e.target.value)} placeholder="ต้นน้ำ" /></label>}
            {me && !me.is_guest && <p className="maew-invite-hint">การเข้าด้วย Guest จะสลับจากบัญชี {me.display_name} ไปใช้ชื่อ Guest</p>}
            <button className="maew-invite-primary" disabled={!selectedGuest && !name.trim()}>เข้าทริป</button>
          </form>}
        </section>}

        {joined.length > 0 && <section className="maew-invite-card maew-invite-members" aria-labelledby="join-members-heading">
          <h2 id="join-members-heading">สมาชิกที่เข้าร่วมแล้ว</h2>
          <ul>{joined.map((m, i) => <li key={m.id}><img src={getCatAvatarUrl(m.user.display_name, i, m.user.avatar_color)} alt="" width={48} height={48} /><span data-user-content>{m.user.display_name}</span>{m.role === "organizer" && <small>HOST</small>}</li>)}</ul>
        </section>}
      </>}
  </div></main>;
}
