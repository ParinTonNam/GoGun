"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTripByInvite,
  claimMember,
  joinTripByInvite,
  getMe,
  saveToken,
  clearToken,
  getInitial,
  ApiError,
  type Trip,
  type User,
} from "@/lib/api";

type PageState = "loading" | "ready" | "joining" | "error";

export default function InvitePage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [claimError, setClaimError] = useState("");

  function load() {
    const token = typeof window !== "undefined" ? localStorage.getItem("gogun_token") : null;
    setIsLoggedIn(!!token);

    const tripPromise = getTripByInvite(inviteCode);
    // Only a 401 means the token is genuinely stale — clear it and show the
    // login CTA. Any other failure must not silently render the wrong CTA,
    // so let it propagate to the error state instead.
    const mePromise = token
      ? getMe().catch((e) => {
          if (e instanceof ApiError && e.status === 401) {
            clearToken();
            setIsLoggedIn(false);
            return null;
          }
          throw e;
        })
      : Promise.resolve(null);

    return Promise.all([tripPromise, mePromise]).then(([t, user]) => {
      setTrip(t);
      setMe(user);
      setPageState("ready");
    });
  }

  useEffect(() => {
    load().catch(() => setPageState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  const alreadyMember = !!(
    me &&
    trip?.members.some((m) => m.user_id === me.id && m.status === "joined")
  );

  // Guest names stay selectable by anyone with the link until their owner
  // links an email, which locks the name to that account.
  const claimableMembers = trip?.members.filter((m) => m.user.is_guest) ?? [];
  const joinedMembers = trip?.members.filter((m) => m.status === "joined") ?? [];

  async function handleClaim(memberId: string) {
    setClaimError("");
    setPageState("joining");
    try {
      const result = await claimMember(inviteCode, memberId);
      saveToken(result.token);
      const dest =
        result.member.role === "organizer"
          ? `/trips/${result.trip_id}`
          : `/trips/${result.trip_id}/member`;
      router.push(dest);
    } catch (e) {
      setClaimError(
        e instanceof Error ? e.message : "ชื่อนี้ถูกใช้ไปแล้ว ลองใหม่อีกครั้ง",
      );
      setPageState("ready");
      load().catch(() => {});
    }
  }

  function handleSwitchPerson() {
    clearToken();
    setMe(null);
    setIsLoggedIn(false);
  }

  async function handleLoginJoin() {
    if (!isLoggedIn) {
      router.push(`/login?returnTo=/t/${inviteCode}`);
      return;
    }
    setPageState("joining");
    try {
      const result = await joinTripByInvite(inviteCode);
      router.push(`/trips/${result.trip_id}/member`);
    } catch {
      setPageState("ready");
    }
  }

  /* ── Loading ── */
  if (pageState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <div className="flex flex-col items-center gap-[12px]">
          <div className="size-[32px] animate-spin rounded-full border-[2px] border-[#e5e1d7] border-t-[#e85a2c]" />
          <p className="text-[13px] font-light text-[#767168]">กำลังโหลดทริป...</p>
        </div>
      </main>
    );
  }

  /* ── Error / Not found ── */
  if (pageState === "error" || !trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-[28px]">
        <div className="flex max-w-[320px] flex-col items-center gap-[16px] text-center">
          <div className="flex size-[56px] items-center justify-center rounded-full bg-[#f2efe8] text-[28px]">
            🔗
          </div>
          <div className="flex flex-col gap-[6px]">
            <p className="text-[16px] font-medium text-[#14110d]">ลิงก์ไม่ถูกต้อง</p>
            <p className="text-[13px] font-light leading-[1.6] text-[#767168]">
              ลิงก์นี้อาจหมดอายุหรือถูกลบไปแล้ว ขอลิงก์ใหม่จากผู้จัดทริป
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/trips")}
            className="mt-[4px] rounded-[14px] bg-[#14110d] px-[28px] py-[12px] text-[14px] font-medium text-white"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </main>
    );
  }

  /* ── Ready ── */
  const memberCount = trip.members.filter((m) => m.status === "joined").length;

  const dateLabel = (() => {
    const iso =
      trip.date_status === "confirmed"
        ? trip.confirmed_start_date
        : trip.proposed_start_date;
    if (!iso) return "ยังไม่กำหนดวัน";
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  })();

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[430px] flex-col px-[24px] pb-[40px] pt-[72px]">

        {/* Eyebrow */}
        <p className="pb-[10px] text-[10.5px] uppercase tracking-[1.5px] text-[#767168]">
          คุณถูกเชิญเข้าทริป
        </p>

        {/* Trip name */}
        <h1 className="text-[34px] font-medium leading-[1.12] tracking-[-0.34px] text-[#14110d]">
          {trip.name}
        </h1>

        {/* Meta */}
        <div className="mt-[10px] flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
          <span className="text-[13px] font-light tracking-[0.08px] text-[#767168]">
            {trip.destination}
          </span>
          <span className="text-[#d4cfc2]">·</span>
          <span className="text-[13px] font-light tracking-[0.08px] text-[#767168]">
            {trip.duration_days} วัน
          </span>
          <span className="text-[#d4cfc2]">·</span>
          <span className="text-[13px] font-light tracking-[0.08px] text-[#767168]">
            {memberCount} คน
          </span>
        </div>

        {/* Date */}
        <p className="mt-[6px] text-[12px] font-light tracking-[0.08px] text-[#b5b0a4]">
          {trip.date_status === "confirmed"
            ? `ยืนยันวันแล้ว · ${dateLabel}`
            : `กำลังหาวัน · ${dateLabel}`}
        </p>

        {/* Organizer */}
        <div className="mt-[28px] flex items-center gap-[10px]">
          <div
            className="flex size-[36px] shrink-0 items-center justify-center rounded-full text-[15px] font-medium text-white"
            style={{ backgroundColor: trip.organizer.avatar_color }}
          >
            {trip.organizer.display_name.slice(0, 1)}
          </div>
          <div className="flex flex-col gap-px">
            <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
              {trip.organizer.display_name}
            </p>
            <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">ผู้จัดทริป</p>
          </div>
        </div>

        {/* Pick your name — primary way to join, no account needed */}
        {!alreadyMember && claimableMembers.length > 0 && (
          <div className="mt-[28px] flex flex-col gap-[4px]">
            <p className="text-[15px] tracking-[0.08px] text-[#14110d]">ใครคือคุณ?</p>
            <p className="pb-[16px] text-[12px] font-light tracking-[0.08px] text-[#767168]">
              กดชื่อเพื่อเริ่มใช้งาน · ไม่ต้องสมัครสมาชิก
            </p>
            <div className="grid grid-cols-2 gap-[8px]">
              {claimableMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleClaim(m.id)}
                  disabled={pageState === "joining"}
                  className="flex flex-col items-center gap-[10px] rounded-[18px] border border-[#e5e1d7] bg-white pb-[18px] pt-[19px] disabled:opacity-50"
                >
                  <div
                    className="flex size-[56px] items-center justify-center rounded-[28px] text-[20px] font-medium text-white"
                    style={{ backgroundColor: m.user.avatar_color }}
                  >
                    {getInitial(m.user.display_name)}
                  </div>
                  <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                    {m.user.display_name}
                  </p>
                </button>
              ))}
            </div>
            <p className="pt-[10px] text-[11px] font-light leading-[1.6] tracking-[0.08px] text-[#b5b0a4]">
              ชื่อเหล่านี้ยังไม่ล็อก ใครที่มีลิงก์ทริปก็เลือกได้
              หลังเข้าทริปแล้วสามารถเชื่อมอีเมลเพื่อล็อกชื่อของคุณ
            </p>
            {claimError && (
              <p className="pt-[10px] text-[12px] text-red-500">{claimError}</p>
            )}
          </div>
        )}

        {/* Members already in */}
        {joinedMembers.length > 0 && (
          <div className="mt-[20px] flex flex-col gap-[8px]">
            <p className="text-[11px] uppercase tracking-[1.2px] text-[#b5b0a4]">สมาชิก</p>
            <div className="flex flex-wrap gap-[8px]">
              {joinedMembers.slice(0, 8).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-[7px] rounded-full border border-[#e5e1d7] bg-white px-[10px] py-[5px]"
                >
                  <div
                    className="flex size-[20px] shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: m.user.avatar_color }}
                  >
                    {m.user.display_name.slice(0, 1)}
                  </div>
                  <span className="text-[12px] tracking-[0.08px] text-[#14110d]">
                    {m.user.display_name}
                  </span>
                  {m.user.is_guest === false && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-label="เชื่อมอีเมลแล้ว"
                    >
                      <rect x="3" y="7" width="10" height="7" rx="2" stroke="#b5b0a4" strokeWidth="1.6" />
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#b5b0a4" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              ))}
              {memberCount > 8 && (
                <div className="flex items-center rounded-full border border-[#e5e1d7] bg-white px-[10px] py-[5px]">
                  <span className="text-[12px] font-light text-[#767168]">+{memberCount - 8} คน</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 py-[32px]" />

        {/* CTA */}
        {alreadyMember && me ? (
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center justify-center gap-[8px] rounded-[14px] border border-[#e5e1d7] bg-white px-[14px] py-[10px]">
              <div
                className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
                style={{ backgroundColor: me.avatar_color }}
              >
                {getInitial(me.display_name)}
              </div>
              <p className="text-[13px] tracking-[0.08px] text-[#14110d]">
                กำลังใช้งานในชื่อ <span className="font-medium">{me.display_name}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  me.id === trip.organizer_id
                    ? `/trips/${trip.id}`
                    : `/trips/${trip.id}/member`,
                )
              }
              className="w-full rounded-[18px] bg-[#14110d] py-[16px] text-[15px] font-medium text-white"
            >
              ดูทริปนี้
            </button>
            {me.is_guest && (
              <button
                type="button"
                onClick={() => router.push(`/link-account?returnTo=/t/${inviteCode}`)}
                className="text-center text-[12px] font-light tracking-[0.08px] text-[#e85a2c] underline underline-offset-2"
              >
                ชื่อนี้ยังไม่ล็อก ใครมีลิงก์ก็เข้าได้ เชื่อมอีเมลเพื่อล็อกชื่อ
              </button>
            )}
            <button
              type="button"
              onClick={handleSwitchPerson}
              className="text-center text-[12px] font-light tracking-[0.08px] text-[#767168] underline underline-offset-2"
            >
              ไม่ใช่คุณ? เปลี่ยนคน
            </button>
          </div>
        ) : isLoggedIn ? (
          <button
            type="button"
            onClick={handleLoginJoin}
            disabled={pageState === "joining"}
            className="w-full rounded-[18px] bg-[#e85a2c] py-[16px] text-[15px] font-medium text-white disabled:opacity-60"
          >
            {pageState === "joining" ? "กำลังเข้าร่วม..." : "เข้าร่วมทริป"}
          </button>
        ) : claimableMembers.length > 0 ? (
          <div className="flex flex-col gap-[8px] text-center">
            <p className="text-[11px] font-light tracking-[0.44px] text-[#b5b0a4]">
              ไม่มีชื่อของคุณ? ติดต่อคนจัดทริปเพื่อเพิ่มชื่อ
            </p>
            <button
              type="button"
              onClick={handleLoginJoin}
              className="text-[12px] font-light tracking-[0.08px] text-[#767168] underline underline-offset-2"
            >
              มีบัญชี GoGun แล้ว? เข้าสู่ระบบ
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            <button
              type="button"
              onClick={handleLoginJoin}
              className="w-full rounded-[18px] bg-[#e85a2c] py-[16px] text-[15px] font-medium text-white"
            >
              เข้าสู่ระบบเพื่อเข้าร่วม
            </button>
            <button
              type="button"
              onClick={() => router.push(`/signin?returnTo=/t/${inviteCode}`)}
              className="w-full rounded-[18px] border border-[#e5e1d7] bg-white py-[16px] text-[15px] font-medium text-[#14110d]"
            >
              สมัครสมาชิก
            </button>
          </div>
        )}

        <p className="pt-[20px] text-center text-[10.5px] tracking-[0.42px] text-[#b5b0a4]">
          GoGun · ไปกัน
        </p>

      </div>
    </main>
  );
}
