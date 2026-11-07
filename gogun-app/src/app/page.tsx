import Link from "next/link";
import { AuthScreen } from "@/components/auth-v2";
import { DemoEntryLink } from "@/components/demo-entry-link";

export default function Home() {
  return <AuthScreen kind="home">
    <section className="maew-auth-home-copy">
      <h1>ได้เวลาไปเที่ยวแล้ว</h1>
      <p>เริ่มต้นโดยการสร้างทริป<br />แล้วเชิญเพื่อนเลยโลดดดดดดด</p>
      <div className="maew-auth-home-actions">
        <Link href="/login" className="maew-auth-home-login">ล็อกอิน</Link>
        <Link href="/signin" className="maew-auth-home-register">ลงทะเบียน</Link>
        <DemoEntryLink className="maew-auth-home-demo">หรืออยากดูตัวอย่างเว็ปไหม</DemoEntryLink>
      </div>
    </section>
    <img className="maew-auth-home-cat" src="/images/auth-v2/home-cat.svg" alt="" aria-hidden="true" />
  </AuthScreen>;
}
