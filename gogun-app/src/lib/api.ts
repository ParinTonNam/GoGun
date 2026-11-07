import { handleDemoRequest } from "@/lib/demo-trip-data"

// Same-origin requests also work when a phone opens the computer's LAN address.
const BASE = "/api/v1"

export type QuestProgress = { quest_id: string; user_id: string; completed: number[]; updated_at: string; user: Pick<User, "id" | "display_name" | "avatar_color"> }
export type Quest = { id: string; title: string; description: string; targets: string[]; closed: boolean; created_at: string; progress: QuestProgress[] }
export const getQuests = (tripId: string) => req<Quest[]>(`/trips/${tripId}/quests`)
export const createQuest = (tripId: string, body: { title: string; description: string; targets: string[] }) => req<Quest>(`/trips/${tripId}/quests`, { method: "POST", body: JSON.stringify(body) })
export const closeQuest = (tripId: string, id: string, closed: boolean) => req(`/trips/${tripId}/quests/${id}`, { method: "PATCH", body: JSON.stringify({ closed }) })
export const deleteQuest = (tripId: string, id: string) => req(`/trips/${tripId}/quests/${id}`, { method: "DELETE" })
export const setQuestProgress = (tripId: string, id: string, completed: number[]) => req<QuestProgress>(`/trips/${tripId}/quests/${id}/progress`, { method: "PUT", body: JSON.stringify({ completed }) })

export type ItemComment = { id: string; text: string; created_at: string; user: { id: string; display_name: string } }
export type PersonalTemplate = { id: string; name: string; created_at: string }
export type MyTask = { trip_id: string; trip_name: string; title: string; path: string; kind: string }
export const getMyTasks = () => req<MyTask[]>("/trips/my-tasks")
export const getPersonalTemplates = () => req<PersonalTemplate[]>("/trips/templates")
export const createTripFromTemplate = (id: string) => req<Trip>(`/trips/templates/${id}/use`, { method: "POST" })
export const deletePersonalTemplate = (id: string) => req(`/trips/templates/${id}`, { method: "DELETE" })
export const copyTrip = (id: string) => req<Trip>(`/trips/${id}/copy`, { method: "POST" })
export const savePersonalTemplate = (id: string, name: string) => req<PersonalTemplate>(`/trips/${id}/template`, { method: "POST", body: JSON.stringify({ name }) })
export const updatePlanningSettings = (id: string, body: { availability_deadline?: string | null; archived?: boolean }) => req<Trip>(`/trips/${id}/planning-settings`, { method: "PATCH", body: JSON.stringify(body) })
export const getComments = (tripId: string, type: string, id: string) => req<ItemComment[]>(`/trips/${tripId}/comments/${type}/${id}`)
export const postComment = (tripId: string, type: string, id: string, text: string) => req<ItemComment>(`/trips/${tripId}/comments/${type}/${id}`, { method: "POST", body: JSON.stringify({ text }) })

let migrationPromise: Promise<void> | null = null

async function migrateLegacySession() {
  if (typeof window === "undefined") return
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const token = localStorage.getItem("gogun_token")
      if (!token) return
      try {
        const response = await fetch(`${BASE}/auth/migrate`, {
          method: "POST",
          credentials: "same-origin",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok || response.status === 401 || response.status === 403) {
          localStorage.removeItem("gogun_token")
        } else {
          migrationPromise = null
        }
      } catch {
        migrationPromise = null
      }
    })()
  }
  await migrationPromise
}

export async function logout() {
  if (migrationPromise) await migrationPromise
  localStorage.removeItem("gogun_token")
  localStorage.removeItem("gogun_trip_id")
  migrationPromise = Promise.resolve()
  const response = await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "same-origin" })
  if (!response.ok) throw new ApiError(response.status, "ออกจากระบบไม่สำเร็จ")
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// 401 จาก endpoint กลุ่มนี้แปลว่ากรอกรหัสผิด ไม่ใช่ session หมดอายุ — อย่า redirect
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/link", "/auth/google"]

function redirectToLogin() {
  if (window.location.pathname.startsWith("/login")) return
  const returnTo = window.location.pathname + window.location.search
  window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
}

export type ApiRequestBehavior = { redirectOnUnauthorized?: boolean; signal?: AbortSignal }

async function req<T>(path: string, options: RequestInit = {}, behavior: ApiRequestBehavior = {}): Promise<T> {
  if (path === "/trips/demo" || path.startsWith("/trips/demo/") || path.startsWith("/trips/demo?")) return handleDemoRequest(path, options) as T
  await migrateLegacySession()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    ...(behavior.signal ? { signal: behavior.signal } : {}),
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    // A protected request returned 401; the server-side session is no longer valid.
    if (
      res.status === 401 &&
      behavior.redirectOnUnauthorized !== false &&
      typeof window !== "undefined" &&
      !AUTH_PATHS.some((p) => path.startsWith(p))
    ) {
      redirectToLogin()
    }
    throw new ApiError(res.status, json?.error?.message ?? "API Error")
  }
  return json?.data as T
}

// ─── AUTH ────────────────────────────────────────────────────
export const register = (username: string, email: string, password: string) =>
  req<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  })

export const login = (username: string, password: string) =>
  req<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })

export const googleLogin = (credential: string) =>
  req<{ user: User }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  })

export const getMe = (behavior?: ApiRequestBehavior) => req<User>("/auth/me", {}, behavior)

export const linkAccount = (email: string, password: string) =>
  req<User>("/auth/link", { method: "POST", body: JSON.stringify({ email, password }) })

export const googleLinkAccount = (credential: string) =>
  req<User>("/auth/link/google", { method: "POST", body: JSON.stringify({ credential }) })

export const updateMe = (body: { display_name?: string; email?: string; phone?: string; avatar_color?: string }) =>
  req<User>("/auth/me", { method: "PATCH", body: JSON.stringify(body) })

// ─── TRIPS ───────────────────────────────────────────────────
export const getMyTrips = (behavior?: ApiRequestBehavior) => req<Trip[]>("/trips", {}, behavior)

export const createTrip = (body: CreateTripBody, behavior?: ApiRequestBehavior) =>
  req<Trip>("/trips", { method: "POST", body: JSON.stringify(body) }, behavior)

export const getTripByInvite = (inviteCode: string) =>
  req<Trip>(`/trips/join/${encodeURIComponent(inviteCode)}`, {}, { redirectOnUnauthorized: false })

export const joinTripByInvite = (inviteCode: string) =>
  req<{ trip_id: string }>(`/trips/join/${encodeURIComponent(inviteCode)}`, { method: "POST", body: JSON.stringify({ confirmed: true }) })

export const joinAsGuest = (inviteCode: string, displayName: string) =>
  req<{ trip_id: string }>(`/trips/join/${encodeURIComponent(inviteCode)}/guest`, { method: "POST", body: JSON.stringify({ display_name: displayName, confirmed: true }) }, { redirectOnUnauthorized: false })

export const claimMember = (inviteCode: string, memberId: string) =>
  req<{ trip_id: string }>(`/trips/join/${encodeURIComponent(inviteCode)}/claim/${encodeURIComponent(memberId)}`, { method: "POST", body: JSON.stringify({ confirmed: true }) }, { redirectOnUnauthorized: false })

export const getTrip = (tripId: string) =>
  req<Trip>(`/trips/${tripId}`)

export const updateTrip = (tripId: string, body: Partial<Trip>) =>
  req<Trip>(`/trips/${tripId}`, { method: "PATCH", body: JSON.stringify(body) })

export const transferHost = (tripId: string, newOrganizerUserId: string) =>
  req<Trip>(`/trips/${tripId}/transfer-host`, {
    method: "POST",
    body: JSON.stringify({ new_organizer_user_id: newOrganizerUserId }),
  })

export const deleteTrip = (tripId: string) =>
  req(`/trips/${tripId}`, { method: "DELETE" })

// ─── MEMBERS ─────────────────────────────────────────────────
export const getMembers = (tripId: string) =>
  req<TripMember[]>(`/trips/${tripId}/members`)

export const renameMember = (tripId: string, userId: string, displayName: string) =>
  req<TripMember>(`/trips/${tripId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  })

export const removeMember = (tripId: string, userId: string) =>
  req(`/trips/${tripId}/members/${userId}`, { method: "DELETE" })

// ─── ITINERARY ───────────────────────────────────────────────
export const getItinerary = (tripId: string) =>
  req<ItineraryDay[]>(`/trips/${tripId}/itinerary`)

export const addDay = (
  tripId: string,
  body: { day_number: number; date: string; label: string }
) =>
  req<ItineraryDay>(`/trips/${tripId}/itinerary/days`, {
    method: "POST",
    body: JSON.stringify(body),
  })

export const updateDay = (
  tripId: string,
  dayId: string,
  body: { label?: string; date?: string; day_number?: number }
) =>
  req<ItineraryDay>(`/trips/${tripId}/itinerary/days/${dayId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })

export const deleteDay = (tripId: string, dayId: string) =>
  req(`/trips/${tripId}/itinerary/days/${dayId}`, { method: "DELETE" })

export const swapDays = (tripId: string, dayIdA: string, dayIdB: string) =>
  req(`/trips/${tripId}/itinerary/days/swap`, {
    method: "POST",
    body: JSON.stringify({ day_id_a: dayIdA, day_id_b: dayIdB }),
  })

export const addActivity = (
  tripId: string,
  dayId: string,
  body: { time: string; title: string; sort_order?: number },
) =>
  req<ItineraryActivity>(`/trips/${tripId}/itinerary/days/${dayId}/activities`, {
    method: "POST",
    body: JSON.stringify(body),
  })

export const updateActivity = (
  tripId: string,
  actId: string,
  body: { time?: string; title?: string; tags?: string[] },
) =>
  req<ItineraryActivity>(`/trips/${tripId}/itinerary/activities/${actId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })

export const deleteActivity = (tripId: string, actId: string) =>
  req(`/trips/${tripId}/itinerary/activities/${actId}`, { method: "DELETE" })

// ─── EXPENSES ────────────────────────────────────────────────
export const getExpenses = (tripId: string) =>
  req<Expense[]>(`/trips/${tripId}/expenses`)

export const createExpense = (tripId: string, body: {
  name: string
  category: string
  total_amount: number
  currency: string
  paid_by_user_id: string
  splits: Array<{ user_id: string; amount: number }>
}) => req<Expense>(`/trips/${tripId}/expenses`, { method: "POST", body: JSON.stringify(body) })

export const updateExpense = (tripId: string, expId: string, body: {
  name?: string
  category?: string
  total_amount?: number
  currency?: string
  paid_by_user_id?: string
  splits?: Array<{ user_id: string; amount: number }>
}) => req<Expense>(`/trips/${tripId}/expenses/${expId}`, { method: "PATCH", body: JSON.stringify(body) })

export const deleteExpense = (tripId: string, expId: string) =>
  req<{ deleted: boolean }>(`/trips/${tripId}/expenses/${expId}`, { method: "DELETE" })

export const getBalance = (tripId: string) =>
  req<Balance>(`/trips/${tripId}/expenses/balance`)

export const getSettlements = (tripId: string) =>
  req<Settlement[]>(`/trips/${tripId}/expenses/settlements`)

// ─── TRANSFERS ───────────────────────────────────────────────
export const getTransfers = (tripId: string) =>
  req<TransferSlip[]>(`/trips/${tripId}/transfers`)

export const confirmTransfer = (tripId: string, transferId: string) =>
  req<TransferSlip>(`/trips/${tripId}/transfers/${transferId}/confirm`, { method: "PATCH" })

// ─── AVAILABILITY ────────────────────────────────────────────
export const getAvailability = (tripId: string, range?: { start: string; end: string }) =>
  req<AvailabilityDay[]>(
    `/trips/${tripId}/availability${range ? `?start=${range.start}&end=${range.end}` : ""}`,
  )

export const getMyAvailability = (tripId: string) =>
  req<MyAvailability[]>(`/trips/${tripId}/availability/me`)

export const setAvailability = (tripId: string, entries: MyAvailability[]) =>
  req(`/trips/${tripId}/availability`, { method: "PUT", body: JSON.stringify(entries) })

// Organizer editing on behalf of a specific member
export const getMemberAvailability = (tripId: string, userId: string) =>
  req<MyAvailability[]>(`/trips/${tripId}/availability/${userId}`)

export const setMemberAvailability = (tripId: string, userId: string, entries: MyAvailability[]) =>
  req(`/trips/${tripId}/availability/${userId}`, { method: "PUT", body: JSON.stringify(entries) })

// ─── POLLS ───────────────────────────────────────────────────
export const getPolls = (tripId: string) =>
  req<Poll[]>(`/trips/${tripId}/polls`)

export const getPoll = (tripId: string, pollId: string) =>
  req<PollDetail>(`/trips/${tripId}/polls/${pollId}`)

export const createPoll = (
  tripId: string,
  body: { title: string; subtitle?: string; close_date?: string; options?: { text: string; sort_order?: number }[] }
) =>
  req<Poll>(`/trips/${tripId}/polls`, { method: "POST", body: JSON.stringify(body) })

export const updatePoll = (
  tripId: string,
  pollId: string,
  body: {
    title?: string
    subtitle?: string
    status?: "open" | "closed"
    options?: Array<{ id?: string; text: string; sort_order?: number }>
  }
) =>
  req<Poll>(`/trips/${tripId}/polls/${pollId}`, { method: "PATCH", body: JSON.stringify(body) })

export const closePoll = (tripId: string, pollId: string) =>
  req(`/trips/${tripId}/polls/${pollId}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) })

export const deletePoll = (tripId: string, pollId: string) =>
  req(`/trips/${tripId}/polls/${pollId}`, { method: "DELETE" })

export const vote = (tripId: string, pollId: string, option_id: string) =>
  req(`/trips/${tripId}/polls/${pollId}/vote`, {
    method: "POST",
    body: JSON.stringify({ option_id }),
  })

export const unvote = (tripId: string, pollId: string) =>
  req(`/trips/${tripId}/polls/${pollId}/vote`, { method: "DELETE" })

// ─── CHECKLIST ───────────────────────────────────────────────
export const getChecklist = (tripId: string) =>
  req<ChecklistItem[]>(`/trips/${tripId}/checklist`)

export const addChecklistItem = (tripId: string, text: string, sort_order?: number) =>
  req<ChecklistItem>(`/trips/${tripId}/checklist`, {
    method: "POST",
    body: JSON.stringify({ text, sort_order }),
  })

export const updateChecklistItem = (tripId: string, itemId: string, text: string) =>
  req<ChecklistItem>(`/trips/${tripId}/checklist/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ text }),
  })

export const deleteChecklistItem = (tripId: string, itemId: string) =>
  req(`/trips/${tripId}/checklist/${itemId}`, { method: "DELETE" })

export const checkItem = (tripId: string, itemId: string) =>
  req(`/trips/${tripId}/checklist/${itemId}/check`, { method: "POST" })

export const uncheckItem = (tripId: string, itemId: string) =>
  req(`/trips/${tripId}/checklist/${itemId}/check`, { method: "DELETE" })

// ─── PACKING ─────────────────────────────────────────────────
export const getPacking = (tripId: string) =>
  req<PackingItem[]>(`/trips/${tripId}/packing`)

export const addPackingItem = (tripId: string, text: string, category: "shared" | "personal") =>
  req<PackingItem>(`/trips/${tripId}/packing`, {
    method: "POST",
    body: JSON.stringify({ text, category }),
  })

export const deletePackingItem = (tripId: string, itemId: string) =>
  req(`/trips/${tripId}/packing/${itemId}`, { method: "DELETE" })

export const checkPackingItem = (tripId: string, itemId: string) =>
  req(`/trips/${tripId}/packing/${itemId}/check`, { method: "POST" })

export const uncheckPackingItem = (tripId: string, itemId: string) =>
  req(`/trips/${tripId}/packing/${itemId}/check`, { method: "DELETE" })

// ─── WHEEL ───────────────────────────────────────────────────
export const getWheel = (tripId: string) =>
  req<WheelOption[]>(`/trips/${tripId}/wheel`)

export const addWheelOption = (tripId: string, text: string, color: string) =>
  req<WheelOption>(`/trips/${tripId}/wheel`, {
    method: "POST",
    body: JSON.stringify({ text, color }),
  })

export const deleteWheelOption = (tripId: string, optId: string) =>
  req(`/trips/${tripId}/wheel/${optId}`, { method: "DELETE" })

export const clearWheel = (tripId: string) =>
  req(`/trips/${tripId}/wheel`, { method: "DELETE" })

// ─── FORMAT HELPERS ──────────────────────────────────────────
export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export function formatTripDateRange(trip: Trip): string {
  const startIso =
    trip.date_status === "confirmed"
      ? trip.confirmed_start_date
      : trip.proposed_start_date
  if (!startIso) return "ยังไม่กำหนดวัน"

  const start = new Date(startIso)
  const end = new Date(startIso)
  end.setDate(end.getDate() + trip.duration_days - 1)

  const startDay = start.getDate()
  const endDay = end.getDate()
  const endMonth = end.toLocaleDateString("en-GB", { month: "short" })
  const endYear = end.getFullYear()

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}–${endDay} ${endMonth} ${endYear}`
  }
  const startMonth = start.toLocaleDateString("en-GB", { month: "short" })
  const startYear = start.getFullYear()
  const startYearSuffix = startYear !== endYear ? ` ${startYear}` : ""
  return `${startDay} ${startMonth}${startYearSuffix} – ${endDay} ${endMonth} ${endYear}`
}

export function isTripPast(trip: Trip): boolean {
  if (trip.archived_at) return true
  const startIso =
    trip.date_status === "confirmed"
      ? trip.confirmed_start_date
      : trip.proposed_start_date
  if (!startIso) return false

  const end = new Date(startIso)
  end.setDate(end.getDate() + trip.duration_days - 1)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return end < today
}

export function formatAmount(n: number): string {
  return Math.round(n).toLocaleString("th-TH")
}

export function getInitial(name: string): string {
  return name.slice(0, 1)
}

// ─── TYPES ───────────────────────────────────────────────────
export type User = {
  id: string
  username: string
  email: string
  display_name: string
  avatar_color: string
  phone: string | null
  is_guest: boolean
  created_at: string
}

export type TripTypeCode = "one_day" | "overnight" | "long"

export type Trip = {
  availability_deadline?: string | null
  archived_at?: string | null
  id: string
  name: string
  destination: string
  icon: string | null
  theme?: string | null
  trip_type: TripTypeCode | null
  duration_days: number
  proposed_start_date: string | null
  confirmed_start_date: string | null
  date_status: "proposed" | "confirmed"
  currency: string
  invite_code: string
  organizer_id: string
  budget_per_person: number | null
  allow_member_expenses: boolean
  allow_member_itinerary_edit: boolean
  allow_member_invite: boolean
  allow_member_expense_edit?: boolean
  allow_member_polls?: boolean
  allow_member_quests?: boolean
  created_at: string
  organizer: Pick<User, "id" | "display_name" | "avatar_color">
  members: TripMember[]
}

export type CreateTripBody = {
  name: string
  destination: string
  icon?: string
  theme?: string
  trip_type?: TripTypeCode
  duration_days: number
  currency: string
  proposed_start_date?: string
}

export type TripMember = {
  id: string
  trip_id: string
  user_id: string
  role: "organizer" | "member"
  status: "invited" | "joined" | "declined"
  joined_at: string | null
  // is_guest is only included by the invite-preview and member-list endpoints
  user: Pick<User, "id" | "display_name" | "avatar_color"> & { is_guest?: boolean }
}

export type ItineraryDay = {
  id: string
  trip_id: string
  day_number: number
  date: string
  label: string
  activities: ItineraryActivity[]
}

export type ItineraryActivity = {
  tags?: string[]
  id: string
  day_id: string
  time: string
  title: string
  sort_order: number
}

export type Expense = {
  id: string
  trip_id: string
  name: string
  category: string
  total_amount: number
  currency: string
  paid_by_user_id: string
  paid_by: Pick<User, "id" | "display_name" | "avatar_color">
  splits: ExpenseSplit[]
  created_at: string
}

export type ExpenseSplit = {
  id: string
  expense_id: string
  user_id: string
  amount: number
  user: Pick<User, "id" | "display_name" | "avatar_color">
}

export type Balance = {
  total_amount: number
  currency: string
  member_count: number
  balances: MemberBalance[]
}

export type MemberBalance = {
  user_id: string
  display_name: string
  avatar_color: string
  paid: number
  share: number
  net: number
}

export type Settlement = {
  from_user_id: string
  to_user_id: string
  amount: number
  currency: string
  from_user: Pick<User, "id" | "display_name" | "avatar_color">
  to_user: Pick<User, "id" | "display_name" | "avatar_color">
}

export type TransferSlip = {
  id: string
  trip_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  currency: string
  status: "pending" | "confirmed"
  confirmed_at: string | null
  from_user: Pick<User, "id" | "display_name" | "avatar_color">
  to_user: Pick<User, "id" | "display_name" | "avatar_color">
}

export type AvailabilityDay = {
  date: string
  available: number
  uncertain: number
  member_count: number
  variant: "all" | "some" | "uncertain" | "default"
  members: Array<{ user_id: string; display_name: string; avatar_color: string; status: string }>
}

export type MyAvailability = {
  date: string
  status: "available" | "uncertain" | "unavailable"
}

export type Poll = {
  id: string
  trip_id: string
  title: string
  subtitle: string | null
  close_date: string | null
  status: "open" | "closed"
  created_by_user_id: string | null
  created_at: string
  options: PollOption[]
  my_vote_option_id: string | null
}

export type PollOption = {
  id: string
  poll_id: string
  text: string
  sort_order: number
  vote_count: number
  voters: Pick<User, "id" | "display_name" | "avatar_color">[]
  is_winner?: boolean
}

export type PollDetail = {
  poll: Pick<Poll, "id" | "title" | "subtitle" | "status" | "close_date">
  total_voters: number
  options: PollOption[]
  my_vote_option_id: string | null
}

export type ChecklistItem = {
  id: string
  trip_id: string
  text: string
  sort_order: number
  checked_by: Array<Pick<User, "id" | "display_name" | "avatar_color"> & { checked_at: string }>
  is_checked: boolean
}

export type PackingItem = {
  id: string
  trip_id: string
  text: string
  category: "shared" | "personal"
  sort_order: number
  assignees: Pick<User, "id" | "display_name" | "avatar_color">[]
  checked_by: Pick<User, "id" | "display_name" | "avatar_color">[]
  is_checked: boolean
}

export type WheelOption = {
  id: string
  trip_id: string
  text: string
  color: string
  sort_order: number
}
