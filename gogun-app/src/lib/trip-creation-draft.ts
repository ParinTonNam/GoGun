export const TRIP_DRAFT_KEY = "gogun:new-trip-draft";
// The API uses unrestricted TEXT fields; these are form usability limits.
export const TRIP_TEXT_MAX_LENGTH = 200;

export type TripCreationDraft = { name: string; destination: string; startDate: string; icon?: string; theme?: string };

export function localCalendarDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function readTripDraft(storage: Pick<Storage, "getItem">): TripCreationDraft | null {
  try {
    const draft: unknown = JSON.parse(storage.getItem(TRIP_DRAFT_KEY) ?? "null");
    if (!draft || typeof draft !== "object") return null;
    if (!("name" in draft) || typeof draft.name !== "string" ||
        !("destination" in draft) || typeof draft.destination !== "string" ||
        !("startDate" in draft) || typeof draft.startDate !== "string") return null;
    return {
      name: draft.name,
      destination: draft.destination,
      startDate: draft.startDate,
      ...(typeof (draft as TripCreationDraft).icon === "string" && { icon: (draft as TripCreationDraft).icon }),
      ...(typeof (draft as TripCreationDraft).theme === "string" && { theme: (draft as TripCreationDraft).theme }),
    };
  } catch {
    return null;
  }
}
