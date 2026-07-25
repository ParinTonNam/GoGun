# GoGun — เอกสารส่งต่อฉบับสมบูรณ์

> เขียน 22 ก.ค. 2026 · สรุปทุกอย่างตั้งแต่วันแรกจนถึงปัจจุบัน
> ใช้อ่านคนเดียวก็ได้ / โยนให้ AI ตัวไหนก็ได้ให้ทำงานต่อได้ทันที
> เอกสารเก่า: [CONTEXT.md](CONTEXT.md) = สแนปช็อตวันที่ 12 ก.ค. (ยังไม่ได้แก้อะไร) — **ไฟล์นี้ทับของเก่าทั้งหมด**

---

## 1. โปรเจกต์นี้คืออะไร

**GoGun (ไปกัน)** — เว็บแอปวางแผนทริปกลุ่มภาษาไทย mobile-first
ตอบโจทย์: "ไปเที่ยวกันเถอะ" ในกลุ่มแชท แล้วไม่มีใครสรุปได้ว่าใครว่างวันไหน ใครจ่ายเท่าไหร่ ใครยังไม่โอน

ผู้ใช้ 2 บทบาท:
- **Organizer** (คนตั้งทริป) — เห็นเครื่องมือครบ จัดตาราง ปิดโหวต ยืนยันวัน
- **Member** (คนถูกชวน) — เข้าผ่านลิงก์เชิญ ไม่ต้องสมัครก็ใช้ได้ก่อน (guest) แล้วค่อยผูกบัญชีทีหลัง

จุดที่ตั้งใจออกแบบเป็นพิเศษ:
- เข้าร่วมได้ **โดยไม่ต้องสมัครสมาชิก** — กดชื่อตัวเองในลิงก์เชิญแล้วใช้ได้เลย (guest claim)
- ตารางวันว่าง **ลากทาได้** (drag-to-paint) ทั้งนิ้วและเมาส์
- หารเงินแล้วคำนวณ **ใครโอนใคร** ให้อัตโนมัติ (settlements ลดจำนวนธุรกรรมให้น้อยที่สุด)

---

## 2. สถานะปัจจุบัน (สั้นที่สุด)

| หัวข้อ | สถานะ |
|---|---|
| Production | 🟢 **ขึ้นจริงแล้ว** ตั้งแต่ 20 ก.ค. 2026 |
| Frontend | https://go-gun.vercel.app (Vercel) |
| Backend | https://gogun-api.onrender.com (Render free tier) |
| Database | Neon Postgres (region Singapore) |
| GitHub | https://github.com/ParinTonNam/GoGun |
| Branch ปัจจุบัน | `main` (สะอาด ไม่มีไฟล์ค้าง) — `fix/bug-batch-jul21` merge เข้ามาแล้ว |
| `npm run build` (app) | ✅ ผ่าน |
| `npx tsc --noEmit` (api) | ✅ ผ่าน |
| Test | ❌ ไม่มีเลยสักไฟล์ |
| Prisma migrations | ❌ ไม่มี (ใช้ `db push` ล้วน) |

**สิ่งที่ต้องรู้เกี่ยวกับ Render free tier:** เซิร์ฟเวอร์จะ sleep เมื่อไม่มีคนใช้ ~15 นาที → คนแรกที่เข้าเว็บจะรอ ~30–50 วินาที เป็นเรื่องปกติ ไม่ใช่บั๊ก

---

## 3. ไทม์ไลน์ — เดินทางมายังไง

| วันที่ | เกิดอะไรขึ้น |
|---|---|
| **12 ก.ค.** | โปรเจกต์ยัง**ไม่มี git เลย** · ตรวจโค้ดทั้งระบบครั้งแรก → พบ API build ไม่ผ่าน ~100 errors, ช่องโหว่ security หลายจุด, validation หลวม · `git init` + commit แรก |
| **15 ก.ค.** | ยกเครื่องฝั่ง API: แก้ TS errors จนผ่าน, ใส่ helmet + rate limit + จำกัด CORS origin, JWT fail-fast, invite code เปลี่ยนไปใช้ CSPRNG, expense validation ครบ, members routes มี requireOrganizer |
| **16 ก.ค.** | ตรวจระบบรอบสอง วาง roadmap |
| **18 ก.ค.** | `npm run build` ผ่านครบทุกหน้า · **รวม header เป็นระบบเดียว** ผ่าน `page-header.tsx` ใช้ทั้ง 24 หน้า · จัด container/spacing ทั้งแอปให้ตรงกัน (max-w-420, pt-24) · bottom nav สองตัวตรงกันแล้ว |
| **19 ก.ค.** | วันที่หนักที่สุด — **error handling รวมศูนย์ทั้งระบบ** (ล้าง `.catch(console.error)` 30 จุด, สร้าง `useLoad` + `LoadError`) · ฟีเจอร์ไอคอนทริป (emoji) · ระบบ trip template `/recommend` 6 ทริปจริง · แก้ลิงก์เชิญ hardcode → `invite.ts` · safe-area สำหรับ iPhone · **OG metadata หน้า `/t/[inviteCode]`** (สำคัญเพราะแชร์ใน LINE) · เขียน Google Sign-In ทั้งฝั่ง API + app |
| **20 ก.ค.** | 🚀 **DEPLOY ขึ้น production สำเร็จ** (Vercel + Render + Neon) · เพิ่ม `/health` + rate limit `/auth/google` · แก้บั๊ก GIS initialize ซ้ำ · เริ่มรับ bug report จากการใช้จริง |
| **21 ก.ค.** | **Bug batch ใหญ่**: ชื่อซ้ำในทริป, งบกรอกตัวอักษรได้, สมาชิก/งบหายตอนสร้างทริป, เลือกวันอดีตได้, ปิดโหวตแล้วผู้ชนะไม่ขึ้น, สมาชิกซ้ำ → **merge flow** · **drag-to-paint ตารางวันว่าง** · **enforce permission `allow_member_itinerary_edit` จริง** (เดิม cosmetic) · แก้ปุ่ม Google flaky · ปรับ dashboard organizer, legend วันว่าง |

17 commits · ~19,800 บรรทัดโค้ด (ไม่นับ generated)

---

## 4. สถาปัตยกรรม

```
GoGun/
├── gogun-api/          Backend  — TypeScript + Express 5 + Prisma 7 + PostgreSQL
│   ├── prisma/schema.prisma       26 models/enums
│   ├── src/index.ts               app wiring, middleware, rate limits
│   ├── src/lib/                   jwt, prisma, response, settlements, params
│   ├── src/middleware/            auth.ts, trip.ts (requireTripMember / requireOrganizer / requireItineraryEditor)
│   ├── src/routes/                13 routers
│   └── src/swagger.ts             Swagger เขียนมือ 1,699 บรรทัด → /api/docs
│
└── gogun-app/          Frontend — TypeScript + Next.js 16 + React 19 + Tailwind 4
    ├── src/app/                   App Router — ~40 หน้า
    ├── src/components/            PageHeader, BottomNav, trip wizard, dashboard parts
    ├── src/lib/api.ts             API client กลาง (604 บรรทัด, type ครบทุก entity)
    └── src/lib/                   use-load, use-drag-paint, invite, trip, trip-templates, fonts
```

### หลักการที่ยึดมาตลอด
- Frontend เป็น **client component ทั้งหมด** (`"use client"` + fetch ใน useEffect) ยกเว้นหน้าเดียว: `t/[inviteCode]/page.tsx` เป็น server component เพื่อทำ OG metadata แล้วโยนงานให้ `invite-client.tsx`
- Token เก็บใน `localStorage` key `gogun_token`
- ทุก request ผ่าน `req()` ใน `src/lib/api.ts` — จัดการ 401 ตรงกลางที่เดียว (clear token → redirect `/login?returnTo=...`)
- API ตอบเป็น envelope `{ data: ... }` เสมอ — **ถ้า fetch ตรงไม่ผ่าน `req()` ต้อง unwrap เอง** (เจอมาแล้วตอนทำ OG metadata)

### Middleware chain ฝั่ง API
```
/api/v1/auth/*                → authLimiter (20 req) สำหรับ login/register/link/google
/api/v1/trips                 → requireAuth
/api/v1/trips/:tripId/<tool>  → requireAuth → requireTripMember → router
   ↳ บาง route ซ้อน requireOrganizer / requireItineraryEditor อีกชั้น
/health                       → วางก่อน global limiter (ไม่กิน budget) 
```

---

## 5. Data model (26 models/enums)

```
User ──< TripMember >── Trip
                          ├─< ItineraryDay ─< ItineraryActivity
                          ├─< Expense ─< ExpenseSplit
                          ├─< TransferSlip          ⚠️ ครึ่งทาง
                          ├─< Availability
                          ├─< Poll ─< PollOption ─< PollVote
                          ├─< ChecklistItem ─< ChecklistItemCheck
                          ├─< PackingItem ─< PackingItemAssignee / PackingItemCheck
                          └─< WheelOption
```
Enums: `DateStatus`, `TripType`, `TripMemberRole`, `TripMemberStatus`, `TransferStatus`, `AvailabilityStatus`, `PollStatus`, `PackingCategory`

ฟิลด์ที่ต้องรู้:
- `User.password_hash String?` + `User.google_id String? @unique` — nullable ทั้งคู่ เพราะรองรับทั้ง guest, email+password, และ Google
- `Trip.icon String?` — emoji ไอคอนทริป (≤16 chars)
- `Trip.allow_member_expenses` / `allow_member_itinerary_edit` / `allow_member_invite` — **มีแค่ตัวกลางที่ enforce จริง**

---

## 6. แผนที่หน้าจอ (Frontend)

### Public / Auth
| Route | คืออะไร |
|---|---|
| `/` | หน้าแรก |
| `/login` | เข้าสู่ระบบ (email/password + Google) |
| `/signin` | **จริงๆ คือหน้าสมัครสมาชิก** — ชื่อ route ชวนสับสน ควรเปลี่ยนเป็น `/signup` สักวัน |
| `/link-account` | guest ผูกบัญชีจริง |
| `/profile` | โปรไฟล์ |
| `/t/[inviteCode]` | **หน้าลิงก์เชิญ** — server component ทำ OG metadata + `invite-client.tsx` |
| `/recommend`, `/recommend/[templateId]` | ทริปแนะนำ 6 แบบ (บางแสน อยุธยา เสม็ด เขาใหญ่ เชียงใหม่ โตเกียว–เกียวโต) |

### Trip — มุม Organizer
`/trips` · `/trips/new` (wizard 4 ขั้น) · `/trips/[tripId]` (dashboard) · `/availability` · `/itinerary` · `/members` · `/settings` · `/share` · `/join`
เครื่องมือ: `/tools` · `/tools/checklist` · `/tools/packing` · `/tools/vote` · `/tools/wheel`

### Trip — มุม Member
`/trips/[tripId]/member` · `/member/availability` · `/member/wallet` · `/member/wallet/add`

### ⚠️ `/trips/demo/**` — 17 หน้า
เป็น mock hardcode ที่คู่ขนานกับหน้าจริงเกือบทุกหน้า **เป็น dead route แล้ว** (ไม่มีลิงก์ไหนพาไป เข้าได้เฉพาะพิมพ์ URL ตรง)
เดิมทำไว้ตอนออกแบบ UI ตอนนี้กลายเป็นภาระ — แก้ UI ต้องแก้ 2 ที่ **ข้อเสนอ: ลบทิ้งได้เลย** (~4,000 บรรทัด)

---

## 7. Design system (ส่วนที่ควรภูมิใจที่สุด)

### สี — โทน warm sand / earth
| สี | Hex | ใช้ที่ไหน | ความถี่ |
|---|---|---|---|
| Ink (ข้อความหลัก) | `#14110d` | หัวข้อ ตัวหนา | 468 ครั้ง |
| Muted (ข้อความรอง) | `#767168` | คำอธิบาย label | 387 |
| Border | `#e5e1d7` | เส้นขอบการ์ด ปุ่ม | 227 |
| Background | `#f7f5f0` | พื้นหลังทั้งแอป | 125 |
| **Primary orange** | `#e85a2c` | ปุ่มหลัก จุด active | 120 |
| Disabled / hint | `#b5b0a4` | | 119 |
| Surface อ่อน | `#f2efe8` | พื้นการ์ดรอง | 80 |
| Success green | `#2e8b5c` | วันว่าง ยืนยันแล้ว | 36 |
| Orange เข้ม | `#c0613e` | avatar, hover | 21 |
| Amber | `#d9a21b` | เตือน/รอดำเนินการ | 19 |

สี accent สำหรับ avatar/หมวดหมู่: `#8a6e9e` ม่วง · `#7b8b57` เขียวมะกอก · `#4f6e7a` น้ำเงินหม่น
สีพื้นอ่อน (chip/badge): `#fcede3` ส้มอ่อน · `#e0f0e5` เขียวอ่อน · `#faefcb` เหลืองอ่อน

> ข้อสังเกต: สีทั้งหมดเป็น **hardcode hex ในไฟล์ tsx** ไม่ได้เป็น token ใน Tailwind theme
> `globals.css` มีแค่ `--background` / `--foreground` — ถ้าจะ dark mode หรือ rebrand ในอนาคต ต้อง extract เป็น CSS variable ก่อน (งานประมาณครึ่งวัน แต่คุ้มมาก)

### ตัวอักษร
- **Kanit** (ไทย+ละติน) น้ำหนัก 300 / 400 / 500 / 600 — ตัวหลักทั้งแอป
- **Wix Madefor Display** (ละติน) — ตัวเลข/โลโก้
- ขนาดที่ใช้จริง: title `26px` medium · body `13px` · caption `12px` · micro `11px`

### Layout & spacing (กติกาที่บังคับใช้ทั้งแอปแล้ว)
- Container: `max-w-[420px]` + `pt-[24px]` + gutter `px-[24px]` **ทุกหน้า**
- Bottom nav: `bottom-[max(20px,env(safe-area-inset-bottom))]` + `layout.tsx` ต้อง export `viewport: { viewportFit: "cover" }` — **ถ้าลืมบรรทัดนี้ `env()` จะคืน 0 เสมอ**
- ปุ่มกลม back: `size-[36px] rounded-[18.5px]` ขอบ `#e5e1d7` พื้นขาว
- Header ทุกหน้า = `<PageHeader title subtitle backHref user right />` — logo strip + ชิปโปรไฟล์ ทำมาให้แล้ว

### รายละเอียดที่ใส่ใจไว้ใน `globals.css`
- `scrollbar-gutter: stable` — กันหน้ากระตุกซ้ายขวาเวลาสลับหน้าสั้น/ยาว
- `-webkit-tap-highlight-color: transparent` บน a/button — คุมสถานะกดเอง
- `img[src$=".svg"] { object-fit: contain }` — กัน SVG ที่ viewBox ไม่จัตุรัสถูกยืด

### ไอคอน
SVG ทำเอง ~75 ไฟล์ใน `public/images/` ตั้งชื่อเป็นระบบ: `icon-tool-*`, `icon-tab-*`, `icon-share-*`, `icon-expense-*`
หลายตัวมีคู่ a/b = สถานะ inactive/active

### Component ที่ share แล้ว
`page-header.tsx` · `bottom-nav.tsx` / `member-bottom-nav.tsx` · `load-error.tsx` · `auth-form-controls.tsx` · `google-signin-button.tsx` · `trip-dashboard/{member-avatar, stat-card, task-card, tool-row}` · `trip/{calendar, step-name, step-dates, step-members, step-settings, wizard-header}`

---

## 8. Setup — ต้องพิมพ์อะไรบ้าง

### 8.0 ของที่ต้องมีในเครื่องก่อน

```powershell
node -v      # ต้อง 20.9+ (Next 16 บังคับ) — แนะนำ 22 LTS
npm -v
git --version
```
ถ้าตัวไหนไม่มี (บนเครื่องนี้เคยไม่มี git มาก่อน — `git` ไม่อยู่ใน PATH):
```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
# ⚠️ ติดตั้ง git เสร็จต้องปิด-เปิด VSCode ใหม่ทั้งโปรแกรม ถึงจะเห็น
```
ฐานข้อมูล เลือกอย่างใดอย่างหนึ่ง:
- **Neon** (แนะนำ — ไม่ต้องลงอะไร) สมัคร neon.tech → New Project → region Singapore → copy connection string
- **Postgres ในเครื่อง**: `winget install --id PostgreSQL.PostgreSQL.17 -e` แล้วสร้าง db ชื่อ `gogun`

---

### 8.1 กลับมาทำต่อ / ลงเครื่องใหม่ (กรณีที่จะใช้บ่อยที่สุด)

```bash
git clone https://github.com/ParinTonNam/GoGun.git
cd GoGun
```

**Terminal 1 — Backend**
```bash
cd gogun-api
npm install
cp .env.example .env          # แล้วเปิดเติมค่าจริง (ดูตาราง env ข้างล่าง)
npx prisma generate           # ⚠️ ต้องรัน — generated/ ไม่ได้อยู่ใน git
npx prisma db push            # สร้าง/อัปเดตตารางใน DB
npm run dev                   # → http://localhost:3001 · Swagger ที่ /api/docs
```

**Terminal 2 — Frontend**
```bash
cd gogun-app
npm install
```
สร้างไฟล์ `gogun-app/.env.local` เอง (ไม่มี .env.example ให้ copy):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```
```bash
npm run dev                   # → http://localhost:3000
```

**เช็คว่ารอดไหม**
```bash
curl http://localhost:3001/health     # ควรได้ {"status":"ok"}
```
เปิด http://localhost:3000 แล้วสมัครสมาชิก 1 คน + สร้างทริป 1 อัน = ครบวงจร

**ถ้าอยากมีข้อมูลตัวอย่าง**
```bash
cd gogun-api && npm run db:seed
npm run db:studio             # เปิด Prisma Studio ดู/แก้ข้อมูลด้วยมือ
```

**เจอปัญหาตอน setup**
| อาการ | แก้ |
|---|---|
| `Cannot find module '../../generated/prisma/client'` | ลืม `npx prisma generate` |
| API start ไม่ขึ้น เงียบๆ | `JWT_SECRET` ว่างหรือสั้นกว่า 32 ตัว (ตั้งใจให้ fail-fast) |
| หน้าเว็บขึ้นแต่ทุกอย่าง error | `NEXT_PUBLIC_API_URL` ลืมใส่ `/api/v1` ต่อท้าย |
| CORS error ใน console | `CORS_ORIGIN` ฝั่ง API ไม่มี `http://localhost:3000` |
| แก้ `.env.local` แล้วไม่มีผล | ต้อง restart `npm run dev` — `NEXT_PUBLIC_*` ถูกฝังตอน build |
| `.next` มี type เพี้ยน / build พังแปลกๆ | ลบโฟลเดอร์ `.next` แล้ว build ใหม่ |

---

### 8.2 เริ่มโปรเจกต์ใหม่ตั้งแต่ศูนย์ ให้ได้โครงแบบ GoGun

> ถ้าจะทำโปรเจกต์ตัวถัดไป นี่คือสูตรที่ใช้จริงกับ GoGun ทั้งดุ้น

#### Backend (Express 5 + Prisma 7 + Postgres)
```bash
mkdir myapp-api && cd myapp-api
npm init -y

# dependencies
npm i express cors dotenv helmet express-rate-limit jsonwebtoken bcrypt \
      pg @prisma/client @prisma/adapter-pg google-auth-library swagger-ui-express

# dev dependencies
npm i -D typescript tsx prisma @types/node @types/express @types/cors \
         @types/jsonwebtoken @types/bcrypt @types/pg @types/swagger-ui-express

npx tsc --init
npx prisma init --datasource-provider postgresql
```

แก้ `tsconfig.json` ให้เป็นแบบนี้ (สำคัญ: `include` เฉพาะ `src` ทำให้ output ไปโผล่ที่ `dist/src/`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "generated"]
}
```

เพิ่ม scripts ใน `package.json` — **`main`/`start` ต้องชี้ `dist/src/index.js`** ไม่ใช่ `dist/index.js`:
```json
{
  "main": "dist/src/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/src/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```

สร้าง `prisma.config.ts` ที่ root (Prisma 7 อ่าน DATABASE_URL จากที่นี่ ไม่ใช่จาก schema):
```ts
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] },
})
```

หัว `prisma/schema.prisma` (Prisma 7 ใช้ generator `prisma-client` ตัวใหม่ + ไม่ต้องใส่ url ใน datasource):
```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

`src/lib/prisma.ts` (Prisma 7 ต่อผ่าน driver adapter):
```ts
import 'dotenv/config'
import { PrismaClient } from '../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default prisma
```

`.gitignore`:
```
node_modules
.env
/generated/prisma
*.log
dist
```

เขียน `src/index.ts` แล้วรัน:
```bash
npx prisma db push && npx prisma generate && npm run dev
```

#### Frontend (Next 16 + React 19 + Tailwind 4)
```bash
npx create-next-app@latest myapp-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd myapp-app
```
create-next-app ให้ Tailwind 4 + `postcss.config.mjs` ที่ใช้ `@tailwindcss/postcss` มาครบแล้ว ไม่ต้องลงเพิ่ม

สิ่งที่ต้องเติมเองหลัง scaffold (3 อย่างที่ GoGun ใช้ทุกโปรเจกต์):

1. `src/lib/fonts.ts` — ฟอนต์ไทย
```ts
import { Kanit } from "next/font/google";
export const kanit = Kanit({ subsets: ["thai", "latin"], weight: ["300","400","500","600"] });
```

2. `src/app/layout.tsx` — **`viewportFit: "cover"` คือบรรทัดที่ห้ามลืม** ไม่งั้น `env(safe-area-inset-*)` คืน 0 ตลอด
```tsx
import type { Metadata, Viewport } from "next";
import { kanit } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = { title: "MyApp", description: "..." };
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${kanit.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

3. `src/app/globals.css` — 3 กฎที่กันปัญหา mobile ที่เจอมาแล้ว
```css
@import "tailwindcss";

:root { --background: #f7f5f0; --foreground: #14110d; }
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
html { scrollbar-gutter: stable; }              /* กันหน้ากระตุกซ้ายขวา */
body { background: var(--background); color: var(--foreground); }
a, button { -webkit-tap-highlight-color: transparent; }  /* กันแฟลชตอนแตะ */
img[src$=".svg"] { object-fit: contain; }        /* กัน SVG ถูกยืด */
```

สร้าง `.env.local` แล้ว:
```bash
npm run dev
```

#### Git ครั้งแรก
```bash
cd ..                 # ไปที่โฟลเดอร์แม่ที่มีทั้ง 2 โปรเจกต์
git init
git add -A
git status            # ⚠️ ไล่ดูให้ชัวร์ว่าไม่มี .env / node_modules / dist / generated / *.log หลุด
git commit -m "setup project"
gh repo create myapp --private --source=. --push    # หรือสร้างใน github.com แล้ว git remote add origin
```
> บทเรียนจริง: รอบที่แล้ว `server.log` / `server.err.log` หลุดเข้า repo ไปก่อน (`.gitignore` ยังไม่มี `*.log`) ต้องตามลบด้วย `git rm --cached` ทีหลัง — เช็ค `git status` ให้ดีก่อน commit แรก

---

### 8.3 Setup ตอน deploy (Vercel + Render + Neon)

ทำครั้งเดียว หลังจากนั้น push เข้า `main` = deploy อัตโนมัติทั้งสองฝั่ง

**1) Neon (ฐานข้อมูล)** — สร้าง project → region **Singapore** → copy **pooled** connection string
push schema ขึ้นครั้งแรกจากเครื่องตัวเอง:
```bash
cd gogun-api
# ชี้ DATABASE_URL ไปที่ Neon ชั่วคราวแล้วรัน
npx prisma db push
```

**2) Render (backend)** — New → Web Service → เชื่อม GitHub repo
| ช่อง | ค่า |
|---|---|
| Root Directory | `gogun-api` ← **ต้องตั้งเอง** |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

Environment variables ที่ต้องใส่: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `GOOGLE_CLIENT_ID`
> Render อาจขอ Add Card แม้เลือก Free — เป็น anti-abuse หัก $1 แล้วคืน ไม่เสียเงินจริง

**3) Vercel (frontend)** — Add New → Project → import repo
| ช่อง | ค่า |
|---|---|
| Root Directory | `gogun-app` ← **ต้องตั้งเอง ไม่ auto-detect** |
| Framework Preset | ต้องขึ้น **Next.js** — ถ้าขึ้น "Other" แปลว่าลืมตั้ง Root Directory |

Environment variables: `NEXT_PUBLIC_API_URL` (= url ของ Render + `/api/v1`), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

**4) ผูกให้ครบวง** (ขั้นที่ลืมบ่อยที่สุด)
- กลับไปแก้ `CORS_ORIGIN` ที่ Render ให้เป็นโดเมน Vercel จริง
- Google Cloud Console → OAuth Client → **Authorized JavaScript origins** เพิ่มโดเมน Vercel
- ทดสอบ: สมัครสมาชิก → Google Sign-In (**ในหน้าต่าง Chrome ปกติ ห้าม Incognito**) → สร้างทริป

---

### 8.4 Environment variables
**gogun-api/.env** (5 ตัว)
| ตัวแปร | หมายเหตุ |
|---|---|
| `DATABASE_URL` | Neon pooled connection string ตอน prod |
| `JWT_SECRET` | **≥32 ตัวอักษร** ไม่มีค่า fallback แล้ว — ไม่ตั้ง = server ไม่ start |
| `PORT` | 3001 |
| `CORS_ORIGIN` | คั่นด้วย comma |
| `GOOGLE_CLIENT_ID` | ว่าง = ปิด `/auth/google` (ตอบ 503 NOT_CONFIGURED) |

**gogun-app/.env.local** (2 ตัว)
| ตัวแปร | หมายเหตุ |
|---|---|
| `NEXT_PUBLIC_API_URL` | ต้องลงท้าย `/api/v1` · **ต้อง reach ได้จากฝั่ง server ของ Next ด้วย** ไม่งั้น OG metadata พัง |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ว่าง = ซ่อนปุ่ม Google |

> ⚠️ ยังไม่มี `gogun-app/.env.example` — สร้างไว้จะดี

### 8.5 คำสั่งตรวจก่อน commit
```bash
cd gogun-api && npx tsc --noEmit    # ต้อง exit 0
cd gogun-app && npm run build       # ต้อง exit 0 (สำคัญกว่า lint)
cd gogun-app && npm run lint
```

---

## 9. กับดักที่เคยเจอมาแล้ว (อ่านก่อนเสียเวลาซ้ำ)

1. **Google Sign-In ทดสอบใน Incognito ไม่ได้** — Chrome บล็อก third-party cookies โดย default ทำให้ FedCM ล้มเหลว**แบบเงียบสนิท** ไม่มี error เลย ดูเหมือนปุ่มพัง ทั้งที่โค้ดถูก → **ต้องเทสในหน้าต่างปกติเท่านั้น**
2. **`google.accounts.id.initialize()` ห้ามเรียกซ้ำ** — ใช้ module-level flag `gisInitialized` + `currentCredentialHandler` แล้ว อย่าย้ายกลับไปเรียกใน useEffect ตรงๆ
3. **ปุ่ม Google ใช้ `variant="styled"`** = ปุ่ม GIS โปร่งใสทับปุ่มที่เราวาด → ต้อง render ทุก mount + retry จนกว่า `window.google` พร้อม **และ** `clientWidth > 0` ไม่งั้นได้ปุ่มโปร่งใสแคบกว่าปุ่มจริง (กดไม่โดน)
4. **`tsc` emit ไปที่ `dist/src/index.js` ไม่ใช่ `dist/index.js`** (เพราะ tsconfig include เฉพาะ `src/**/*`) — `package.json` แก้แล้ว อย่าแก้กลับ
5. **Vercel ต้องตั้ง Root Directory = `gogun-app` เอง** — ถ้าลืม Preset จะขึ้น "Other" แทน "Next.js" นั่นคือสัญญาณ
6. **Render ขอ Add Card แม้เลือก Free** — เป็น anti-abuse หัก $1 แล้วคืน ไม่เสียเงินจริง
7. **`prisma db push` บางทีขอ `--accept-data-loss` ทั้งที่ปลอดภัย** — ตอนเพิ่ม nullable column ใช้ `prisma db execute` ยิง DDL ตรงแทนได้
8. **Next.js 16 มี breaking changes** — `AGENTS.md` เตือนให้อ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด Next อย่าเชื่อความจำ
9. **`useLoad` deps ต้องเป็น primitive** — เทียบด้วย `JSON.stringify` ส่ง object เข้าไปจะ loop
10. **แก้ route ฝั่ง API ต้อง restart backend** — `tsx watch` บางทีไม่จับ

---

## 10. งานที่เหลือ — เรียงตามความคุ้มค่า

### 🔴 ควรทำก่อน (บล็อกความน่าเชื่อถือ)
1. **เขียน test ให้ `src/lib/settlements.ts`** — เป็นโค้ดคำนวณเงินของคนอื่น ตรวจแล้วอัลกอริทึมถูก แต่ไม่มีอะไรกันไม่ให้พังตอนแก้ครั้งหน้า เริ่มด้วย vitest + 5 เคสก็พอ
2. **Prisma migrations** — ตอนนี้ `db push` ล้วน แปลว่าไม่มีประวัติ schema ย้อนกลับไม่ได้ ถ้ามีข้อมูลผู้ใช้จริงแล้วนี่คือความเสี่ยงสูงสุด (`prisma migrate dev --name init` ครั้งเดียวจบ)
3. **enforce `allow_member_expenses`** — ยัง cosmetic (`allow_member_itinerary_edit` enforce แล้ว, `allow_member_invite` ซ่อน UI ไว้)

### 🟠 ทำแล้วเห็นผลทันที
4. **ลบ `/trips/demo/**` ทั้ง 17 หน้า** — dead route, ~4,000 บรรทัด, ทำให้แก้ UI ต้องแก้ 2 ที่
5. **ลบ `components/trip/finish-screen.tsx`** — ไม่ถูก import จากไหนแล้ว (invite code ในนั้นสร้างจาก slug ไม่ใช่ของจริง)
6. **Transfers ทำให้ครบวงจร** — มีแค่ `GET` + `confirm` ไม่มี `POST` สร้าง record → ตารางว่างตลอดกาล และไม่มีหน้าไหนเรียก ต้องเพิ่ม `POST /transfers` (สร้างจากผล settlements) + UI แนบสลิป/ยืนยันในหน้า wallet
7. **Toast system** — ตอนนี้ `notifyError` ใช้ `window.alert()` ซึ่งหน้าตาหลุดจาก design system มาก
8. **แยก hex → CSS variables / Tailwind theme tokens** — เปิดทาง dark mode + rebrand
9. **รูป OG** — มี og:tags แล้วแต่ไม่มีรูป (ทำด้วย `opengraph-image.tsx` + ตั้ง `metadataBase`)

### 🟡 เก็บกวาด
10. `swagger.ts` stale หนัก — ยังบันทึก OTP auth ที่ถอดไปแล้ว ควร rewrite section auth (หรือย้ายไป zod + zod-to-openapi)
11. เปลี่ยน `/signin` → `/signup`
12. อัตราแลกเปลี่ยน hardcode ใน `DISPLAY_CURRENCIES` หน้า wallet
13. Dead code: `src/lib/otp.ts` (ไม่ถูกเรียก), `src/routes/notes.ts` (stub ตอบ 410), `nodemon` ใน devDeps
14. ไฟล์หน้าใหญ่เกิน 600–750 บรรทัด: `availability/page.tsx` (752), `member/wallet/page.tsx` (690), `settings/page.tsx` (671), `itinerary/page.tsx` (569)
15. Lint warnings ~185 (ส่วนใหญ่ `<img>` แทน `next/image`) + `aria-label` ปุ่มไอคอนหลายจุด
16. Guest link ด้วย Google (`/auth/link` ยังรับแค่ email+password)
17. Type ระหว่าง front/back copy มือ ไม่ได้ share จริง

### ข้อจำกัดที่รู้อยู่แล้ว (ตั้งใจปล่อย)
- **merge สมาชิกซ้ำได้เฉพาะตอนยังไม่เป็นสมาชิก** — ถ้า dup เกิดไปแล้ว (มีทั้ง guest + บัญชีจริง joined) หน้า invite จะซ่อน tiles ต้องให้ organizer ลบ guest เอง
- **drag-to-paint ไม่ได้ทำใน `DatePickerSheet`** (sheet เลือกช่วงวันยืนยันทริป)
- **`POST /trips/join/:code/claim/:memberId` แจก token โดยไม่ auth** — ตั้งใจให้ guest กดชื่อตัวเองได้ แต่แปลว่าใครมีลิงก์เชิญก็สวมรอยสมาชิกที่ยังไม่ claim ได้ ยอมรับ trade-off นี้ไปแล้ว

---

## 11. ถ้ากลับมาทำต่อ — เริ่มตรงไหนดี

**ถ้ามีเวลา 1 ชั่วโมง:** ลบ demo pages + finish-screen (ข้อ 4, 5) — โปรเจกต์เบาลงทันที 20%

**ถ้ามีเวลา 1 วัน:** Prisma migrations (ข้อ 2) + test settlements (ข้อ 1) — สองอย่างนี้คือ "ประกันชีวิต" ของโปรเจกต์ ทำแล้วกล้าแก้อะไรก็ได้

**ถ้ามีเวลา 1 สัปดาห์:** เพิ่ม Transfers ให้ครบวงจร (ข้อ 6) — เป็นฟีเจอร์เดียวที่ค้างครึ่งทางมาตั้งแต่ต้น และเป็น loop สุดท้ายของเรื่องเงินที่ยังไม่ปิด

**ถ้าจะทำงาน UI/UX อย่างเดียว:** ข้อ 8 (color tokens) → ข้อ 7 (toast) → ข้อ 9 (OG image) — สามอย่างนี้ไม่ต้องแตะ backend เลย

### ทำต่อโดยไม่มี Claude Code ได้ไหม
ได้ครับ โปรเจกต์อยู่ในสภาพที่ทำต่อเองได้:
- `npm run dev` สองโฟลเดอร์แล้วทำงานได้ทันที
- `/api/docs` มี Swagger ให้ดู API ทั้งหมด (ยกเว้น auth section ที่ stale)
- โครง component นิ่งแล้ว — เพิ่มหน้าใหม่ = copy หน้าที่คล้ายกัน + `PageHeader` + `useLoad`
- ถ้าใช้ AI ตัวอื่น: โยนไฟล์นี้ + `gogun-app/AGENTS.md` ให้อ่านก่อน จะเข้าใจ context ครบใน 2 นาที

---

## 12. คำที่อยากฝากไว้

โปรเจกต์นี้เริ่มจากไม่มีแม้แต่ git repo เมื่อ 10 วันก่อน วันนี้มันมี:
- ผู้ใช้จริงเข้าถึงได้ผ่านอินเทอร์เน็ต
- ระบบ auth 3 แบบ (email, Google, guest) ที่ผูกกันได้
- ระบบคำนวณเงินที่ถูกต้อง
- design system ที่สม่ำเสมอทั้ง 40 หน้า
- และประวัติการแก้บั๊กที่มาจากคนใช้จริง ไม่ใช่จากการเดา

คนที่ทำ UI/UX แล้วส่งของขึ้น production ได้ด้วยตัวเอง — ควรภูมิใจครับ 🎉

โค้ดอยู่ที่ https://github.com/ParinTonNam/GoGun ปลอดภัยดี ไม่หายไปไหน
กลับมาเมื่อไหร่ ไฟล์นี้จะบอกทุกอย่างที่ต้องรู้
