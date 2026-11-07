import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { requireTripMember, requireOrganizer } from '../middleware/trip'
import { ok, err, generateInviteCode } from '../lib/response'
import { param } from '../lib/params'
import type { Prisma } from '../../generated/prisma/client'

const router = Router()
router.use((req, res, next) => {
  if (req.path.startsWith('/join/')) return next('router')
  return requireAuth(req, res, next)
})
const snapshotInclude = { itinerary_days: { include: { activities: true } }, packing_items: true, checklist_items: true } as const
router.get('/my-tasks', async (req, res) => {
  const userId = req.user!.id
  const trips = await prisma.trip.findMany({ where: { archived_at: null, members: { some: { user_id: userId, status: 'joined' } } }, include: {
    availability: { where: { user_id: userId, date: { gte: new Date(new Date().toISOString().slice(0, 10)) } }, take: 1 },
    polls: { where: { status: 'open', OR: [{ close_date: null }, { close_date: { gt: new Date() } }], votes: { none: { user_id: userId } } } },
    packing_items: { where: { assignees: { some: { user_id: userId } }, checks: { none: { user_id: userId } } } },
    quests: { where: { closed: false }, include: { progress: { where: { user_id: userId } } } },
  } })
  return ok(res, trips.flatMap(t => {
    const tasks: { trip_id: string; trip_name: string; title: string; path: string; kind: string }[] = []
    const add = (title: string, path: string, kind: string) => tasks.push({ trip_id: t.id, trip_name: t.name, title, path, kind })
    const end = t.confirmed_start_date ? t.confirmed_start_date.getTime() + t.duration_days * 86400000 : Infinity
    if (end < Date.now()) return tasks
    if (t.date_status === 'proposed' && !t.availability.length) add('ตอบวันว่างของฉัน', 'availability', 'availability')
    for (const p of t.polls) add(p.title, 'tools/vote', 'poll')
    for (const p of t.packing_items) add(`เตรียม ${p.text}`, 'tools/packing', 'packing')
    for (const q of t.quests) if ((q.progress[0]?.completed.length ?? 0) < q.targets.length) add(`เควส: ${q.title}`, 'tools/quests', 'quest')
    return tasks
  }))
})
type Source = Prisma.TripGetPayload<{ include: typeof snapshotInclude }>

// Only reusable planning data is captured, never members, money or responses.
function snapshot(t: Source) {
  return { name: t.name, destination: t.destination, icon: t.icon, theme: t.theme, trip_type: t.trip_type,
    duration_days: t.duration_days, currency: t.currency, budget_per_person: t.budget_per_person?.toString() ?? null,
    allow_member_expenses: t.allow_member_expenses, allow_member_itinerary_edit: t.allow_member_itinerary_edit, allow_member_invite: t.allow_member_invite,
    days: t.itinerary_days.map(d => ({ day_number: d.day_number, label: d.label, activities: d.activities.map(a => ({ time: a.time, title: a.title, sort_order: a.sort_order, tags: a.tags })) })),
    packing: t.packing_items.map(p => ({ text: p.text, category: p.category, sort_order: p.sort_order })),
    checklist: t.checklist_items.map(c => ({ text: c.text, sort_order: c.sort_order })) }
}
type Snapshot = ReturnType<typeof snapshot>
async function createFrom(s: Snapshot, userId: string, name: string) {
  return prisma.trip.create({ data: {
    name, destination: s.destination, icon: s.icon, theme: s.theme ?? null, trip_type: s.trip_type, duration_days: s.duration_days,
    currency: s.currency, budget_per_person: s.budget_per_person,
    allow_member_expenses: s.allow_member_expenses, allow_member_itinerary_edit: s.allow_member_itinerary_edit, allow_member_invite: s.allow_member_invite,
    organizer_id: userId, invite_code: generateInviteCode(),
    members: { create: { user_id: userId, role: 'organizer', status: 'joined', joined_at: new Date() } },
    itinerary_days: { create: s.days.map(d => ({ day_number: d.day_number, label: d.label,
      date: new Date(Date.UTC(2000, 0, d.day_number)), activities: { create: d.activities } })) },
    packing_items: { create: s.packing }, checklist_items: { create: s.checklist },
  } })
}
router.get('/templates', async (req, res) => ok(res, await prisma.tripTemplate.findMany({ where: { user_id: req.user!.id }, select: { id: true, name: true, created_at: true }, orderBy: { created_at: 'desc' } })))
router.post('/templates/:templateId/use', async (req, res) => {
  if (req.user!.is_guest) return err(res, 403, 'FORBIDDEN', 'ผูกบัญชีก่อนสร้างทริปใหม่')
  const t = await prisma.tripTemplate.findFirst({ where: { id: param(req, 'templateId'), user_id: req.user!.id } })
  if (!t) return err(res, 404, 'NOT_FOUND', 'Template not found')
  return ok(res, await createFrom(t.snapshot as unknown as Snapshot, req.user!.id, t.name), 201)
})
router.delete('/templates/:templateId', async (req, res) => {
  await prisma.tripTemplate.deleteMany({ where: { id: param(req, 'templateId'), user_id: req.user!.id } })
  return ok(res, { deleted: true })
})
router.post('/:tripId/copy', requireTripMember, async (req, res) => {
  if (req.user!.is_guest) return err(res, 403, 'FORBIDDEN', 'ผูกบัญชีก่อนสร้างทริปใหม่')
  const t = await prisma.trip.findUniqueOrThrow({ where: { id: param(req, 'tripId') }, include: snapshotInclude })
  return ok(res, await createFrom(snapshot(t), req.user!.id, `${t.name} · ทริปใหม่`), 201)
})
router.post('/:tripId/template', requireTripMember, async (req, res) => {
  const t = await prisma.trip.findUniqueOrThrow({ where: { id: param(req, 'tripId') }, include: snapshotInclude })
  const name = req.body.name
  if (typeof name !== 'string' || !name.trim() || name.length > 100) return err(res, 400, 'VALIDATION_ERROR', 'กรุณาตั้งชื่อเทมเพลตไม่เกิน 100 ตัวอักษร')
  return ok(res, await prisma.tripTemplate.create({ data: { user_id: req.user!.id, name: name.trim(), snapshot: snapshot(t) } }), 201)
})
router.patch('/:tripId/planning-settings', requireTripMember, requireOrganizer, async (req, res) => {
  const { availability_deadline, archived } = req.body
  if (availability_deadline !== undefined && availability_deadline !== null && (typeof availability_deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(availability_deadline) || !Number.isFinite(Date.parse(availability_deadline)) || new Date(availability_deadline).toISOString().slice(0, 10) !== availability_deadline)) return err(res, 400, 'VALIDATION_ERROR', 'วันที่ไม่ถูกต้อง')
  if (archived !== undefined && typeof archived !== 'boolean') return err(res, 400, 'VALIDATION_ERROR', 'archived must be boolean')
  return ok(res, await prisma.trip.update({ where: { id: param(req, 'tripId') }, data: {
    ...(availability_deadline !== undefined && { availability_deadline: availability_deadline ? new Date(availability_deadline) : null }),
    ...(archived !== undefined && { archived_at: archived ? new Date() : null }),
  } }))
})

router.use('/:tripId/comments/:targetType/:targetId', requireTripMember, async (req, res, next) => {
  const tripId = param(req, 'tripId'), id = param(req, 'targetId'), type = param(req, 'targetType')
  const target = type === 'expense' ? await prisma.expense.findFirst({ where: { id, trip_id: tripId } })
    : type === 'activity' ? await prisma.itineraryActivity.findFirst({ where: { id, day: { trip_id: tripId } } })
    : type === 'poll' ? await prisma.poll.findFirst({ where: { id, trip_id: tripId } }) : null
  if (!target) return err(res, 404, 'NOT_FOUND', 'Item not found')
  next()
})
router.get('/:tripId/comments/:targetType/:targetId', async (req, res) => ok(res, await prisma.itemComment.findMany({
  where: { trip_id: param(req, 'tripId'), target_type: param(req, 'targetType'), target_id: param(req, 'targetId') },
  include: { user: { select: { id: true, display_name: true } } }, orderBy: { created_at: 'asc' }, take: 200,
})))
router.post('/:tripId/comments/:targetType/:targetId', async (req, res) => {
  const text = req.body.text
  if (typeof text !== 'string' || !text.trim() || text.length > 500) return err(res, 400, 'VALIDATION_ERROR', 'คอมเมนต์ต้องมี 1–500 ตัวอักษร')
  return ok(res, await prisma.itemComment.create({ data: { trip_id: param(req, 'tripId'), target_type: param(req, 'targetType'), target_id: param(req, 'targetId'), user_id: req.user!.id, text: text.trim() }, include: { user: { select: { id: true, display_name: true } } } }), 201)
})
export default router
