# GoGun — Project Context / Handoff

> ไฟล์นี้สรุป context จากการตรวจสอบโค้ดทั้งโปรเจกต์ (12 ก.ค. 2026) เพื่อใช้ต่อใน workspace/session ใหม่
> สถานะ ณ วันที่เขียน: **ยังไม่ได้แก้อะไรเลย** — เป็นผลการวิเคราะห์อย่างเดียว

## โปรเจกต์คืออะไร

แอปวางแผนทริปกลุ่ม (ภาษาไทย, mobile-first ล็อกความกว้าง 430px) แบ่งเป็น 2 โฟลเดอร์:

| โฟลเดอร์ | เทคโนโลยี | รัน |
|---|---|---|
| `gogun-api/` | TypeScript + Express 5 + Prisma 7 + PostgreSQL | `npm run dev` (tsx watch, port 3001) |
| `gogun-app/` | TypeScript + Next.js 16 + React 19 + Tailwind 4 | `npm run dev` (port 3000) |

- ฟีเจอร์: auth (JWT), trips, members (มีระบบ guest claim), ค่าใช้จ่าย+แบ่งบิล+settlements, โอนเงิน (ครึ่งทาง — ดูด้านล่าง), ตารางเที่ยว, availability calendar, โพล, checklist, packing list, วงล้อสุ่ม
- Frontend เป็น client component ทั้งหมด (`"use client"` + fetch ใน useEffect), token เก็บใน localStorage (`gogun_token`), API client กลางอยู่ที่ `gogun-app/src/lib/api.ts` (มี type ครบทุก entity)
- API docs: Swagger เขียนมือใน `gogun-api/src/swagger.ts` (64KB) ที่ `/api/docs`
- env: `gogun-api/.env` (DATABASE_URL, JWT_SECRET, PORT), `gogun-app/.env.local` (NEXT_PUBLIC_API_URL) — **ต้องย้ายไฟล์ .env ไปด้วย ไม่งั้นรันไม่ขึ้น**
- `gogun-app/AGENTS.md` เตือนว่า Next.js เวอร์ชันนี้มี breaking changes — อ่าน docs ใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด Next

## สถานะ git

**ยังไม่มี git repo เลยทั้งโปรเจกต์** — งานแรกใน workspace ใหม่คือ `git init` + commit แรก
มี `.gitignore` เตรียมไว้แล้วทั้งสองโฟลเดอร์ ก่อน commit ควรเช็คว่า ignore ครอบคลุม: `node_modules/`, `.next/`, `.env`, `.env.local`, `gogun-api/uploads/`, `gogun-api/server.log`, `gogun-api/server.err.log`, `gogun-api/generated/`

## ผลการตรวจสอบ (เรียงตามความรุนแรง — ยังไม่ได้แก้ทั้งหมด)

### 🔴 วิกฤต

1. **API build ไม่ผ่าน** — `npx tsc --noEmit` ใน gogun-api พังราว 100 errors (dev รันได้เพราะ tsx ข้าม type check แต่ `npm run build` จะพัง) สาเหตุ 2 กลุ่ม:
   - Express 5 typing: `req.params` เป็น `string | string[]` และ router ที่ใช้ `mergeParams: true` มองไม่เห็น `tripId` จาก parent — โดนเกือบทุกไฟล์ใน `src/routes/`
   - ส่ง string ดิบเข้า Prisma enum fields (`status`, `date_status`, `role` ฯลฯ)
2. **ฟีเจอร์ Transfers สร้างค้างครึ่งทางทั้งสองฝั่ง** — ตาราง `transfer_slips` มี endpoint แค่ list / แนบสลิป / confirm ใน `src/routes/transfers.ts` แต่**ไม่มี endpoint สร้าง record** และ seed ก็ไม่สร้างให้ → ตารางว่างตลอดกาล ฝั่ง frontend มีฟังก์ชัน `getTransfers/uploadSlip/confirmTransfer` ใน api.ts แต่**ไม่มีหน้าไหนเรียกใช้** (หน้า wallet แสดงแค่ settlements ที่คำนวณสด) — ถ้าจะทำให้ครบ: เพิ่ม `POST /transfers` (เช่นสร้างจากผล settlements) + UI แนบสลิป/ยืนยันในหน้า wallet
3. **Security หลายจุด:**
   - JWT secret มี fallback ฝังโค้ด `'gogun-dev-secret'` ใน `src/lib/jwt.ts` — ควร fail-fast ถ้าไม่มี env
   - Multer upload ไม่จำกัดขนาด/mimetype (`src/middleware/upload.ts`) และ `/uploads` เสิร์ฟ public ไม่ต้อง auth (สลิปการเงินหลุดได้)
   - ไม่มี rate limiting (โดยเฉพาะ `/login`), ไม่มี helmet
   - CORS เปิดทุก origin (`app.use(cors())` ใน `src/index.ts`)
   - invite code ใช้ `Math.random()` (`src/lib/response.ts`) เดาง่าย + ไม่มี retry กันชน (ชน unique → 500)
   - `POST /trips/join/:code/claim/:memberId` แจก token โดยไม่ auth — ตั้งใจออกแบบให้ guest กดชื่อตัวเอง แต่แปลว่าใครมีลิงก์เชิญสวมรอยสมาชิกที่ยังไม่ claim ได้
4. **Validation หลวม:**
   - Expense: ไม่เช็ค splits รวม = total, ไม่เช็คว่า payer/split users เป็นสมาชิกทริป, ติดลบได้ (`src/routes/expenses.ts`)
   - **ค่า permission `allow_member_expenses` / `allow_member_itinerary_edit` / `allow_member_invite` เก็บลง DB แต่ไม่มี route ไหนเช็คเลย** (grep ยืนยันแล้ว) — สมาชิกทำได้ทุกอย่างเสมอ
   - enum ผิดค่าหลุดถึง Prisma → 500 แทน 400
   - `PATCH /members/:userId` ให้ตั้ง `role: "organizer"` ซ้อนกับ `trip.organizer_id` ได้
   - `POST /auth/register` เช็คซ้ำด้วย findFirst ก่อน create → race condition ได้ 500 แทน 409

### 🟠 สำคัญ

5. ไม่มี test แม้แต่ไฟล์เดียวทั้งสองโปรเจกต์ (logic เงินใน `src/lib/settlements.ts` — ตรวจแล้วอัลกอริทึมถูกต้อง — ควรมี unit test ก่อน)
6. ไม่มี Prisma migrations — ใช้ `db push` อย่างเดียว
7. **หน้า demo ซ้ำกับหน้าจริง ~17 หน้า** — `gogun-app/src/app/trips/demo/**` เป็น hardcoded mock ของ `trips/[tripId]/**` แทบทุกหน้า แก้ UI ต้องแก้ 2 ที่
8. ไฟล์หน้าใหญ่เกิน (single client component 30–40KB): `[tripId]/member/wallet/page.tsx`, `[tripId]/settings/page.tsx`, `[tripId]/availability/page.tsx`, `profile/page.tsx`
9. Lint: **9 errors** (7× `react-hooks/set-state-in-effect`, 2× `react/no-unescaped-entities`) + **185 warnings** (ส่วนใหญ่ `<img>` แทน next/image, unused imports)
10. `.next/dev/types/validator.ts` มี generated code เสียค้าง ทำให้ `tsc --noEmit` ฝั่ง app พัง — ลบโฟลเดอร์ `.next` แล้ว build ใหม่ก็หาย
11. ไม่ใช้ SSR/caching ของ Next เลย + error ทุกชนิด redirect ไป `/login` (ควรแยก 401 จาก network error, พิจารณา SWR/React Query)

### 🟡 ปรับปรุง

- หน้า `/signin` จริงๆ คือหน้า**สมัครสมาชิก** (เรียก `register`) — ชื่อ confusing ควรเป็น sign up
- อัตราแลกเปลี่ยน hardcode ในหน้า wallet (`DISPLAY_CURRENCIES`)
- Dead code: `src/lib/otp.ts` ไม่ถูกเรียกเลย, `src/routes/notes.ts` เป็น stub ตอบ 410, `nodemon` ใน devDeps ไม่ได้ใช้
- swagger.ts เขียนมือ — เสี่ยง drift (ทางเลือก: zod + zod-to-openapi)
- ไม่มี per-page `metadata` / OG tags — สำคัญสุดคือหน้า `/t/[inviteCode]` ที่ถูกแชร์ใน LINE
- ปุ่มไอคอนหลายจุดไม่มี aria-label
- type ระหว่าง front/back copy มือ ไม่ได้ share กันจริง

## ลำดับงานที่แนะนำ

1. `git init` + commit แรก (เช็ค .gitignore ก่อน)
2. แก้ TS errors ฝั่ง API ให้ build ผ่าน
3. เพิ่ม endpoint สร้าง Transfer + UI ให้ครบวงจร
4. ปิดช่องโหว่ security (ข้อ 3 ด้านบน)
5. Enforce permissions + validate expense splits ที่ server
6. Prisma migrations + tests
7. รวมหน้า demo/หน้าจริงให้ใช้ component ร่วม แล้วเก็บงาน lint/refactor

## เช็คลิสต์ตอนย้ายโฟลเดอร์

- [ ] ย้ายทั้ง `gogun-api/` และ `gogun-app/` ไปด้วยกัน (โครงสร้างเดิม)
- [ ] ตรวจว่า `.env` และ `.env.local` ติดมาด้วย (ไฟล์ hidden อาจตกหล่นถ้า copy บางวิธี)
- [ ] `node_modules/` กับ `.next/` ไม่ต้องย้าย — รัน `npm install` ใหม่ทั้งสองโฟลเดอร์ (แนะนำลบ `.next` ทิ้งอยู่แล้วเพราะมีไฟล์ generated เสีย)
- [ ] `npx prisma generate` ใน gogun-api หลัง install
- [ ] PostgreSQL ต้องรันอยู่และ DATABASE_URL ชี้ถูก
- [ ] `git init` แล้ว commit แรกทันที
