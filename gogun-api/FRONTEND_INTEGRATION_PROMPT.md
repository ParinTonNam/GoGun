# GoGun Frontend ↔ API Integration Prompt

คัดลอก prompt นี้ให้ AI ช่วย wire frontend (Next.js 16) เข้ากับ GoGun backend API

---

## Context

คุณกำลัง integrate **GoGun (ไปกัน)** — แอปวางแผนทริปกลุ่ม
- Frontend: **Next.js 16** (App Router), TypeScript, Tailwind
- Backend API: **Express + Prisma** รันอยู่ที่ `http://localhost:3001`
- ข้อมูล hardcoded ในหน้าต่างๆ ต้องถูกแทนที่ด้วย API call จริง

---

## API Base & Auth

```
BASE_URL = http://localhost:3001/api/v1
Swagger UI = http://localhost:3001/api/docs
```

ทุก request (ยกเว้น OTP และ join preview) ต้องส่ง header:
```
Authorization: Bearer <jwt_token>
```

### Auth Flow
```
POST /auth/otp/send       body: { phone: "0911111111" }
POST /auth/otp/verify     body: { phone, code }  → { data: { token, user } }
GET  /auth/me             → { data: User }
```

Token อายุ 90 วัน — เก็บใน `localStorage` หรือ cookie

---

## Response Shape (ทุก endpoint)

```ts
// Success
{ data: T, meta?: { total: number } }

// Error
{ error: { code: string, message: string } }
```

---

## TypeScript Types

```ts
type UserPublic = {
  id: string
  display_name: string
  avatar_color: string  // hex เช่น "#c0613e"
}

type User = UserPublic & {
  phone: string | null  // masked: "0911111***"
  created_at: string
}

type Trip = {
  id: string
  name: string
  destination: string
  duration_days: number
  proposed_start_date: string | null   // "2026-11-12"
  confirmed_start_date: string | null
  date_status: "proposed" | "confirmed"
  currency: string   // "JPY"
  invite_code: string
  organizer_id: string
  created_at: string
  organizer: UserPublic
  members: TripMember[]
}

type TripMember = {
  id: string
  trip_id: string
  user_id: string
  role: "organizer" | "member"
  status: "invited" | "joined" | "declined"
  joined_at: string | null
  user: UserPublic
}

type ItineraryDay = {
  id: string
  trip_id: string
  day_number: number
  date: string
  label: string
  activities: ItineraryActivity[]
}

type ItineraryActivity = {
  id: string
  day_id: string
  time: string   // "06:30"
  title: string
  sort_order: number
}

type Expense = {
  id: string
  trip_id: string
  name: string
  category: "plane" | "hotel" | "food" | "train" | "wifi" | "ticket" | "other"
  total_amount: number
  currency: string
  paid_by_user_id: string
  created_at: string
  paid_by: UserPublic
  splits: ExpenseSplit[]
}

type ExpenseSplit = {
  id: string
  expense_id: string
  user_id: string
  amount: number
  user: UserPublic
}

type Balance = {
  total_amount: number
  currency: string
  member_count: number
  balances: MemberBalance[]
}

type MemberBalance = {
  user_id: string
  display_name: string
  avatar_color: string
  paid: number
  share: number
  net: number   // บวก = คนอื่นเป็นหนี้คุณ, ลบ = คุณเป็นหนี้คนอื่น
}

type Settlement = {
  from_user_id: string
  to_user_id: string
  amount: number
  currency: string
  from_user: UserPublic
  to_user: UserPublic
}

type TransferSlip = {
  id: string
  trip_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  currency: string
  status: "pending" | "slip_attached" | "confirmed"
  slip_url: string | null
  confirmed_at: string | null
  from_user: UserPublic
  to_user: UserPublic
}

type PaymentMethod = {
  id: string
  user_id: string
  trip_id: string
  type: "qr" | "promptpay"
  qr_image_url: string | null
  promptpay_number: string | null  // masked
}

type AvailabilityDay = {
  date: string
  available: number
  uncertain: number
  member_count: number
  variant: "all" | "some" | "uncertain" | "default"
  members: Array<UserPublic & { status: "available" | "uncertain" | "unavailable" }>
}

type Poll = {
  id: string
  trip_id: string
  title: string
  subtitle: string | null
  close_date: string | null
  status: "open" | "closed"
  created_by_user_id: string | null
  created_at: string
  options: PollOption[]
}

type PollOption = {
  id: string
  poll_id: string
  text: string
  sort_order: number
  vote_count: number
  voters: UserPublic[]
  is_winner?: boolean   // มีเฉพาะตอน poll.status === "closed"
}

type PollDetail = {
  poll: Pick<Poll, "id" | "title" | "subtitle" | "status" | "close_date">
  total_voters: number
  options: PollOption[]
  my_vote_option_id: string | null
}

type PackingItem = {
  id: string
  trip_id: string
  text: string
  category: "shared" | "personal"
  sort_order: number
  assignees: UserPublic[]
  checked_by: UserPublic[]
  is_checked: boolean   // เฉพาะ current user
}

type ChecklistItem = {
  id: string
  trip_id: string
  text: string
  sort_order: number
  checked_by: Array<UserPublic & { checked_at: string }>
  is_checked: boolean
}

type WheelOption = {
  id: string
  trip_id: string
  text: string
  color: string
  sort_order: number
}

type TripNote = {
  id: string
  trip_id: string
  type: "hotel" | "plane" | "location" | "link"
  title: string
  subtitle: string | null
  url: string | null
  sort_order: number
}
```

---

## API Client (แนะนำ)

สร้างไฟล์ `lib/api.ts`:

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("gogun_token") : null
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? "API error")
  return json.data as T
}

export const api = {
  // AUTH
  sendOtp: (phone: string) =>
    request("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, code: string) =>
    request<{ token: string; user: User }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),
  me: () => request<User>("/auth/me"),

  // TRIPS
  createTrip: (body: Partial<Trip>) =>
    request<Trip>("/trips", { method: "POST", body: JSON.stringify(body) }),
  getTripByInvite: (invite_code: string) =>
    request<Trip>(`/trips/join/${invite_code}`),
  getTrip: (tripId: string) => request<Trip>(`/trips/${tripId}`),
  updateTrip: (tripId: string, body: Partial<Trip>) =>
    request<Trip>(`/trips/${tripId}`, { method: "PATCH", body: JSON.stringify(body) }),

  // MEMBERS
  getMembers: (tripId: string) => request<TripMember[]>(`/trips/${tripId}/members`),
  joinTrip: (tripId: string, body?: { display_name?: string; avatar_color?: string }) =>
    request<TripMember>(`/trips/${tripId}/members`, { method: "POST", body: JSON.stringify(body) }),
  updateMember: (tripId: string, userId: string, body: Partial<TripMember>) =>
    request<TripMember>(`/trips/${tripId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  removeMember: (tripId: string, userId: string) =>
    request(`/trips/${tripId}/members/${userId}`, { method: "DELETE" }),

  // ITINERARY
  getItinerary: (tripId: string) => request<ItineraryDay[]>(`/trips/${tripId}/itinerary`),
  addDay: (tripId: string, body: { day_number: number; date: string; label: string }) =>
    request<ItineraryDay>(`/trips/${tripId}/itinerary/days`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateDay: (tripId: string, dayId: string, body: { label?: string; date?: string }) =>
    request<ItineraryDay>(`/trips/${tripId}/itinerary/days/${dayId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  addActivity: (tripId: string, dayId: string, body: { time: string; title: string; sort_order?: number }) =>
    request<ItineraryActivity>(`/trips/${tripId}/itinerary/days/${dayId}/activities`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateActivity: (tripId: string, actId: string, body: Partial<ItineraryActivity>) =>
    request<ItineraryActivity>(`/trips/${tripId}/itinerary/activities/${actId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteActivity: (tripId: string, actId: string) =>
    request(`/trips/${tripId}/itinerary/activities/${actId}`, { method: "DELETE" }),

  // EXPENSES
  getExpenses: (tripId: string) => request<Expense[]>(`/trips/${tripId}/expenses`),
  addExpense: (tripId: string, body: {
    name: string; category: string; total_amount: number
    currency: string; paid_by_user_id: string
    splits: { user_id: string; amount: number }[]
  }) =>
    request<Expense>(`/trips/${tripId}/expenses`, { method: "POST", body: JSON.stringify(body) }),
  updateExpense: (tripId: string, expId: string, body: Partial<Expense>) =>
    request<Expense>(`/trips/${tripId}/expenses/${expId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteExpense: (tripId: string, expId: string) =>
    request(`/trips/${tripId}/expenses/${expId}`, { method: "DELETE" }),
  getBalance: (tripId: string) => request<Balance>(`/trips/${tripId}/expenses/balance`),
  getSettlements: (tripId: string) => request<Settlement[]>(`/trips/${tripId}/expenses/settlements`),

  // TRANSFERS
  getTransfers: (tripId: string) => request<TransferSlip[]>(`/trips/${tripId}/transfers`),
  uploadSlip: (tripId: string, transferId: string, file: File) => {
    const form = new FormData()
    form.append("slip", file)
    const token = getToken()
    return fetch(`${BASE}/trips/${tripId}/transfers/${transferId}/slip`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(r => r.json()).then(j => j.data as TransferSlip)
  },
  confirmTransfer: (tripId: string, transferId: string) =>
    request<TransferSlip>(`/trips/${tripId}/transfers/${transferId}/confirm`, { method: "PATCH" }),

  // PAYMENT METHODS
  getPaymentMethods: (tripId: string, userId: string) =>
    request<PaymentMethod[]>(`/trips/${tripId}/payment-methods/${userId}`),
  upsertPaymentMethod: (tripId: string, formData: FormData) => {
    const token = getToken()
    return fetch(`${BASE}/trips/${tripId}/payment-methods`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json()).then(j => j.data as PaymentMethod)
  },

  // AVAILABILITY
  getAvailability: (tripId: string) =>
    request<AvailabilityDay[]>(`/trips/${tripId}/availability`),
  getMyAvailability: (tripId: string) =>
    request<Array<{ date: string; status: string }>>(`/trips/${tripId}/availability/me`),
  setAvailability: (tripId: string, entries: Array<{ date: string; status: string }>) =>
    request(`/trips/${tripId}/availability`, { method: "PUT", body: JSON.stringify(entries) }),

  // POLLS
  getPolls: (tripId: string) => request<Poll[]>(`/trips/${tripId}/polls`),
  createPoll: (tripId: string, body: {
    title: string; subtitle?: string; close_date?: string
    options?: { text: string; sort_order?: number }[]
  }) =>
    request<Poll>(`/trips/${tripId}/polls`, { method: "POST", body: JSON.stringify(body) }),
  getPoll: (tripId: string, pollId: string) =>
    request<PollDetail>(`/trips/${tripId}/polls/${pollId}`),
  updatePoll: (tripId: string, pollId: string, body: { title?: string; status?: string }) =>
    request<Poll>(`/trips/${tripId}/polls/${pollId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deletePoll: (tripId: string, pollId: string) =>
    request(`/trips/${tripId}/polls/${pollId}`, { method: "DELETE" }),
  vote: (tripId: string, pollId: string, option_id: string) =>
    request(`/trips/${tripId}/polls/${pollId}/vote`, {
      method: "POST",
      body: JSON.stringify({ option_id }),
    }),
  unvote: (tripId: string, pollId: string) =>
    request(`/trips/${tripId}/polls/${pollId}/vote`, { method: "DELETE" }),

  // PACKING
  getPacking: (tripId: string) => request<PackingItem[]>(`/trips/${tripId}/packing`),
  addPackingItem: (tripId: string, body: {
    text: string; category: "shared" | "personal"; assignees?: string[]
  }) =>
    request<PackingItem>(`/trips/${tripId}/packing`, { method: "POST", body: JSON.stringify(body) }),
  deletePackingItem: (tripId: string, itemId: string) =>
    request(`/trips/${tripId}/packing/${itemId}`, { method: "DELETE" }),
  checkPacking: (tripId: string, itemId: string) =>
    request(`/trips/${tripId}/packing/${itemId}/check`, { method: "POST" }),
  uncheckPacking: (tripId: string, itemId: string) =>
    request(`/trips/${tripId}/packing/${itemId}/check`, { method: "DELETE" }),

  // CHECKLIST
  getChecklist: (tripId: string) => request<ChecklistItem[]>(`/trips/${tripId}/checklist`),
  addChecklistItem: (tripId: string, body: { text: string; sort_order?: number }) =>
    request<ChecklistItem>(`/trips/${tripId}/checklist`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteChecklistItem: (tripId: string, itemId: string) =>
    request(`/trips/${tripId}/checklist/${itemId}`, { method: "DELETE" }),
  checkChecklist: (tripId: string, itemId: string) =>
    request(`/trips/${tripId}/checklist/${itemId}/check`, { method: "POST" }),
  uncheckChecklist: (tripId: string, itemId: string) =>
    request(`/trips/${tripId}/checklist/${itemId}/check`, { method: "DELETE" }),

  // WHEEL
  getWheel: (tripId: string) => request<WheelOption[]>(`/trips/${tripId}/wheel`),
  addWheelOption: (tripId: string, body: { text: string; color: string }) =>
    request<WheelOption>(`/trips/${tripId}/wheel`, { method: "POST", body: JSON.stringify(body) }),
  deleteWheelOption: (tripId: string, optId: string) =>
    request(`/trips/${tripId}/wheel/${optId}`, { method: "DELETE" }),

  // NOTES
  getNotes: (tripId: string) => request<TripNote[]>(`/trips/${tripId}/notes`),
  addNote: (tripId: string, body: {
    type: string; title: string; subtitle?: string; url?: string
  }) =>
    request<TripNote>(`/trips/${tripId}/notes`, { method: "POST", body: JSON.stringify(body) }),
  updateNote: (tripId: string, noteId: string, body: Partial<TripNote>) =>
    request<TripNote>(`/trips/${tripId}/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteNote: (tripId: string, noteId: string) =>
    request(`/trips/${tripId}/notes/${noteId}`, { method: "DELETE" }),
}
```

---

## Environment Variable

ใน `.env.local` ของ Next.js:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## การแทนที่ Hardcoded Data (ตัวอย่างแต่ละหน้า)

### หน้า Trip Detail
```ts
// เดิม: hardcoded trip object
// ใหม่:
const trip = await api.getTrip(tripId)
const itinerary = await api.getItinerary(tripId)
```

### หน้า Wallet / Expenses
```ts
const expenses = await api.getExpenses(tripId)
const balance = await api.getBalance(tripId)
const settlements = await api.getSettlements(tripId)
// settlements → แสดง "เจมส์ → ต้นน้ำ ¥34,050"
```

### หน้า Poll
```ts
const polls = await api.getPolls(tripId)
const detail = await api.getPoll(tripId, pollId)
// detail.my_vote_option_id → highlight ตัวเลือกที่ user โหวต
// detail.options[n].is_winner → แสดง winner badge (ตอน status=closed)
```

### หน้า Checklist
```ts
const items = await api.getChecklist(tripId)
// item.is_checked → checkbox state ของ current user
// item.checked_by → แสดง avatar stack ของคนที่ check แล้ว
await api.checkChecklist(tripId, itemId)    // เช็ค
await api.uncheckChecklist(tripId, itemId)  // uncheck
```

### หน้า Packing
```ts
const items = await api.getPacking(tripId)
// item.category === "shared" → แสดง assignees
// item.is_checked → state ของ current user
```

### หน้า Availability
```ts
const days = await api.getAvailability(tripId)
// day.variant → "all" | "some" | "uncertain" | "default"
// day.available / day.member_count → "3/4 คน"
```

### หน้า Join (invite link)
```ts
// ไม่ต้องส่ง token!
const trip = await api.getTripByInvite(invite_code)
// แสดง preview → user กรอกชื่อ → เรียก api.joinTrip()
```

---

## Error Handling Pattern

```ts
try {
  const data = await api.getTrip(tripId)
} catch (e) {
  if (e instanceof Error) {
    // e.message มาจาก error.message ของ API
    // เช่น "You are not a member of this trip" (403)
    // หรือ "Trip not found" (404)
  }
}
```

---

## Auth Guard (Next.js Middleware)

```ts
// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("gogun_token")?.value
  const isPublic = request.nextUrl.pathname.startsWith("/join")
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = { matcher: ["/((?!_next|login|api).*)"] }
```

---

## Seed Data สำหรับ Test

```
Trip ID:     aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
Invite code: tokyo-kyoto-x4

User phones:
  ต้นน้ำ (organizer): 0911111111
  เจมส์:              0922222222
  นาย:               0933333333
  อาตีฟ:             0944444444

OTP flow (dev): code จะ log ออกมาใน terminal ของ backend
```
