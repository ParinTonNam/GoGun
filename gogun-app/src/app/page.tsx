import Link from "next/link";

export default function Home() {
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
          LOGIN
        </Link>
        <Link
          href="/signin"
          className="w-full rounded-[18px] border border-[#e5e1d7] py-[15px] text-center text-[15px] font-medium tracking-[0.08px] text-[#14110d]"
        >
          SIGNIN
        </Link>
      </div>
    </main>
  );
}
