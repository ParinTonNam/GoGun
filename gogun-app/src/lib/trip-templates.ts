import type { TripTypeCode } from "./api";

export type TemplateActivity = { time: string; title: string };
export type TemplateDay = { label: string; activities: TemplateActivity[] };

export type TripTemplate = {
  id: string;
  name: string;
  destination: string;
  emoji: string;
  meta: string;
  trip_type: TripTypeCode;
  duration_days: number;
  currency: string;
  tags: string[];
  days: TemplateDay[];
};

export const TEMPLATE_FILTERS = [
  "ทั้งหมด",
  "มาแรงช่วงนี้",
  "1 เดย์ทริป",
  "ทริปใหญ่ก๊วนเพื่อน",
  "ทริปต่างประเทศ",
] as const;

export type TemplateFilter = (typeof TEMPLATE_FILTERS)[number];

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: "bangsaen",
    name: "One Day Trip บางแสน",
    destination: "บางแสน ชลบุรี",
    emoji: "🏖️",
    meta: "1 วัน · ชลบุรี · ทะเลใกล้กรุงเทพฯ",
    trip_type: "one_day",
    duration_days: 1,
    currency: "THB",
    tags: ["มาแรงช่วงนี้", "1 เดย์ทริป"],
    days: [
      {
        label: "เที่ยวบางแสน",
        activities: [
          { time: "07:00", title: "ออกเดินทางจากกรุงเทพฯ" },
          { time: "09:00", title: "ถึงบางแสน — คาเฟ่ริมทะเล" },
          { time: "10:30", title: "เดินเล่นชายหาดบางแสน" },
          { time: "12:00", title: "มื้อเที่ยงอาหารทะเล ตลาดหนองมน" },
          { time: "14:00", title: "จุดชมวิวเขาสามมุก" },
          { time: "15:30", title: "สถาบันวิทยาศาสตร์ทางทะเล ม.บูรพา" },
          { time: "17:00", title: "ชมพระอาทิตย์ตกริมหาด" },
          { time: "18:30", title: "เดินทางกลับกรุงเทพฯ" },
        ],
      },
    ],
  },
  {
    id: "ayutthaya",
    name: "ไหว้พระเมืองเก่าอยุธยา",
    destination: "อยุธยา",
    emoji: "🛕",
    meta: "1 วัน · อยุธยา · ประวัติศาสตร์",
    trip_type: "one_day",
    duration_days: 1,
    currency: "THB",
    tags: ["1 เดย์ทริป"],
    days: [
      {
        label: "รอบเกาะเมืองอยุธยา",
        activities: [
          { time: "07:30", title: "ออกเดินทางจากกรุงเทพฯ" },
          { time: "09:00", title: "วัดมหาธาตุ — เศียรพระในรากไม้" },
          { time: "10:30", title: "วัดพระศรีสรรเพชญ์" },
          { time: "12:00", title: "ก๋วยเตี๋ยวเรือ + โรตีสายไหม" },
          { time: "14:00", title: "วัดไชยวัฒนาราม" },
          { time: "16:00", title: "ล่องเรือรอบเกาะเมือง" },
          { time: "18:00", title: "เดินทางกลับกรุงเทพฯ" },
        ],
      },
    ],
  },
  {
    id: "samet",
    name: "เกาะเสม็ด 2 วัน 1 คืน",
    destination: "เกาะเสม็ด ระยอง",
    emoji: "⛵",
    meta: "2 วัน 1 คืน · ระยอง · ทะเลตะวันออก",
    trip_type: "overnight",
    duration_days: 2,
    currency: "THB",
    tags: ["มาแรงช่วงนี้", "ทริปใหญ่ก๊วนเพื่อน"],
    days: [
      {
        label: "เดินทาง · หาดทรายแก้ว",
        activities: [
          { time: "08:00", title: "ออกเดินทางจากกรุงเทพฯ" },
          { time: "11:00", title: "ลงเรือที่ท่าบ้านเพ" },
          { time: "12:00", title: "เช็คอินที่พัก หาดทรายแก้ว" },
          { time: "15:00", title: "เล่นน้ำ อ่าวไผ่" },
          { time: "19:00", title: "ดินเนอร์ซีฟู้ดริมหาด" },
        ],
      },
      {
        label: "ขับรถรอบเกาะ · กลับ",
        activities: [
          { time: "09:00", title: "เช่ามอเตอร์ไซค์เที่ยวรอบเกาะ" },
          { time: "11:00", title: "จุดชมวิวอ่าวปะการัง" },
          { time: "13:00", title: "เก็บของ เช็คเอาท์" },
          { time: "14:30", title: "เรือกลับบ้านเพ" },
          { time: "18:00", title: "ถึงกรุงเทพฯ" },
        ],
      },
    ],
  },
  {
    id: "khaoyai",
    name: "แคมป์ปิ้งเขาใหญ่",
    destination: "เขาใหญ่ นครราชสีมา",
    emoji: "🏕️",
    meta: "2 วัน 1 คืน · เขาใหญ่ · ธรรมชาติ",
    trip_type: "overnight",
    duration_days: 2,
    currency: "THB",
    tags: ["ทริปใหญ่ก๊วนเพื่อน"],
    days: [
      {
        label: "เข้าอุทยาน · กางเต็นท์",
        activities: [
          { time: "07:00", title: "ออกเดินทางจากกรุงเทพฯ" },
          { time: "10:00", title: "น้ำตกเหวนรก" },
          { time: "13:00", title: "จุดชมวิว กม.30" },
          { time: "16:00", title: "กางเต็นท์ ลานผากล้วยไม้" },
          { time: "18:30", title: "ปิ้งย่างรอบกองไฟ" },
        ],
      },
      {
        label: "ส่องสัตว์ · คาเฟ่ · กลับ",
        activities: [
          { time: "06:00", title: "ส่องสัตว์ยามเช้า" },
          { time: "09:00", title: "เก็บเต็นท์ ออกจากอุทยาน" },
          { time: "11:00", title: "คาเฟ่วิวเขาใหญ่" },
          { time: "14:00", title: "แวะไร่องุ่น ซื้อของฝาก" },
          { time: "17:00", title: "เดินทางกลับกรุงเทพฯ" },
        ],
      },
    ],
  },
  {
    id: "chiangmai",
    name: "เชียงใหม่ 3 วัน 2 คืน",
    destination: "เชียงใหม่",
    emoji: "⛰️",
    meta: "3 วัน 2 คืน · เชียงใหม่ · คาเฟ่และดอย",
    trip_type: "long",
    duration_days: 3,
    currency: "THB",
    tags: ["มาแรงช่วงนี้", "ทริปใหญ่ก๊วนเพื่อน"],
    days: [
      {
        label: "ตัวเมือง · นิมมาน",
        activities: [
          { time: "09:00", title: "ถึงเชียงใหม่ เก็บกระเป๋าที่ที่พัก" },
          { time: "11:00", title: "วัดพระสิงห์ วัดเจดีย์หลวง" },
          { time: "14:00", title: "คาเฟ่ย่านนิมมาน" },
          { time: "18:00", title: "ถนนคนเดิน / กาดหน้ามอ" },
        ],
      },
      {
        label: "ดอยสุเทพ · แม่ริม",
        activities: [
          { time: "08:00", title: "ขึ้นดอยสุเทพ" },
          { time: "11:00", title: "หมู่บ้านม้งดอยปุย" },
          { time: "14:00", title: "คาเฟ่แม่ริม" },
          { time: "18:00", title: "มื้อเย็นข้าวซอยเจ๊กพ่อ" },
        ],
      },
      {
        label: "ซื้อของฝาก · กลับ",
        activities: [
          { time: "09:00", title: "One Nimman ซื้อของฝาก" },
          { time: "12:00", title: "มื้อเที่ยงก่อนกลับ" },
          { time: "15:00", title: "เดินทางกลับกรุงเทพฯ" },
        ],
      },
    ],
  },
  {
    id: "tokyo-kyoto",
    name: "ญี่ปุ่น โตเกียว–เกียวโต",
    destination: "โตเกียว–เกียวโต ญี่ปุ่น",
    emoji: "🗼",
    meta: "5 วัน 4 คืน · ญี่ปุ่น · ซากุระและวัด",
    trip_type: "long",
    duration_days: 5,
    currency: "JPY",
    tags: ["ทริปต่างประเทศ"],
    days: [
      {
        label: "ลงเครื่อง · Tokyo",
        activities: [
          { time: "06:30", title: "Bangkok → Narita" },
          { time: "16:00", title: "Check-in โรงแรม Shinjuku" },
          { time: "19:00", title: "เดินเล่น Shinjuku, Omoide Yokocho" },
        ],
      },
      {
        label: "Tokyo · เก่า → ใหม่",
        activities: [
          { time: "09:00", title: "Asakusa, Senso-ji" },
          { time: "13:00", title: "TeamLab Planets" },
          { time: "19:00", title: "Akihabara — ดู gachapon" },
        ],
      },
      {
        label: "Tokyo → Kyoto",
        activities: [
          { time: "08:30", title: "Shinkansen สาย Nozomi" },
          { time: "12:30", title: "Check-in machiya · Gion" },
          { time: "17:00", title: "เดินเล่น Pontocho" },
        ],
      },
      {
        label: "Kyoto · วัด, ป่าไผ่",
        activities: [
          { time: "07:00", title: "Fushimi Inari (ก่อนคนเยอะ)" },
          { time: "11:30", title: "Arashiyama, ป่าไผ่" },
          { time: "18:00", title: "Kaiseki dinner" },
        ],
      },
      {
        label: "บินกลับ",
        activities: [
          { time: "10:30", title: "Kyoto → Kansai Airport" },
          { time: "15:20", title: "Osaka → Bangkok" },
        ],
      },
    ],
  },
];

export function getTemplate(id: string): TripTemplate | undefined {
  return TRIP_TEMPLATES.find((t) => t.id === id);
}
