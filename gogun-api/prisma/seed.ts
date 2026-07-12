import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const U1    = '11111111-1111-1111-1111-111111111111'
const U2    = '22222222-2222-2222-2222-222222222222'
const TRIP  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const D1    = 'dddddddd-1111-1111-1111-111111111111'
const E1    = 'eeeeeeee-1111-1111-1111-111111111111'
const E2    = 'eeeeeeee-2222-2222-2222-222222222222'
const POLL1 = 'b1111111-1111-1111-1111-111111111111'
const OPT1  = 'b2111111-1111-1111-1111-111111111111'
const OPT2  = 'b2222222-2222-2222-2222-222222222222'
const OPT3  = 'b2333333-3333-3333-3333-333333333333'
const CL1   = 'cccccccc-1111-1111-1111-111111111111'
const CL2   = 'cccccccc-2222-2222-2222-222222222222'
const PI1   = 'ffffffff-1111-1111-1111-111111111111'
const PI2   = 'ffffffff-2222-2222-2222-222222222222'
const PI3   = 'ffffffff-3333-3333-3333-333333333333'

async function main() {
  console.log('Seeding database...')

  const hash = await bcrypt.hash('password123', 10)

  await prisma.trip.deleteMany({ where: { id: TRIP } })
  await prisma.user.deleteMany({ where: { id: { in: [U1, U2] } } })

  // Users
  await prisma.user.createMany({
    data: [
      {
        id: U1,
        username: 'tonnam',
        email: 'tonnam@example.com',
        password_hash: hash,
        display_name: 'ต้นน้ำ',
        avatar_color: '#c0613e',
      },
      {
        id: U2,
        username: 'james',
        email: 'james@example.com',
        password_hash: hash,
        display_name: 'เจมส์',
        avatar_color: '#4f6e7a',
      },
    ],
  })
  console.log('✓ Users')

  // Trip
  await prisma.trip.create({
    data: {
      id: TRIP,
      name: 'ทริปทดสอบ GoGun',
      destination: 'TH',
      duration_days: 7,
      proposed_start_date: new Date('2026-11-01'),
      confirmed_start_date: new Date('2026-11-01'),
      date_status: 'confirmed',
      currency: 'THB',
      invite_code: 'test-gogun-x2',
      organizer_id: U1,
    },
  })
  console.log('✓ Trip')

  // Members
  await prisma.tripMember.createMany({
    data: [
      { trip_id: TRIP, user_id: U1, role: 'organizer', status: 'joined', joined_at: new Date() },
      { trip_id: TRIP, user_id: U2, role: 'member',    status: 'joined', joined_at: new Date() },
    ],
  })
  console.log('✓ Members')

  // Itinerary: 1 day, 2 activities
  await prisma.itineraryDay.create({
    data: {
      id: D1,
      trip_id: TRIP,
      day_number: 1,
      date: new Date('2026-11-01'),
      label: 'Day 1 – Bangkok',
    },
  })
  await prisma.itineraryActivity.createMany({
    data: [
      { day_id: D1, time: '09:00', title: 'เช็คอินโรงแรม',   sort_order: 0 },
      { day_id: D1, time: '13:00', title: 'เที่ยว Chatuchak', sort_order: 1 },
    ],
  })
  console.log('✓ Itinerary')

  // Expenses: 2 expenses with even splits
  await prisma.expense.createMany({
    data: [
      { id: E1, trip_id: TRIP, name: 'ค่าโรงแรม',  category: 'accommodation', total_amount: 2000, currency: 'THB', paid_by_user_id: U1 },
      { id: E2, trip_id: TRIP, name: 'ข้าวกลางวัน', category: 'food',           total_amount: 600,  currency: 'THB', paid_by_user_id: U2 },
    ],
  })
  await prisma.expenseSplit.createMany({
    data: [
      { expense_id: E1, user_id: U1, amount: 1000 },
      { expense_id: E1, user_id: U2, amount: 1000 },
      { expense_id: E2, user_id: U1, amount: 300 },
      { expense_id: E2, user_id: U2, amount: 300 },
    ],
  })
  console.log('✓ Expenses')

  // Availability: both users, 7 days
  await prisma.availability.createMany({
    data: [
      { trip_id: TRIP, user_id: U1, date: new Date('2026-11-01'), status: 'available' },
      { trip_id: TRIP, user_id: U1, date: new Date('2026-11-02'), status: 'available' },
      { trip_id: TRIP, user_id: U1, date: new Date('2026-11-03'), status: 'uncertain' },
      { trip_id: TRIP, user_id: U1, date: new Date('2026-11-04'), status: 'available' },
      { trip_id: TRIP, user_id: U1, date: new Date('2026-11-05'), status: 'available' },
      { trip_id: TRIP, user_id: U1, date: new Date('2026-11-06'), status: 'available' },
      { trip_id: TRIP, user_id: U1, date: new Date('2026-11-07'), status: 'unavailable' },
      { trip_id: TRIP, user_id: U2, date: new Date('2026-11-01'), status: 'available' },
      { trip_id: TRIP, user_id: U2, date: new Date('2026-11-02'), status: 'available' },
      { trip_id: TRIP, user_id: U2, date: new Date('2026-11-03'), status: 'available' },
      { trip_id: TRIP, user_id: U2, date: new Date('2026-11-04'), status: 'uncertain' },
      { trip_id: TRIP, user_id: U2, date: new Date('2026-11-05'), status: 'available' },
      { trip_id: TRIP, user_id: U2, date: new Date('2026-11-06'), status: 'unavailable' },
      { trip_id: TRIP, user_id: U2, date: new Date('2026-11-07'), status: 'unavailable' },
    ],
  })
  console.log('✓ Availability')

  // Poll: 1 poll, 3 options, u1 votes option 1
  await prisma.poll.create({
    data: {
      id: POLL1,
      trip_id: TRIP,
      title: 'เลือกที่กินคืนแรก',
      subtitle: 'โหวตก่อน 31 Oct',
      close_date: new Date('2026-10-31T23:59:59+07:00'),
      status: 'open',
      created_by_user_id: U1,
    },
  })
  await prisma.pollOption.createMany({
    data: [
      { id: OPT1, poll_id: POLL1, text: 'ส้มตำนัว',   sort_order: 0 },
      { id: OPT2, poll_id: POLL1, text: 'ข้าวมันไก่',  sort_order: 1 },
      { id: OPT3, poll_id: POLL1, text: 'ชาบู MK',     sort_order: 2 },
    ],
  })
  await prisma.pollVote.create({
    data: { poll_id: POLL1, option_id: OPT1, user_id: U1 },
  })
  console.log('✓ Poll')

  // Checklist: 2 items
  await prisma.checklistItem.createMany({
    data: [
      { id: CL1, trip_id: TRIP, text: 'จองโรงแรม',       sort_order: 0 },
      { id: CL2, trip_id: TRIP, text: 'เตรียมเงินสดบาท', sort_order: 1 },
    ],
  })
  await prisma.checklistItemCheck.create({
    data: { item_id: CL1, user_id: U1 },
  })
  console.log('✓ Checklist')

  // Packing: 3 items (2 shared, 1 personal)
  await prisma.packingItem.createMany({
    data: [
      { id: PI1, trip_id: TRIP, text: 'ยากันยุง',         category: 'shared',   sort_order: 0 },
      { id: PI2, trip_id: TRIP, text: 'ครีมกันแดด',       category: 'shared',   sort_order: 1 },
      { id: PI3, trip_id: TRIP, text: 'พาสปอร์ต/บัตรปชช', category: 'personal', sort_order: 0 },
    ],
  })
  await prisma.packingItemAssignee.createMany({
    data: [
      { item_id: PI1, user_id: U1 },
      { item_id: PI2, user_id: U1 },
      { item_id: PI2, user_id: U2 },
    ],
  })
  await prisma.packingItemCheck.create({
    data: { item_id: PI1, user_id: U1 },
  })
  console.log('✓ Packing')

  // Wheel: 3 options
  await prisma.wheelOption.createMany({
    data: [
      { trip_id: TRIP, text: 'ส้มตำ',      color: '#c0613e', sort_order: 0 },
      { trip_id: TRIP, text: 'ข้าวมันไก่',  color: '#4f6e7a', sort_order: 1 },
      { trip_id: TRIP, text: 'ก๋วยเตี๋ยว', color: '#7b8b57', sort_order: 2 },
    ],
  })
  console.log('✓ Wheel')

  console.log('\nSeed complete!')
  console.log('Trip invite code: test-gogun-x2')
  console.log('Test accounts (password: password123):')
  console.log('  username: tonnam  — ต้นน้ำ (organizer)')
  console.log('  username: james   — เจมส์')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => { void prisma.$disconnect(); pool.end() })
