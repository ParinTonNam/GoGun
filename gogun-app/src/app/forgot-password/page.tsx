"use client";

import { useState } from "react";
import { AuthScreen, AuthField, AuthButton, AuthMessage } from "@/components/auth-v2";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("ระบบยังไม่ได้ตั้งค่าบริการส่งอีเมล จึงยังส่งลิงก์รีเซ็ตรหัสผ่านไม่ได้");
  }

  return <AuthScreen kind="reset">
    <section className="maew-auth-content" aria-labelledby="reset-title">
      <h1 id="reset-title">รีเซตพาสเวิร์ดกันนะ</h1>
      <p className="maew-auth-description">กรอกอีเมลแล้วเราจะส่งอีเมลรีเซตรหัสไปให้นะ</p>
      <form className="maew-auth-form" onSubmit={submit}>
        <AuthField id="email" label="อีเมล" icon="user" placeholder="กรอกชื่อได้เลย" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" />
        <AuthMessage error={error} />
        <AuthButton>ส่งรหัสเปลี่ยนอีเมล</AuthButton>
      </form>
    </section>
  </AuthScreen>;
}
