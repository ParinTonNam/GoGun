"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { googleLogin, register } from "@/lib/api";
import GoogleSignInButton from "@/components/google-signin-button";
import { AuthScreen, AuthField, AuthPassword, AuthButton, AuthDivider, AuthMessage } from "@/components/auth-v2";

function RegisterForm() {
  const router = useRouter();
  const returnTo = useSearchParams().get("returnTo");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) { setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirmPassword) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    setLoading(true);
    setError("");
    try {
      await register(username.trim(), email.trim(), password);
      router.push(returnTo ?? "/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle(credential: string) {
    setLoading(true);
    setError("");
    try {
      await googleLogin(credential);
      router.push(returnTo ?? "/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      setLoading(false);
    }
  }

  return <AuthScreen kind="register">
    <section className="maew-auth-content" aria-labelledby="register-title">
      <h1 id="register-title">มาลงทะเบียนกัน</h1>
      <form className="maew-auth-form" onSubmit={submit}>
        <div className="maew-auth-fields">
          <AuthField id="username" label="ชื่อ user" icon="user" placeholder="กรอกชื่อได้เลย" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" />
          <AuthField id="email" label="อีเมล" icon="email" placeholder="XXXX@gmail.com" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" />
          <AuthPassword id="password" label="พาสเวิร์ด" value={password} onChange={event => setPassword(event.target.value)} visible={showPassword} onToggle={() => setShowPassword(value => !value)} autoComplete="new-password" />
          <AuthPassword id="confirm-password" label="คอนเฟิร์ม พาสเวิร์ด" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} visible={showConfirm} onToggle={() => setShowConfirm(value => !value)} autoComplete="new-password" />
        </div>
        <AuthMessage error={error} />
        <AuthButton loading={loading}>ลงทะเบียน</AuthButton>
      </form>
      <AuthDivider />
      <GoogleSignInButton variant="auth" label="ล็อกอินด้วย Google" onCredential={signInWithGoogle} />
      <p className="maew-auth-footer"><span>คุณมีแอคเคาท์แล้วหรือเปล่า ?</span><Link href="/login">ล็อกอินเลย</Link></p>
    </section>
  </AuthScreen>;
}

export default function SignInPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
