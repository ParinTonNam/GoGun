import Link from "next/link";
import { AuthScreen } from "@/components/auth-v2";

export default function CheckEmail() {
  return <AuthScreen kind="check">
    <section className="maew-auth-content" aria-labelledby="check-email-title">
      <img className="maew-auth-cat" src="/images/auth-v2/email-cat.svg" alt="แมวถือจดหมาย" width="250" height="234" />
      <h1 id="check-email-title">เช็คอีเมลด้วยนะ</h1>
      <p className="maew-auth-description">เราส่งอีเมลเปลี่ยนรหัสไปให้แล้วนะ</p>
      <Link className="maew-auth-primary" href="/login">ล็อกอิน</Link>
    </section>
  </AuthScreen>;
}
