"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, saveToken } from "@/lib/api";

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="3" stroke="#b5b0a4" strokeWidth="1.3" />
      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#b5b0a4" strokeWidth="1.3" strokeLinecap="round" />
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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError("กรุณากรอก username และ password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { token } = await login(username.trim(), password);
      saveToken(token);
      router.push(returnTo ?? "/trips");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-[28px]">
      <div className="flex w-full max-w-[360px] flex-col items-center">

        {/* Logo */}
        <div className="flex items-center gap-[10px] pb-[10px]">
          <img src="/images/logo.svg" alt="" className="size-[40px]" />
          <span className="text-[28px] font-medium tracking-[-0.5px] text-[#14110d]">GoGun</span>
        </div>

        {/* Tagline */}
        <p className="pb-[36px] text-[13px] font-light tracking-[0.08px] text-[#767168]">
          วางแผนทริปกับเพื่อน ง่ายขึ้น
        </p>

        {/* Form */}
        <div className="flex w-full flex-col gap-[12px]">

          {/* Username */}
          <div className="flex h-[52px] w-full items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] focus-within:border-[#14110d]">
            <IconUser />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="flex-1 bg-transparent text-[14px] tracking-[0.08px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
            />
          </div>

          {/* Password */}
          <div className="flex h-[52px] w-full items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[16px] focus-within:border-[#14110d]">
            <IconLock />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
        </div>

        {/* Error */}
        {error && (
          <p className="mt-[8px] w-full text-[12px] text-red-500">{error}</p>
        )}

        {/* Login button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="mt-[20px] flex h-[52px] w-full items-center justify-center rounded-[18px] bg-[#e85a2c] text-[15px] font-medium tracking-[0.08px] text-white transition-opacity active:opacity-80 disabled:opacity-60"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        {/* Divider */}
        <div className="flex w-full items-center gap-[12px] py-[28px]">
          <div className="h-px flex-1 bg-[#e5e1d7]" />
          <span className="text-[12px] font-light tracking-[0.5px] text-[#b5b0a4]">หรือ</span>
          <div className="h-px flex-1 bg-[#e5e1d7]" />
        </div>

        {/* Register link */}
        <div className="flex items-center gap-[5px] text-[13px]">
          <span className="font-light tracking-[0.08px] text-[#767168]">ยังไม่มีบัญชี?</span>
          <Link
            href="/signin"
            className="font-medium tracking-[0.08px] text-[#e85a2c] underline-offset-2 hover:underline"
          >
            สมัครสมาชิก
          </Link>
        </div>

      </div>
    </main>
  );
}
