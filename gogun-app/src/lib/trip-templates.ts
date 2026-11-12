import type { TripTypeCode } from "./api";

export type TemplateActivity = {
  time: string;
  title: string;
  description?: string;
};

export type TemplateDay = {
  label: string;
  activities: TemplateActivity[];
};

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
  "เที่ยววันเดียว",
  "ทริปใหญ่ก๊วนเพื่อน",
  "ทริปต่างประเทศ",
] as const;

export type TemplateFilter = (typeof TEMPLATE_FILTERS)[number];

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: "tokyo-kyoto",
    name: "ทริปญี่ปุ่นชมใบไม้แดง",
    destination: "ญี่ปุ่น",
    emoji: "🍁",
    meta: "ญี่ปุ่น 5 คน",
    trip_type: "long",
    duration_days: 3,
    currency: "JPY",
    tags: ["มาแรงช่วงนี้", "ทริปใหญ่ก๊วนเพื่อน", "ทริปต่างประเทศ"],
    days: [
      {
        label: "เดินทาง · โอซาก้า",
        activities: [
          {
            time: "08:00",
            title: "ออกเดินทางไปญี่ปุ่น",
            description: "ขึ้นเครื่องบิน เตรียมเริ่มทริปโอซาก้า",
          },
          {
            time: "13:00",
            title: "ถึงสนามบินคันไซ",
            description: "ผ่าน ตม. รับกระเป๋า แล้วเข้าเมืองโอซาก้า",
          },
          {
            time: "15:00",
            title: "เช็กอินโรงแรม",
            description: "ฝากกระเป๋าและพักผ่อนก่อนออกเที่ยว",
          },
          {
            time: "17:00",
            title: "กินมื้อเย็นที่โดทงโบริ",
            description: "ลองทาโกยากิและโอโคโนมิยากิ",
          },
          {
            time: "20:00",
            title: "เดินเล่นย่านนัมบะ",
            description: "ช้อปปิ้งและถ่ายรูปป้ายกูลิโกะ",
          },
          {
            time: "22:00",
            title: "กลับโรงแรมพักผ่อน",
            description: "เตรียมพร้อมสำหรับเที่ยววันถัดไป",
          },
        ],
      },
      {
        label: "เกียวโต · ชมใบไม้แดง",
        activities: [
          {
            time: "08:30",
            title: "เดินทางไปเกียวโต",
            description: "นั่งรถไฟจากโอซาก้าไปอาราชิยามะ",
          },
          {
            time: "10:00",
            title: "สะพานโทเก็ตสึเคียว & ป่าไผ่",
            description: "ชมใบไม้เปลี่ยนสีริมแม่น้ำและเดินป่าไผ่",
          },
          {
            time: "13:00",
            title: "มื้อเที่ยงย่านกิออน",
            description: "เซ็ตอาหารญี่ปุ่นแบบดั้งเดิม",
          },
          {
            time: "15:30",
            title: "วัดคิโยมิซุเดระ (วัดน้ำใส)",
            description: "จุดชมวิวใบไม้แดงยอดฮิตของเกียวโต",
          },
          {
            time: "19:00",
            title: "กลับโอซาก้า · มื้อเย็นอุเมดะ",
            description: "แวะกินปิ้งย่างยากินิกุก่อนเข้าที่พัก",
          },
        ],
      },
      {
        label: "ช้อปปิ้ง · เดินทางกลับ",
        activities: [
          {
            time: "09:30",
            title: "ตลาดคุโรมง",
            description: "หาของกินตอนเช้า ซูชิและผลไม้สด",
          },
          {
            time: "12:00",
            title: "ริงคุ พรีเมียม เอาท์เล็ท",
            description: "แวะช้อปของฝากใกล้สนามบินคันไซ",
          },
          {
            time: "16:30",
            title: "เช็กอินสนามบินคันไซ",
            description: "โหลดกระเป๋าและเตรียมตัวเดินทางกลับ",
          },
        ],
      },
    ],
  },
  {
    id: "korea-sakura",
    name: "ทริปเกาหลีชมซากุระ",
    destination: "เกาหลีใต้",
    emoji: "🌸",
    meta: "เกาหลีใต้ 5 คน",
    trip_type: "long",
    duration_days: 2,
    currency: "KRW",
    tags: ["มาแรงช่วงนี้", "ทริปต่างประเทศ"],
    days: [
      {
        label: "โซล · ยออีโด · ฮงแด",
        activities: [
          {
            time: "08:30",
            title: "ถึงสนามบินอินชอน",
            description: "นั่งรถไฟด่วนเข้าเมืองโซลและฝากกระเป๋า",
          },
          {
            time: "11:00",
            title: "สวนยออีโด ชมซากุระ",
            description: "เดินเล่นถ่ายรูปอุโมงค์ดอกพ็อตโกตริมแม่น้ำฮัน",
          },
          {
            time: "14:00",
            title: "คาเฟ่ย่านยอนนัมดง",
            description: "แวะจิบกาแฟและขนมเค้กสไตล์เกาหลี",
          },
          {
            time: "18:00",
            title: "เดินเล่นและกินหมูย่างฮงแด",
            description: "ช้อปปิ้งเสื้อผ้าและชมสตรีทโชว์ยามค่ำ",
          },
        ],
      },
      {
        label: "พระราชวังเคียงบก · เมียงดง",
        activities: [
          {
            time: "09:30",
            title: "เช่าชุดฮันบก เที่ยวพระราชวังเคียงบก",
            description: "ถ่ายรูปท่ามกลางต้นซากุระในพระราชวัง",
          },
          {
            time: "13:00",
            title: "หมู่บ้านบุกชอนฮันอก",
            description: "เดินชมบ้านโบราณและจุดชมวิวโซล",
          },
          {
            time: "17:00",
            title: "ช้อปปิ้งสกินแคร์ย่านเมียงดง",
            description: "ตะลุยสตรีทฟู้ดและซื้อของฝากก่อนกลับ",
          },
        ],
      },
    ],
  },
  {
    id: "phuket-sea",
    name: "ทริปทะเลภูเก็ต",
    destination: "ไทย",
    emoji: "🏖️",
    meta: "ไทย 5 คน",
    trip_type: "overnight",
    duration_days: 2,
    currency: "THB",
    tags: ["มาแรงช่วงนี้", "ทริปใหญ่ก๊วนเพื่อน"],
    days: [
      {
        label: "เมืองเก่าภูเก็ต · แหลมพรหมเทพ",
        activities: [
          {
            time: "09:00",
            title: "ถึงสนามบินภูเก็ต รับรถเช่า",
            description: "มุ่งหน้าเข้าตัวเมืองภูเก็ต",
          },
          {
            time: "11:00",
            title: "ติ่มซำมื้อสาย & ย่านเมืองเก่า",
            description: "เดินถ่ายรูปตึกชิโนโปรตุกีส ถนนถลาง",
          },
          {
            time: "15:00",
            title: "เช็กอินที่พักริมหาดกะตะ",
            description: "พักผ่อนและเดินเล่นชายหาด",
          },
          {
            time: "17:30",
            title: "ชมพระอาทิตย์ตกแหลมพรหมเทพ",
            description: "จุดชมวิวทะเลอันดามันยามเย็น",
          },
          {
            time: "19:30",
            title: "ดินเนอร์ซีฟู้ดสดๆ",
            description: "กุ้งมังกรและอาหารใต้รสจัดจ้าน",
          },
        ],
      },
      {
        label: "ล่องเรือเกาะเฮ · เดินทางกลับ",
        activities: [
          {
            time: "09:00",
            title: "ลงเรือสปีดโบ๊ทไปเกาะเฮ",
            description: "ดำน้ำตื้นดูปะการังและพักผ่อนริมหาดน้ำใส",
          },
          {
            time: "14:00",
            title: "กลับเข้าฝั่ง แวะซื้อของฝาก",
            description: "น้ำพริกกุ้งเสียบและเต้าส้อเมืองภูเก็ต",
          },
          {
            time: "17:00",
            title: "เดินทางถึงสนามบินภูเก็ต",
            description: "คืนรถเช่าและเตรียมบินกลับ",
          },
        ],
      },
    ],
  },
  {
    id: "switzerland-hike",
    name: "ทริปสวิตเซอร์แลนด์เดินเขา",
    destination: "สวิตเซอร์แลนด์",
    emoji: "🏔️",
    meta: "สวิตเซอร์แลนด์ 5 คน",
    trip_type: "long",
    duration_days: 2,
    currency: "EUR",
    tags: ["ทริปใหญ่ก๊วนเพื่อน", "ทริปต่างประเทศ"],
    days: [
      {
        label: "อินเทอร์ลาเคน · เลาเทอร์บรุนเนิน",
        activities: [
          {
            time: "08:00",
            title: "นั่งรถไฟสายวิวสวยสู่อินเทอร์ลาเคน",
            description: "ชมวิวทะเลสาบสีเทอร์ควอยซ์สองฝั่ง",
          },
          {
            time: "10:30",
            title: "หมู่บ้านเลาเทอร์บรุนเนิน",
            description: "เดินชมหุบเขาน้ำตก 72 แห่งและบ้านไม้สไตล์สวิส",
          },
          {
            time: "14:00",
            title: "ขึ้นกระเช้าสู่กรินเดลวัลด์ เฟิร์ส",
            description: "เดินเส้นทางทะเลสาบบาคาลป์เซและถ่ายรูปวิวเทือกเขาแอลป์",
          },
          {
            time: "18:30",
            title: "มื้อเย็นฟองดูว์ชีสสวิส",
            description: "พักผ่อนในชาเลต์กลางหุบเขา",
          },
        ],
      },
      {
        label: "เซอร์แมท · แมทเทอร์ฮอร์น",
        activities: [
          {
            time: "08:30",
            title: "รถไฟขึ้นจุดชมวิวกอร์เนอร์กรัท",
            description: "ชมยอดเขาแมทเทอร์ฮอร์นแบบพาโนรามา",
          },
          {
            time: "12:00",
            title: "เดินเส้นทางทะเลสาบริฟเฟลเซ",
            description: "ถ่ายภาพเงาสะท้อนยอดเขาแมทเทอร์ฮอร์นบนผิวน้ำ",
          },
          {
            time: "16:00",
            title: "เดินเล่นหมู่บ้านปลอดรถยนต์เซอร์แมท",
            description: "แวะซื้อช็อกโกแลตสวิสและของที่ระลึก",
          },
        ],
      },
    ],
  },
  {
    id: "taiwan-foodie",
    name: "ทริปไต้หวันตะลุยกิน",
    destination: "ไต้หวัน",
    emoji: "🧋",
    meta: "ไต้หวัน 5 คน",
    trip_type: "long",
    duration_days: 2,
    currency: "THB",
    tags: ["มาแรงช่วงนี้", "ทริปใหญ่ก๊วนเพื่อน", "ทริปต่างประเทศ"],
    days: [
      {
        label: "ไทเป · ซีเหมินติง · ตลาดกลางคืน",
        activities: [
          {
            time: "09:00",
            title: "ถึงสนามบินเถาหยวน เข้าเมืองไทเป",
            description: "นั่งรถไฟด่วนเข้าสถานีไทเปเมน",
          },
          {
            time: "11:30",
            title: "บะหมี่อาจง & ชานมไข่มุกต้นตำรับ",
            description: "ฝากกระเป๋าและเริ่มต้นตะลุยกินย่านซีเหมินติง",
          },
          {
            time: "15:00",
            title: "อนุสรณ์สถานเจียงไคเชก",
            description: "ชมพิธีเปลี่ยนเวรยามและแวะคาเฟ่โรงน้ำชา",
          },
          {
            time: "18:30",
            title: "ตลาดกลางคืนเหราเหอ",
            description: "ซาลาเปาอบโอ่งพริกไทยดำ ปลาหมึกย่าง และเต้าหู้เหม็น",
          },
        ],
      },
      {
        label: "จิ่วเฟิ่น · สือเฟิ่น",
        activities: [
          {
            time: "09:30",
            title: "ปล่อยโคมลอยที่สือเฟิ่น",
            description: "เขียนคำอธิษฐานและปล่อยโคมริมทางรถไฟสายเก่า",
          },
          {
            time: "14:00",
            title: "หมู่บ้านโบราณจิ่วเฟิ่น",
            description: "กินบัวลอยเผือกหนึบและจิบชาชมวิวทะเลและภูเขา",
          },
          {
            time: "19:00",
            title: "ชาบูหมาล่าไต้หวัน",
            description: "บุฟเฟต์เนื้อพรีเมียมและไอศกรีมปิดท้ายทริป",
          },
        ],
      },
    ],
  },
  {
    id: "singapore-city",
    name: "ทริปสิงคโปร์เที่ยวเมือง",
    destination: "สิงคโปร์",
    emoji: "🦁",
    meta: "สิงคโปร์ 5 คน",
    trip_type: "one_day",
    duration_days: 1,
    currency: "SGD",
    tags: ["เที่ยววันเดียว", "ทริปต่างประเทศ"],
    days: [
      {
        label: "มารีน่าเบย์ · การ์เด้นส์ บาย เดอะ เบย์",
        activities: [
          {
            time: "09:00",
            title: "ถึงสนามบินชางงีและน้ำตกจูเวล",
            description: "ถ่ายรูปน้ำตกในร่มเรนวอร์เท็กซ์",
          },
          {
            time: "11:30",
            title: "ข้าวมันไก่เทียนเทียนที่ศูนย์อาหารแมกซ์เวลล์",
            description: "มื้อเที่ยงสตรีทฟู้ดชื่อดังย่านไชน่าทาวน์",
          },
          {
            time: "14:30",
            title: "เมอร์ไลออน พาร์ค & มารีน่าเบย์",
            description: "จุดเช็กอินแลนด์มาร์กริมอ่าวมารีน่า",
          },
          {
            time: "17:00",
            title: "สวนการ์เด้นส์ บาย เดอะ เบย์",
            description: "เดินชมสวนคลาวด์ฟอเรสต์และกลุ่มต้นไม้ยักษ์",
          },
          {
            time: "19:45",
            title: "ชมการแสดงแสงสีเสียงการ์เด้นแรปโซดี",
            description: "ชมการแสดงไฟใต้ต้นไม้ยักษ์ยามค่ำคืน",
          },
        ],
      },
    ],
  },
];

const LEGACY_TEMPLATES: TripTemplate[] = [
  {
    id: "bangsaen",
    name: "เที่ยวบางแสนวันเดียว",
    destination: "บางแสน ชลบุรี",
    emoji: "🏖️",
    meta: "ชลบุรี 5 คน",
    trip_type: "one_day",
    duration_days: 1,
    currency: "THB",
    tags: ["มาแรงช่วงนี้", "เที่ยววันเดียว"],
    days: [
      {
        label: "เที่ยวบางแสน",
        activities: [
          { time: "07:00", title: "ออกเดินทางจากกรุงเทพฯ", description: "นัดรวมตัวและออกเดินทาง" },
          { time: "09:00", title: "ถึงบางแสน — คาเฟ่ริมทะเล", description: "แวะจิบกาแฟรับลมทะเล" },
          { time: "12:00", title: "มื้อเที่ยงอาหารทะเล ตลาดหนองมน", description: "ซีฟู้ดสดและของฝากหนองมน" },
          { time: "17:00", title: "ชมพระอาทิตย์ตกริมหาด", description: "เดินเล่นชายหาดบางแสนยามเย็น" },
        ],
      },
    ],
  },
  {
    id: "ayutthaya",
    name: "ไหว้พระเมืองเก่าอยุธยา",
    destination: "อยุธยา",
    emoji: "🛕",
    meta: "อยุธยา 5 คน",
    trip_type: "one_day",
    duration_days: 1,
    currency: "THB",
    tags: ["เที่ยววันเดียว"],
    days: [
      {
        label: "รอบเกาะเมืองอยุธยา",
        activities: [
          { time: "07:30", title: "ออกเดินทางจากกรุงเทพฯ", description: "มุ่งหน้าสู่จังหวัดพระนครศรีอยุธยา" },
          { time: "09:00", title: "วัดมหาธาตุ", description: "ชมเศียรพระพุทธรูปในรากไม้" },
          { time: "12:00", title: "ก๋วยเตี๋ยวเรือ + โรตีสายไหม", description: "แวะพักมื้อเที่ยงริมน้ำ" },
          { time: "16:00", title: "วัดไชยวัฒนาราม", description: "ถ่ายรูปโบราณสถานยามเย็นก่อนกลับ" },
        ],
      },
    ],
  },
];

export function getTemplate(id: string): TripTemplate | undefined {
  return (
    TRIP_TEMPLATES.find((t) => t.id === id) ||
    LEGACY_TEMPLATES.find((t) => t.id === id)
  );
}
