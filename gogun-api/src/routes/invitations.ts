import { Router } from 'express'
import { randomUUID } from 'crypto'
import rateLimit from 'express-rate-limit'
import prisma from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { ok, err } from '../lib/response'
import { signGuestToken } from '../lib/jwt'
import { param } from '../lib/params'

const router = Router()
const userSelect = { id: true, display_name: true, avatar_color: true, is_guest: true }
router.use('/join/:invite_code', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, skip: req => req.method === 'GET', standardHeaders: true, legacyHeaders: false }))

router.get('/join/:invite_code', async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { invite_code: param(req, 'invite_code') }, include: {
    organizer: { select: userSelect },
    members: { where: { status: 'joined' }, include: { user: { select: userSelect } } },
  } })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'ไม่พบทริปจากลิงก์นี้')
  return ok(res, trip)
})

// Account mode always uses the authenticated account, never a name selected by the caller.
router.post('/join/:invite_code', requireAuth, async (req, res) => {
  if (req.body?.confirmed !== true) return err(res, 400, 'CONFIRMATION_REQUIRED', 'กรุณายืนยันเข้าร่วมทริป')
  if (req.user!.is_guest) return err(res, 403, 'LOGIN_REQUIRED', 'กรุณาล็อกอินด้วยบัญชีเพื่อใช้โหมดล็อกอิน')
  const trip = await prisma.trip.findUnique({ where: { invite_code: param(req, 'invite_code') } })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'ไม่พบทริปจากลิงก์นี้')
  await prisma.tripMember.upsert({
    where: { trip_id_user_id: { trip_id: trip.id, user_id: req.user!.id } },
    create: { trip_id: trip.id, user_id: req.user!.id, role: 'member', status: 'joined', joined_at: new Date() },
    update: { status: 'joined' },
  })
  return ok(res, { trip_id: trip.id })
})

router.post('/join/:invite_code/guest', async (req, res) => {
  if (req.body?.confirmed !== true) return err(res, 400, 'CONFIRMATION_REQUIRED', 'กรุณายืนยันเข้าร่วมทริป')
  const name = typeof req.body.display_name === 'string' ? req.body.display_name.trim() : ''
  if (!name || name.length > 50 || /[\u0000-\u001f\u007f]/.test(name)) return err(res, 400, 'VALIDATION_ERROR', 'กรุณาตั้งชื่อ 1–50 ตัวอักษร')
  // Serialize name checks per trip so simultaneous submissions cannot create duplicates.
  const result = await prisma.$transaction(async tx => {
    const trip = await tx.trip.findUnique({ where: { invite_code: param(req, 'invite_code') } })
    if (!trip) return { error: 'missing' } as const
    await tx.$queryRaw`SELECT id FROM trips WHERE id = ${trip.id}::uuid FOR UPDATE`
    const duplicate = await tx.tripMember.findFirst({ where: { trip_id: trip.id, status: 'joined', user: { display_name: { equals: name, mode: 'insensitive' } } } })
    if (duplicate) return { error: 'duplicate' } as const
    const unique = randomUUID()
    const user = await tx.user.create({ data: { username: `guest_${unique}`, email: `guest_${unique}@guests.gogun.app`, password_hash: null, display_name: name, avatar_color: '#3d7068', is_guest: true } })
    await tx.tripMember.create({ data: { trip_id: trip.id, user_id: user.id, role: 'member', status: 'joined', joined_at: new Date() } })
    return { trip_id: trip.id, user_id: user.id }
  })
  if ('error' in result) return result.error === 'missing' ? err(res, 404, 'NOT_FOUND', 'ไม่พบทริปจากลิงก์นี้') : err(res, 409, 'NAME_TAKEN', 'มีชื่อนี้แล้ว เลือกชื่อ Guest เดิมของคุณ หรือใช้ชื่ออื่น')
  return ok(res, { token: signGuestToken(result.user_id), trip_id: result.trip_id }, 201)
})

// Guest identities are explicitly shared with link holders. Linked accounts are locked.
router.post('/join/:invite_code/claim/:memberId', async (req, res) => {
  if (req.body?.confirmed !== true) return err(res, 400, 'CONFIRMATION_REQUIRED', 'กรุณายืนยันชื่อก่อนเข้าทริป')
  const trip = await prisma.trip.findUnique({ where: { invite_code: param(req, 'invite_code') } })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'ไม่พบทริปจากลิงก์นี้')
  const member = await prisma.tripMember.findFirst({ where: { id: param(req, 'memberId'), trip_id: trip.id, status: 'joined' }, include: { user: { select: userSelect } } })
  if (!member) return err(res, 404, 'NOT_FOUND', 'ไม่พบสมาชิก Guest ที่เข้าร่วมแล้ว')
  if (!member.user.is_guest) return err(res, 403, 'LOGIN_REQUIRED', 'ชื่อนี้ผูกบัญชีแล้ว ต้องล็อกอินด้วยบัญชีเจ้าของชื่อ')
  return ok(res, { token: signGuestToken(member.user_id), trip_id: trip.id })
})

// Legacy placeholder merging is intentionally retired; linking uses /auth/link instead.
router.post('/join/:invite_code/merge/:memberId', (_req, res) => err(res, 410, 'GONE', 'ใช้การเข้าร่วมด้วยบัญชี หรือ Guest แทนการรวมชื่อสมาชิก'))
export default router
