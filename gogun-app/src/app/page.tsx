"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { googleLogin, saveToken } from "@/lib/api";
import GoogleSignInButton from "@/components/google-signin-button";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleCredential(credential: string) {
    setError("");
    setLoading(true);
    try {
      const { token } = await googleLogin(credential);
      saveToken(token);
      router.push("/trips");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f7f5f0] px-6 py-12">
      <img src="/images/logo.svg" alt="GoGun" className="h-[163px] w-[163px]" />
      <div className="flex items-center gap-6">
        <span className="text-[29.5px] font-medium tracking-[0.18px] text-[#14110d]">
          ไปกัน
        </span>
        <span className="text-[25px] font-normal tracking-[0.18px] text-[#767168]">
          GOGUN
        </span>
      </div>
      <div className="flex w-full max-w-[258px] flex-col items-center gap-[10px]">
        <Link
          href="/login"
          className="w-full rounded-[18px] border border-[#e5e1d7] bg-[#e85a2c] py-[15px] text-center text-[15px] font-medium tracking-[0.08px] text-white"
        >
          เข้าสู่ระบบ
        </Link>
        <Link
          href="/signin"
          className="w-full rounded-[18px] border border-[#e5e1d7] py-[15px] text-center text-[15px] font-medium tracking-[0.08px] text-[#14110d]"
        >
          สมัครสมาชิก
        </Link>

        {/* Divider */}
        <div className="flex w-full items-center gap-[12px] py-[6px]">
          <div className="h-px flex-1 bg-[#e5e1d7]" />
          <span className="text-[12px] font-light tracking-[0.5px] text-[#b5b0a4]">หรือ</span>
          <div className="h-px flex-1 bg-[#e5e1d7]" />
        </div>

        <GoogleSignInButton variant="styled" onCredential={handleGoogleCredential} />

        {loading && (
          <p className="text-[12px] font-light text-[#767168]">กำลังเข้าสู่ระบบ...</p>
        )}
        {error && <p className="text-center text-[12px] text-red-500">{error}</p>}
      </div>
    </main>
  );
}
