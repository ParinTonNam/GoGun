import { MemberBottomNav } from "@/components/member-bottom-nav";
import { PageHeader, DEMO_USER } from "@/components/page-header";

const MEMBERS = [
  { id: "ton",   name: "ต้นน้ำ", initial: "ตน", color: "#c0613e", role: "จัดทริป" },
  { id: "james", name: "เจมส์",  initial: "จ",  color: "#4f6e7a" },
  { id: "nai",   name: "นาย",    initial: "น",  color: "#7b8b57" },
  { id: "atif",  name: "อาตีฟ",  initial: "อ",  color: "#8a6e9e" },
];

const DAYS = [
  {
    num: "01",
    date: "12 Nov",
    titleParts: [
      { text: "ลงเครื่อง", bold: true },
      { text: "·", sep: true },
      { text: "Tokyo", bold: true },
    ],
    events: [
      { time: "06:30", desc: "Bangkok → Narita (TG676)" },
      { time: "16:00", desc: "Check-in โรงแรม Shinjuku" },
      { time: "19:00", desc: "เดินเล่น Shinjuku, Omoide Yokocho" },
    ],
  },
  {
    num: "02",
    date: "13 Nov",
    titleParts: [{ text: "Tokyo", bold: true }],
    events: [
      { time: "09:00", desc: "Asakusa, Senso-ji" },
      { time: "13:00", desc: "TeamLab Planets" },
      { time: "19:00", desc: "Akihabara — ดู gachapon" },
    ],
  },
  {
    num: "03",
    date: "14 Nov",
    titleParts: [
      { text: "Tokyo", bold: true },
      { text: "→", sep: true },
      { text: "Kyoto", bold: true },
    ],
    events: [
      { time: "08:30", desc: "Shinkansen สาย Nozomi" },
      { time: "12:30", desc: "Check-in machiya · Gion" },
      { time: "17:00", desc: "เดินเล่น Pontocho" },
    ],
  },
  {
    num: "04",
    date: "15 Nov",
    titleParts: [
      { text: "Kyoto", bold: true },
      { text: "·", sep: true },
      { text: "วัด, ป่าไผ่", bold: true },
    ],
    events: [
      { time: "07:00", desc: "Fushimi Inari (ก่อนคนเยอะ)" },
      { time: "11:30", desc: "Arashiyama, ป่าไผ่" },
      { time: "18:00", desc: "Kaiseki dinner — จองแล้ว" },
    ],
  },
  {
    num: "05",
    date: "16 Nov",
    titleParts: [{ text: "บินกลับ", bold: true }],
    events: [
      { time: "10:30", desc: "Kyoto → Kansai Airport" },
      { time: "15:20", desc: "Osaka → Bangkok (TG623)" },
    ],
  },
];

const NOTES = [
  { icon: "hotel",    title: "Shinjuku Granbell", subtitle: "12–14 Nov · ¥18,200/คืน" },
  { icon: "hotel",    title: "Machiya Gion",       subtitle: "14–16 Nov · ¥22,000/คืน" },
  { icon: "plane",    title: "TG676 · TG623",      subtitle: "BKK ↔ NRT · ¥36,800" },
  { icon: "location", title: "แผนที่ทุกหมุด",       subtitle: "23 พิน · Google Maps" },
];

const NOTE_ICONS: Record<string, string> = {
  hotel:    "/images/icon-hotel.svg",
  plane:    "/images/icon-plane.svg",
  location: "/images/icon-location.svg",
};


export default function MemberOverviewPage() {
  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] px-[24px] pb-[96px] pt-[24px]">

        {/* Header */}
        <PageHeader user={DEMO_USER} />

        {/* Trip info */}
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[10px] text-[13px] tracking-[0.08px]">
            <span className="text-[#767168]">5 วัน</span>
            <span className="text-[#b5b0a4]">·</span>
            <span className="text-[#767168]">Japan</span>
          </div>
          <p className="text-[26px] font-medium tracking-[0.08px] text-[#14110d]">
            ทริปญี่ปุ่นชมดาว
          </p>
          {/* Date card */}
          <div className="flex items-center gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[15px]">
            <div className="flex flex-1 flex-col gap-[5px]">
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">วันที่ (เสนอ)</p>
              <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">12-16 Nov 2026</p>
            </div>
            <div className="flex h-[24px] items-center justify-center rounded-[31px] bg-[#faefcb] px-[10px]">
              <p className="text-[12px] font-medium tracking-[0.08px] text-[#d9a21b]">ยังไม่ยืนยัน</p>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center justify-between text-[13px] tracking-[0.08px]">
            <p className="text-[#767168]">เพื่อนร่วมทริป</p>
            <p className="font-medium text-[#14110d]">4 คน</p>
          </div>
          <div className="flex flex-wrap gap-[2px]">
            {MEMBERS.map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-[8px] rounded-[18px] p-[10px]">
                <div
                  className="flex size-[50px] items-center justify-center rounded-[25px] text-[15px] font-medium text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.initial}
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">{m.name}</p>
                  {m.role && (
                    <p className="text-[10px] font-light uppercase tracking-[0.4px] text-[#767168]">
                      {m.role}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[13px] tracking-[0.08px] text-[#767168]">เพื่อนร่วมทริป</p>
          <div className="flex gap-[10px]">
            {[
              { label: "ระยะเวลา", value: "5",      unit: "วัน" },
              { label: "ที่พัก",    value: "2",      unit: "ที่" },
              { label: "งบประมาณ", value: "50,000", unit: "บาท/คน" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-1 flex-col gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[15px] py-[10px]"
              >
                <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">{s.label}</p>
                <p className="text-[17px] font-medium tracking-[0.08px] text-[#14110d]">{s.value}</p>
                <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">{s.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Itinerary */}
        <div className="flex flex-col gap-[20px]">
          <div className="flex items-center justify-between text-[13px] tracking-[0.08px]">
            <p className="text-[#767168]">เพื่อนร่วมทริป</p>
            <p className="font-medium text-[#14110d]">อ่านเท่านั้น</p>
          </div>

          <div className="flex flex-col gap-[10px]">
            {DAYS.map((day, di) => (
              <div key={day.num}>
                <div className="flex gap-[25px]">
                  {/* Day label column */}
                  <div className="flex w-[55px] shrink-0 flex-col">
                    <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">Day</p>
                    <p className="text-[32px] font-light leading-[1.2] text-[#14110d]">{day.num}</p>
                    <p className="text-[15px] tracking-[0.08px] text-[#767168]">{day.date}</p>
                  </div>

                  {/* Events column */}
                  <div className="flex flex-1 min-w-0 flex-col gap-[10px]">
                    {/* Day title */}
                    <div className="flex items-center gap-[5px]">
                      {day.titleParts.map((part, pi) =>
                        part.sep ? (
                          <span key={pi} className="text-[13px] text-[#b5b0a4]">{part.text}</span>
                        ) : (
                          <span key={pi} className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
                            {part.text}
                          </span>
                        )
                      )}
                    </div>

                    {/* Time + event rows */}
                    <div className="flex gap-[10px]">
                      <div className="flex w-[38px] shrink-0 flex-col gap-[5px]">
                        {day.events.map((ev) => (
                          <p key={ev.time} className="h-[18px] text-[12px] font-light text-[#767168]">
                            {ev.time}
                          </p>
                        ))}
                      </div>
                      <div className="flex flex-1 min-w-0 flex-col gap-[5px]">
                        {day.events.map((ev) => (
                          <p key={ev.time} className="h-[18px] truncate text-[12px] font-medium text-[#767168]">
                            {ev.desc}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider (not after last day) */}
                {di < DAYS.length - 1 && (
                  <div className="mt-[10px] h-px w-full bg-[#e5e1d7]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes & Links */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[13px] tracking-[0.08px] text-[#767168]">Notes &amp; Links</p>
          <div className="grid grid-cols-2 gap-[10px]">
            {NOTES.map((note) => (
              <div
                key={note.title}
                className="flex flex-col gap-[5px] rounded-[18px] border border-[#e5e1d7] bg-white px-[20px] py-[10px]"
              >
                <img src={NOTE_ICONS[note.icon]} alt="" className="size-[24px]" />
                <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">{note.title}</p>
                <p className="text-[10px] font-light tracking-[0.08px] text-[#767168]">{note.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MemberBottomNav active="trip" />
    </main>
  );
}
