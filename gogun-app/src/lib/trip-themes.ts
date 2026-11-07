export const TRIP_THEMES = [
  { id: "lake", label: "ทะเลสาบ", image: "/images/trip-themes/lake.png" },
  { id: "autumn", label: "ใบไม้เปลี่ยนสี", image: "/images/trip-themes/autumn.png" },
  { id: "sakura", label: "ซากุระ", image: "/images/trip-themes/sakura.png" },
  { id: "beach", label: "ทะเล", image: "/images/trip-themes/beach.png" },
  { id: "sunset", label: "พระอาทิตย์ตก", image: "/images/trip-themes/sunset.png" },
  { id: "windmill", label: "ทุ่งกังหัน", image: "/images/trip-themes/windmill.png" },
] as const;

export type TripThemeId = (typeof TRIP_THEMES)[number]["id"];

export function getTripCoverImage(theme: string | null | undefined): string {
  return TRIP_THEMES.find((item) => item.id === theme)?.image ?? "/images/figma-hero-banner.png";
}

export const TRIP_ICONS = [
  { emoji: "✈️", label: "เครื่องบิน", image: "/images/trip-themes/icon-plane.svg" },
  { emoji: "🧳", label: "กระเป๋าเดินทาง", image: "/images/trip-themes/icon-luggage.svg" },
  { emoji: "🎒", label: "เป้เดินทาง", image: "/images/trip-themes/icon-bag.svg" },
  { emoji: "🎟️", label: "ตั๋ว", image: "/images/trip-themes/icon-ticket.svg" },
  { emoji: "⛽", label: "การเดินทาง", image: "/images/trip-themes/icon-fuel.svg" },
  { emoji: "🎉", label: "ปาร์ตี้", image: "/images/trip-themes/icon-party.svg" },
  { emoji: "🍹", label: "เครื่องดื่ม", image: "/images/trip-themes/icon-drink.svg" },
  { emoji: "🐟", label: "ปลา", image: "/images/trip-themes/icon-fish.svg" },
  { emoji: "🐈", label: "แมว", image: "/images/trip-themes/icon-cat.svg" },
] as const;
