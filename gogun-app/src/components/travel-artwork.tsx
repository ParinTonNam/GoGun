import Link from "next/link";
/** Decorative, code-native travel postcards: no external images or requests. */
export function TravelArtwork({ variant = 0 }: { variant?: number }) {
  const palettes = [["#edbe9e", "#f3d379", "#537e68", "#204d42"], ["#c9ded6", "#f7c66d", "#669aa6", "#286177"], ["#d8cae9", "#ef9d77", "#9382b0", "#504a72"]];
  const c = palettes[variant % palettes.length];
  return <svg className="travel-artwork" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
    <rect width="400" height="240" rx="24" fill={c[0]} />
    <circle cx="302" cy="70" r="34" fill={c[1]} />
    <path d="M0 164C65 100 99 99 159 162C220 224 271 93 400 128V240H0Z" fill={c[2]} />
    <path d="M0 216C105 102 144 125 198 192C253 261 321 170 400 190V240H0Z" fill={c[3]} />
    <path d="M63 48C124 21 179 52 201 96C218 129 244 156 313 146" stroke="#fffaf0" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" />
    <path d="m311 139 20 6-19 10 3-9-4-7Z" fill="#fffaf0" />
    <rect x="61" y="129" width="65" height="84" rx="15" fill="#fffaf0" transform="rotate(-9 61 129)" />
    <path d="m80 126-1-9c-1-5 3-8 8-9l13-2c5-1 9 2 10 7l1 9" stroke="#fffaf0" strokeWidth="6" />
    <path d="m80 144 8 49m18-52 8 49" stroke={c[0]} strokeWidth="4" strokeLinecap="round" />
    <circle cx="91" cy="210" r="5" fill="#172b25" /><circle cx="126" cy="204" r="5" fill="#172b25" />
  </svg>;
}

export function AuthIntro() {
  return <aside className="auth-intro"><Link href="/" className="workspace-brand"><img src="/images/logo.svg" alt="" width={32} height={32} />GoGun · ไปกัน</Link><div><p className="eyebrow">พื้นที่เล็ก ๆ ของทริปใหญ่ ๆ</p><h1>ไปไหนก็ได้<br />แค่ได้ไปด้วยกัน<span className="orange-dot">.</span></h1><p>นัดวัน วางแผน และหารค่าใช้จ่าย<br />ให้เรื่องก่อนออกเดินทางง่ายขึ้น</p></div><TravelArtwork /><span className="auth-intro-footer">วางแผนด้วยกัน · ออกเดินทางด้วยกัน</span></aside>;
}
