"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe, googleLinkAccount, getInitial, type User } from "@/lib/api";
import GoogleSignInButton from "@/components/google-signin-button";

function LinkAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/trips";

  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMe()
      .then((u) => setMe(u))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleGoogleCredential(credential: string) {
    setError("");
    setSaving(true);
    try {
      await googleLinkAccount(credential);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  /* Already a full account — nothing to link */
  if (!me.is_guest && !done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-[28px]">
        <div className="flex max-w-[320px] flex-col items-center gap-[16px] text-center">
          <div className="flex size-[56px] items-center justify-center rounded-full bg-[#eef3ec] text-[28px]">
            ✓
          </div>
          <p className="text-[16px] font-medium text-[#14110d]">
            บัญชีนี้เชื่อมอีเมลแล้ว
          </p>
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            className="mt-[4px] rounded-[14px] bg-[#14110d] px-[28px] py-[12px] text-[14px] font-medium text-white"
          >
            กลับ
          </button>
        </div>
      </main>
    );
  }

  /* Success */
  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-[28px]">
        <div className="flex max-w-[320px] flex-col items-center gap-[16px] text-center">
          <div className="flex size-[56px] items-center justify-center rounded-full bg-[#eef3ec]">
            <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
              <rect x="3.5" y="9" width="13" height="8" rx="2.5" stroke="#2e8b5c" strokeWidth="1.6" />
              <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" stroke="#2e8b5c" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="10" cy="13" r="1.2" fill="#2e8b5c" />
            </svg>
          </div>
          <div className="flex flex-col gap-[6px]">
            <p className="text-[16px] font-medium text-[#14110d]">
              ล็อกชื่อ &ldquo;{me.display_name}&rdquo; เรียบร้อย
            </p>
            <p className="text-[13px] font-light leading-[1.6] text-[#767168]">
              จากนี้เข้าใช้งานจากเครื่องไหนก็ได้ด้วยบัญชีที่เชื่อมไว้
              <br />
              และไม่มีใครเลือกใช้ชื่อนี้จากลิงก์เชิญได้อีก
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            className="mt-[4px] rounded-[14px] bg-[#14110d] px-[28px] py-[12px] text-[14px] font-medium text-white"
          >
            ไปกันต่อ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-[28px]">
      <div className="flex w-full max-w-[360px] flex-col items-center">

        {/* Who you are */}
        <div
          className="flex size-[56px] items-center justify-center rounded-full text-[20px] font-medium text-white"
          style={{ backgroundColor: me.avatar_color }}
        >
          {getInitial(me.display_name)}
        </div>
        <p className="pt-[12px] text-[20px] font-medium tracking-[-0.2px] text-[#14110d]">
          บันทึกทริปของคุณไว้
        </p>
        <p className="pb-[28px] pt-[6px] text-center text-[13px] font-light leading-[1.6] tracking-[0.08px] text-[#767168]">
          ตอนนี้ชื่อ <span className="font-medium text-[#14110d]">&ldquo;{me.display_name}&rdquo;</span> ยังไม่ล็อกอิน
          ใครที่มีลิงก์ทริปก็เข้าใช้ได้ เชื่อมอีเมลเพื่อล็อกชื่อนี้เป็นของคุณ
          และเข้าจากเครื่องไหนก็ได้
        </p>

        {/* Method buttons — same stack pattern as the landing page */}
        <button
          type="button"
          onClick={() => router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`)}
          className="flex h-[52px] w-full items-center justify-center rounded-[18px] bg-[#e85a2c] text-[15px] font-medium tracking-[0.08px] text-white transition-opacity active:opacity-80"
        >
          เชื่อมอีเมลและล็อกอิน
        </button>

        {/* Divider */}
        <div className="flex w-full items-center gap-[12px] py-[20px]">
          <div className="h-px flex-1 bg-[#e5e1d7]" />
          <span className="text-[12px] font-light tracking-[0.5px] text-[#b5b0a4]">หรือ</span>
          <div className="h-px flex-1 bg-[#e5e1d7]" />
        </div>

        <GoogleSignInButton
          variant="styled"
          label="เชื่อมด้วย Google"
          onCredential={handleGoogleCredential}
        />

        {saving && (
          <p className="pt-[12px] text-[12px] font-light text-[#767168]">กำลังเชื่อม...</p>
        )}
        {error && <p className="pt-[8px] w-full text-center text-[12px] text-red-500">{error}</p>}

        <button
          type="button"
          onClick={() => router.push(returnTo)}
          className="pt-[20px] text-[12px] font-light tracking-[0.08px] text-[#767168] underline underline-offset-2"
        >
          ไว้ทีหลัง
        </button>

      </div>
    </main>
  );
}

export default function LinkAccountPage() {
  return (
    <Suspense>
      <LinkAccountContent />
    </Suspense>
  );
}
