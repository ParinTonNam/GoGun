"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe, linkAccount, getInitial, type User } from "@/lib/api";

function IconEmail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="9" rx="2" stroke="#b5b0a4" strokeWidth="1.3" />
      <path d="M2 6l6 4 6-4" stroke="#b5b0a4" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="#b5b0a4" strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#b5b0a4" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="10.5" r="1" fill="#b5b0a4" />
    </svg>
  );
}

function IconEye({ off }: { off?: boolean }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M1 9c1.3-3.1 4.7-5 8-5s6.7 1.9 8 5c-1.3 3.1-4.7 5-8 5S2.3 12.1 1 9Z" stroke="#b5b0a4" strokeWidth="1.3" />
      <circle cx="9" cy="9" r="2.5" stroke="#b5b0a4" strokeWidth="1.3" />
      <path d="M3 3l12 12" stroke="#b5b0a4" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M1 9c1.3-3.1 4.7-5 8-5s6.7 1.9 8 5c-1.3 3.1-4.7 5-8 5S2.3 12.1 1 9Z" stroke="#b5b0a4" strokeWidth="1.3" />
      <circle cx="9" cy="9" r="2.5" stroke="#b5b0a4" strokeWidth="1.3" />
    </svg>
  );
}

function LinkAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/trips";

  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMe()
      .then((u) => setMe(u))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLink() {
    if (!email.trim() || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await linkAccount(email.trim(), password);
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
              จากนี้เข้าใช้งานจากเครื่องไหนก็ได้ด้วยอีเมลและรหัสผ่าน
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

        {/* Form */}
        <div className="flex w-full flex-col gap-[12px]">
          <div className="flex h-[52px] w-full items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] focus-within:border-[#14110d]">
            <IconEmail />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
            />
          </div>

          <div className="flex h-[52px] w-full items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] focus-within:border-[#14110d]">
            <IconLock />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password (อย่างน้อย 8 ตัว)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="ml-auto shrink-0"
              aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              <IconEye off={!showPw} />
            </button>
          </div>

          <div className="flex h-[52px] w-full items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] focus-within:border-[#14110d]">
            <IconLock />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="ยืนยัน Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              className="flex-1 bg-transparent text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="ml-auto shrink-0"
              aria-label={showConfirm ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              <IconEye off={!showConfirm} />
            </button>
          </div>
        </div>

        {error && <p className="mt-[8px] w-full text-[12px] text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleLink}
          disabled={saving}
          className="mt-[20px] flex h-[52px] w-full items-center justify-center rounded-[18px] bg-[#e85a2c] text-[15px] font-medium tracking-[0.08px] text-white transition-opacity active:opacity-80 disabled:opacity-60"
        >
          {saving ? "กำลังเชื่อม..." : "เชื่อมอีเมลและล็อกอิน"}
        </button>

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
