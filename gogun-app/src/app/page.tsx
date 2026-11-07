import Link from "next/link";
import { AuthScreen } from "@/components/auth-v2";
import { DemoEntryLink } from "@/components/demo-entry-link";

const illustration = "/images/auth-v2/home-figma/";

export default function Home() {
  return (
    <AuthScreen kind="home">
      <div className="maew-auth-home-illustration" aria-hidden="true">
        <img className="maew-auth-home-illustration-cat" src={`${illustration}cat.svg`} alt="" width="181" height="192" />
        <img className="maew-auth-home-orb maew-auth-home-orb--left" src={`${illustration}orb-left.svg`} alt="" width="38" height="38" />
        <img className="maew-auth-home-orb maew-auth-home-orb--right" src={`${illustration}orb-right.svg`} alt="" width="38" height="38" />
        <img className="maew-auth-home-orb maew-auth-home-orb--top" src={`${illustration}orb-top.svg`} alt="" width="19" height="19" />
      </div>

      <section className="maew-auth-home-copy">
        <h1>ได้เวลาไปเที่ยวแล้ว</h1>
        <p>เริ่มต้นโดยการสร้างทริป<br />แล้วเชิญเพื่อนเลยโลดดดดดดด</p>
        <div className="maew-auth-home-actions">
          <Link href="/login" className="maew-auth-home-login">ล็อกอิน</Link>
          <Link href="/signin" className="maew-auth-home-register">ลงทะเบียน</Link>
          <DemoEntryLink className="maew-auth-home-demo">หรืออยากดูตัวอย่างเว็บไหม</DemoEntryLink>
        </div>
      </section>
    </AuthScreen>
  );
}
