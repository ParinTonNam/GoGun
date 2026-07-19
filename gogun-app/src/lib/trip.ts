export type Destination = {
  code: string;
  flag: string;
  name: string;
  cities: string;
};

export const DESTINATIONS: Destination[] = [
  { code: "TH", flag: "TH", name: "ในประเทศ", cities: "Bangkok · Chiang Mai" },
  { code: "JP", flag: "JP", name: "ญี่ปุ่น", cities: "Tokyo · Kyoto · Osaka" },
  { code: "KR", flag: "KR", name: "เกาหลีใต้", cities: "Seoul · Busan" },
  { code: "TW", flag: "TW", name: "ไต้หวัน", cities: "Taipei · Taichung" },
  { code: "CN", flag: "CN", name: "จีน", cities: "Beijing · Shanghai" },
  { code: "CUSTOM", flag: "✎", name: "กำหนดเอง", cities: "" },
];

export type TripTypeCode = "one_day" | "overnight" | "long";

export type TripType = {
  code: TripTypeCode;
  label: string;
  defaultDays: number;
};

export const TRIP_TYPES: TripType[] = [
  { code: "one_day", label: "เที่ยววันเดียว (One Day Trip)", defaultDays: 1 },
  { code: "overnight", label: "เที่ยวค้างคืน 2-3 วัน", defaultDays: 3 },
  { code: "long", label: "ทริปยาว (Weekend Trip)", defaultDays: 5 },
];

export type Currency = {
  code: string;
  symbol: string;
};

export const CURRENCIES: Currency[] = [
  { code: "JPY", symbol: "¥" },
  { code: "THB", symbol: "฿" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "KRW", symbol: "₩" },
  { code: "TWD", symbol: "NT$" },
];

export const MEMBER_COLORS = [
  "#4f6e7a",
  "#7b8b57",
  "#8a6e9e",
  "#c0613e",
  "#3d7068",
  "#a8763e",
];

export const ORGANIZER_COLOR = "#c0613e";

export type Member = {
  id: string;
  name: string;
  color: string;
  isOrganizer: boolean;
};

export type Permissions = {
  addExpenses: boolean;
  editItinerary: boolean;
  inviteOthers: boolean;
};

export type TripFormData = {
  name: string;
  tripType: TripTypeCode | null;
  destinationCodes: string[];
  customDestination: string;
  startDate: Date | null;
  endDate: Date | null;
  members: Member[];
  currency: string;
  budgetPerPerson: string;
  permissions: Permissions;
};

export function createInitialTripFormData(): TripFormData {
  return {
    name: "",
    tripType: null,
    destinationCodes: [],
    customDestination: "",
    startDate: null,
    endDate: null,
    members: [
      { id: "organizer", name: "ต้นน้ำ (คุณ)", color: ORGANIZER_COLOR, isOrganizer: true },
    ],
    currency: "JPY",
    budgetPerPerson: "",
    permissions: {
      addExpenses: true,
      editItinerary: true,
      inviteOthers: false,
    },
  };
}

const THAI_MONTHS_ABBREV = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export function formatThaiShortDate(date: Date): string {
  return `${date.getDate()} ${THAI_MONTHS_ABBREV[date.getMonth()]}`;
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
