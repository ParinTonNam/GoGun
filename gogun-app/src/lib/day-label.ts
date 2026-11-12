import type { Locale } from "@/lib/locale";

export function formatTripDayLabel(dayNumber: number, locale: Locale): string {
  return locale === "th" ? `วันที่ ${dayNumber}` : `Day ${dayNumber}`;
}
