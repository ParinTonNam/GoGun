# Prompt: เชื่อม GoGun Frontend กับ Backend API

คัดลอก prompt นี้ให้ AI ช่วย wire frontend (`gogun-app/`) เข้ากับ backend API (`gogun-api/`)

---

## ภาพรวม

**Frontend:** Next.js (App Router) ที่ `C:\Users\tonkl\gogun-app\`
**Backend API:** Express + Prisma รันที่ `http://localhost:3001/api/v1`
**สถานะปัจจุบัน:** ทุก page ใช้ข้อมูล hardcode ทั้งหมด ยังไม่มีการเรียก API จริง

**งานที่ต้องทำ:**
1. สร้าง API client ที่ `src/lib/api.ts`
2. สร้าง auth context ที่ `src/lib/auth.ts`
3. เชื่อม login page กับ OTP API
4. เปลี่ยน route `/trips/demo/*` → `/trips/[tripId]/*`
5. แทนที่ hardcoded data ในแต่ละ page ด้วย API call จริง

---

## 1. สร้างไฟล์ `src/lib/api.ts`

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("gogun_token")
}

export function saveToken(token: string) {
  localStorage.setItem("gogun_token", token)
}

export function clearToken() {
  localStorage.removeItem("gogun_token")
  localStorage.removeItem("gogun_trip_id")
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? "API Error")
  return json.data as T
}

// ─── AUTH ────────────────────────────────────────────────────
export const sendOtp = (phone: string) =>
  req("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone }) })

export const verifyOtp = (phone: string, code: string) =>
  req<{ token: string; user: User }>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  })

export const getMe = () => req<User>("/auth/me")

// ─── TRIPS ───────────────────────────────────────────────────
export const createTrip = (body: CreateTripBody) =>
  req<Trip>("/trips", { method: "POST", body: JSON.stringify(body) })

export const getTripByInvite = (inviteCode: string) =>
  req<Trip>(`/trips/join/${inviteCode}`)

export const getTrip = (tripId: string) =>
  req<Trip>(`/trips/${tripId}`)

export const updateTrip = (tripId: string, body: Partial<Trip>) =>
  req<Trip>(`/trips/${tripId}`, { method: "PATCH", body: JSON.stringify(body) })

// ─── MEMBERS ─────────────────────────────────────────────────
export const getMembers = (tripId: string) =>
  req<TripMember[]>(`/trips/${tripId}/members`)

export const joinTrip = (tripId: string) =>
  req<TripMember>(`/trips/${tripId}/members`, { method: "POST", body: JSON.stringify({}) })

export const removeMember = (tripId: string, userId: string) =>
  req(`/trips/${tripId}/members/${userId}`, { method: "DELETE" })

// ─── ITINERARY ───────────────────────────────────────────────
export const getItinerary = (tripId: string) =>
  req<ItineraryDay[]>(`/trips/${tripId}/itinerary`)

export const addActivity = (tripId: string, dayId: string, body: { time: string; title: string }) =>
  req<ItineraryActivity>(`/trips/${tripId}/itinerary/days/${dayId}/activities`, {
    method: "POST",
    body: JSON.stringify(body),
  })

export const deleteActivity = (tripId: string, actId: string) =>
  req(`/trips/${tripId}/itinerary/activities/${actId}`, { method: "DELETE" })

// ─── EXPENSES ────────────────────────────────────────────────
export const getExpenses = (tripId: string) =>
  req<Expense[]>(`/trips/${tripId}/expenses`)

export const getBalance = (tripId: string) =>
  req<Balance>(`/trips/${tripId}/expenses/balance`)

export const getSettlements = (tripId: string) =>
  req<Settlement[]>(`/trips/${tripId}/expenses/settlements`)

// ─── TRANSFERS ───────────────────────────────────────────────
export const getTransfers = (tripId: string) =>
  req<TransferSlip[]>(`/trips/${tripId}/transfers`)

export const uploadSlip = async (tripId: string, transferId: string, file: File) => {
  const form = new FormData()
  form.append("slip", file)
  const token = getToken()
  const res = await fetch(`${BASE}/trips/${tripId}/transfers/${transferId}/slip`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? "Upload failed")
  return json.data as TransferSlip
}

export const confirmTransfer = (tripId: string, transferId: string) =>
  req<TransferSlip>(`/trips/${tripId}/transfers/${transferId}/confirm`, { method: "PATCH" })

// ─── AVAILABILITY ────────────────────────────────────────────
export const getAvailability = (tripId: string) =>
  req<AvailabilityDay[]>(`/trips/${tripId}/availability`)

export const getMyAvailability = (tripId: string) =>
  req<MyAvailability[]>(`/trips/${tripId}/availability/me`)

export const setAvailability = (tripId: string, entries: MyAvailability[]) =>
  req(`/trips/${tripId}/availability`, { method: "PUT", body: JSON.stringify(entries) })

// ─── POLLS ───────────────────────────────────────────────────
export const getPolls = (tripId: string) =>
  req<Poll[]>(`/trips/${tripId}/polls`)

export const getPoll = (tripId: string, pollId: string) =>
  req<PollDetail>(`/trips/${tripId}/polls/${pollId}`)

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

export const addChecklistItem = (tripId: string, text: string) =>
  req<ChecklistItem>(`/trips/${tripId}/checklist`, {
    method: "POST",
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

// ─── TYPES ───────────────────────────────────────────────────
export type User = {
  id: string
  display_name: string
  avatar_color: string
  phone: string | null
  created_at: string
}

export type Trip = {
  id: string
  name: string
  destination: string
  duration_days: number
  proposed_start_date: string | null
  confirmed_start_date: string | null
  date_status: "proposed" | "confirmed"
  currency: string
  invite_code: string
  organizer_id: string
  created_at: string
  organizer: Pick<User, "id" | "display_name" | "avatar_color">
  members: TripMember[]
}

export type CreateTripBody = {
  name: string
  destination: string
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
  user: Pick<User, "id" | "display_name" | "avatar_color">
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
  status: "pending" | "slip_attached" | "confirmed"
  slip_url: string | null
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
  members: Array<Pick<User, "id" | "display_name" | "avatar_color"> & { status: string }>
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
```

---

## 2. Environment Variable

สร้างไฟล์ `.env.local` ใน `gogun-app/`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 3. Auth Pages

### `src/app/login/page.tsx` หรือ `src/app/signin/page.tsx`

Page นี้มีอยู่แล้ว — เชื่อม submit handler กับ API:

```ts
import { sendOtp, verifyOtp, saveToken } from "@/lib/api"

// Step 1: กรอกเบอร์โทร
await sendOtp(phone)
// OTP จะ log ออกมาใน terminal ของ backend (dev mode)

// Step 2: กรอก OTP
const { token, user } = await verifyOtp(phone, code)
saveToken(token)
localStorage.setItem("gogun_trip_id", TRIP_ID) // ถ้าต้องการ default trip
router.push(`/trips/${TRIP_ID}`)
```

**Seed data สำหรับ dev (ไม่ต้องลงทะเบียนใหม่):**
```
เบอร์ต้นน้ำ (organizer): 0911111111
เบอร์เจมส์:              0922222222
เบอร์นาย:               0933333333
เบอร์อาตีฟ:             0944444444
OTP: ดูใน terminal ของ backend
```

---

## 4. การเปลี่ยน Route Structure

**ปัจจุบัน:** `/trips/demo/*` (hardcoded)
**เปลี่ยนเป็น:** `/trips/[tripId]/*` (dynamic)

เปลี่ยนโฟลเดอร์:
```
src/app/trips/demo/              →  src/app/trips/[tripId]/
src/app/trips/demo/availability/ →  src/app/trips/[tripId]/availability/
src/app/trips/demo/itinerary/    →  src/app/trips/[tripId]/itinerary/
src/app/trips/demo/member/       →  src/app/trips/[tripId]/member/
  ...availability/               →    ...availability/
  ...wallet/                     →    ...wallet/
src/app/trips/demo/members/      →  src/app/trips/[tripId]/members/
src/app/trips/demo/tools/        →  src/app/trips/[tripId]/tools/
  ...checklist/                  →    ...checklist/
  ...packing/                    →    ...packing/
  ...vote/                       →    ...vote/
  ...wheel/                      →    ...wheel/
src/app/trips/demo/join/         →  src/app/trips/[tripId]/join/
src/app/trips/demo/settings/     →  src/app/trips/[tripId]/settings/
src/app/trips/demo/share/        →  src/app/trips/[tripId]/share/
```

ในแต่ละ page ที่ย้ายแล้ว ดึง tripId จาก params:
```ts
// Server Component
export default async function Page({ params }: { params: { tripId: string } }) {
  const { tripId } = await params
  ...
}

// Client Component
import { use } from "react"
export default function Page({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params)
  ...
}
```

**Trip ID สำหรับ test:** `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`

---

## 5. การแทนที่ข้อมูลในแต่ละ Page

### `src/app/trips/[tripId]/page.tsx` (Dashboard)

**ข้อมูล hardcode ที่ต้องแทนที่:**
- `MEMBERS` array → ดึงจาก `getTrip(tripId)` → `trip.members`
- `STATS` (เข้าร่วมแล้ว / ค่าใช้จ่ายรวม / ประกาศวันว่าง) → `getTrip()` + `getBalance()`
- ชื่อทริป, วัน, วันที่ → `trip.name`, `trip.duration_days`, `trip.proposed_start_date`
- `INVITE_LINK` → `trip.invite_code`

```ts
"use client"
import { useEffect, useState } from "react"
import { getTrip, getBalance, type Trip, type Balance } from "@/lib/api"

export default function TripDashboardPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)

  useEffect(() => {
    Promise.all([getTrip(tripId), getBalance(tripId)])
      .then(([t, b]) => { setTrip(t); setBalance(b) })
  }, [tripId])

  if (!trip) return <div>loading...</div>

  const joinedCount = trip.members.filter(m => m.status === "joined").length
  const totalAmount = balance?.total_amount ?? 0
  const inviteLink = `gogun.app/t/${trip.invite_code}`
  // ...
}
```

---

### `src/app/trips/[tripId]/itinerary/page.tsx`

**ข้อมูล hardcode:** `DAYS` array
**API:** `getItinerary(tripId)` → `ItineraryDay[]`

```ts
const days = await getItinerary(tripId)
// days[0].day_number → "01"
// days[0].date → "2026-11-12" (format เป็น "12 Nov" เอง)
// days[0].label → "ลงเครื่อง · Tokyo"
// days[0].activities → [{ id, time, title, sort_order }]
```

**การเพิ่ม activity:**
```ts
await addActivity(tripId, day.id, { time: newTime, title: newTitle })
// แล้ว refresh: setDays(await getItinerary(tripId))
```

---

### `src/app/trips/[tripId]/member/wallet/page.tsx`

**ข้อมูล hardcode:** `EXPENSES`, `TRANSFERS`, `AVATAR`
**API:**
```ts
const [expenses, transfers, balance, settlements] = await Promise.all([
  getExpenses(tripId),
  getTransfers(tripId),
  getBalance(tripId),
  getSettlements(tripId),
])
```

**map expense เป็น UI:**
```ts
// expense.paid_by.display_name → "ต้นน้ำ"
// expense.paid_by.avatar_color → "#c0613e"
// expense.total_amount → 147200 (ยัง ¥ ไม่มี comma — format เอง)
// expense.splits.length → จำนวนคน split
// expense.splits → map เป็น avatar stack
```

**map transfer เป็น UI:**
```ts
// transfer.from_user.display_name → "เจมส์"
// transfer.to_user.display_name → "ต้นน้ำ"
// transfer.amount → 47500
// transfer.status → "pending" | "slip_attached" | "confirmed"
```

---

### `src/app/trips/[tripId]/availability/page.tsx`

**ข้อมูล hardcode:** `CELLS` array (วันพร้อม/ไม่พร้อม hardcoded)
**API:**
- Organizer view: `getAvailability(tripId)` → ดู variant ของทุกคน
- Member view: `getMyAvailability(tripId)` → ดู status ของตัวเอง

```ts
const days = await getAvailability(tripId)
// days[i].date → "2026-11-14"
// days[i].variant → "all" | "some" | "uncertain" | "default"
// days[i].available → 3
// days[i].member_count → 4
// days[i].members[j].status → "available" | "uncertain" | "unavailable"
```

**การ toggle availability (member):**
```ts
await setAvailability(tripId, [
  { date: "2026-11-14", status: "available" },
  { date: "2026-11-15", status: "uncertain" },
])
```

---

### `src/app/trips/[tripId]/tools/vote/page.tsx`

**ข้อมูล hardcode:** `POLLS` array
**API:**
```ts
const polls = await getPolls(tripId)
// polls[i].id, polls[i].title, polls[i].status
// polls[i].options[j].text, vote_count, voters, is_winner

// detail (เมื่อ expand poll):
const detail = await getPoll(tripId, pollId)
// detail.my_vote_option_id → id ที่ current user โหวต (null ถ้ายังไม่โหวต)
```

**การโหวต:**
```ts
await vote(tripId, pollId, optionId)
// โหวตซ้ำ = เปลี่ยน vote อัตโนมัติ (upsert)
await unvote(tripId, pollId)
// ยกเลิก vote
```

---

### `src/app/trips/[tripId]/tools/checklist/page.tsx`

**ข้อมูล hardcode:** checklist items
**API:**
```ts
const items = await getChecklist(tripId)
// items[i].text
// items[i].is_checked → state ของ current user
// items[i].checked_by → avatar stack ของคนที่ check

await checkItem(tripId, itemId)
await uncheckItem(tripId, itemId)
await addChecklistItem(tripId, "ทำ visa")
await deleteChecklistItem(tripId, itemId)
```

---

### `src/app/trips/[tripId]/tools/packing/page.tsx`

**API:**
```ts
const items = await getPacking(tripId)
// items[i].category → "shared" | "personal"
// items[i].assignees → list ของคนที่ถูก assign
// items[i].is_checked → check state ของ current user

await checkPackingItem(tripId, itemId)
await uncheckPackingItem(tripId, itemId)
```

---

### `src/app/trips/[tripId]/tools/wheel/page.tsx`

**API:**
```ts
const options = await getWheel(tripId)
// options[i].text, options[i].color

await addWheelOption(tripId, "Ramen", "#e85a2c")
await deleteWheelOption(tripId, optId)
```

---

### `src/app/trips/[tripId]/join/page.tsx`

**Page นี้ public — ไม่ต้อง auth**
```ts
// ดึง trip preview จาก invite code
const trip = await getTripByInvite(inviteCode)
// แสดงชื่อทริป, ปลายทาง, จำนวนสมาชิก

// กดเข้าร่วม:
await joinTrip(tripId)
router.push(`/trips/${tripId}`)
```

---

### `src/app/trips/new/page.tsx`

**Wizard สร้างทริปใหม่ — เชื่อม submit กับ API:**
```ts
const trip = await createTrip({
  name: formData.name,
  destination: formData.destinationCodes.join(", "),
  duration_days: durationDays,
  currency: formData.currency,
  proposed_start_date: formData.startDate?.toISOString().slice(0, 10),
})
router.push(`/trips/${trip.id}`)
```

---

## 6. Format Helper Functions

เพิ่มใน `src/lib/api.ts` หรือสร้าง `src/lib/format.ts`:

```ts
// แปลง "2026-11-12" → "12 Nov"
export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

// แปลง 147200 → "147,200"
export function formatAmount(n: number): string {
  return Math.round(n).toLocaleString("th-TH")
}

// initial จาก display_name
export function getInitial(name: string): string {
  return name.slice(0, 1)
}
```

---

## 7. หมายเหตุสำคัญ

- **response shape:** ทุก endpoint return `{ data: T }` — ตัว `req()` helper unwrap ให้แล้ว
- **error shape:** `{ error: { code: string, message: string } }` — catch `Error` แล้วอ่าน `.message`
- **file upload** (slip/QR): ต้องใช้ `FormData` ไม่ใช่ JSON — ดูฟังก์ชัน `uploadSlip()` ด้านบน
- **amount type:** API return เป็น `number` (Decimal แปลงแล้ว) — format comma เอง
- **avatar_color:** hex เช่น `"#c0613e"` — ใช้เป็น `backgroundColor` ได้เลย
- **Next.js version นี้มี breaking changes** — อ่าน `node_modules/next/dist/docs/` ก่อนเขียน code
- **Swagger UI:** `http://localhost:3001/api/docs` — ใช้ดู request/response จริง

---

## 8. ลำดับการทำงาน (แนะนำ)

1. สร้าง `src/lib/api.ts` (copy จาก section 1)
2. สร้าง `.env.local`
3. เชื่อม login page กับ OTP flow
4. เปลี่ยน route `/trips/demo` → `/trips/[tripId]` (rename folder)
5. เชื่อม dashboard page (`/trips/[tripId]/page.tsx`) ก่อน — ทดสอบว่า token ทำงาน
6. เชื่อม itinerary, wallet, vote ตามลำดับ
7. เชื่อม availability, checklist, packing, wheel
