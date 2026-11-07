"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { googleLogin, login } from "@/lib/api";
import GoogleSignInButton from "@/components/google-signin-button";
import { AuthScreen, AuthField, AuthPassword, AuthButton, AuthDivider, AuthMessage } from "@/components/auth-v2";
import { PASSWORD_RESET_READY } from "@/lib/feature-flags";

function LoginForm() {
  const router = useRouter();
  const returnTo = useSearchParams().get("returnTo");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password);
      router.push(returnTo ?? "/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
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

  return <AuthScreen kind="login">
    <section className="maew-auth-content" aria-labelledby="login-title">
      <h1 id="login-title">มาล็อกอินกันเถอะ</h1>
      <form className="maew-auth-form" onSubmit={submit}>
        <div className="maew-auth-fields">
          <AuthField id="username" label="ชื่อ user" icon="user" placeholder="กรอกชื่อได้เลย" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" />
          <div>
            <AuthPassword id="password" label="พาสเวิร์ด" value={password} onChange={event => setPassword(event.target.value)} visible={visible} onToggle={() => setVisible(value => !value)} autoComplete="current-password" />
            {PASSWORD_RESET_READY && <div className="maew-auth-forgot"><Link href="/forgot-password">ลืมรหัสผ่านหรือเปล่า <u>กดตรงนี้</u></Link></div>}
          </div>
        </div>
        <AuthMessage error={error} />
        <AuthButton loading={loading}>ล็อกอิน</AuthButton>
      </form>
      <AuthDivider />
      <GoogleSignInButton variant="auth" label="ล็อกอินด้วย Google" onCredential={signInWithGoogle} />
      <p className="maew-auth-footer"><span>ถ้ายังไม่มีแอทเค้าท์ ?</span><Link href="/signin">ลงทะเบียนเลย</Link></p>
    </section>
  </AuthScreen>;
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
