import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireOrganizer } from '../middleware/trip'
import { ok, err } from '../lib/response'
import { param } from '../lib/params'
import { TripMemberRole, TripMemberStatus } from '../../generated/prisma/enums'

const router = Router({ mergeParams: true })

// ชื่อที่แสดงต้องไม่ซ้ำภายในทริปเดียวกัน (เทียบแบบไม่สนตัวพิมพ์ใหญ่เล็ก)
// excludeUserId ใช้ตอน rename เพื่อไม่นับตัวสมาชิกเองว่าชนกับตัวเอง
async function nameTakenInTrip(tripId: string, name: string, excludeUserId?: string) {
  return prisma.tripMember.findFirst({
    where: {
      trip_id: tripId,
      status: { not: 'declined' },
      ...(excludeUserId ? { user_id: { not: excludeUserId } } : {}),
      user: { display_name: { equals: name, mode: 'insensitive' } },
    },
  })
}

// List members
router.get('/', async (req, res) => {
  const members = await prisma.tripMember.findMany({
    where: { trip_id: param(req, 'tripId') },
    include: {
      user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
    },
    orderBy: { joined_at: 'asc' },
  })
  return ok(res, members)
})

// Members join themselves through the invitation flow.
router.post('/', (_req, res) => err(res, 410, 'GONE', 'เข้าร่วมผ่านลิงก์เชิญเท่านั้น'))
router.post('/add', (_req, res) => err(res, 410, 'GONE', 'ส่งลิงก์ให้เพื่อนเข้าร่วมและตั้งชื่อเอง'))

// Update member status/role, or rename a guest member (organizer only)
router.patch('/:userId', requireOrganizer, async (req, res) => {
  const { status, role, display_name } = req.body as {
    status?: TripMemberStatus
    role?: TripMemberRole
    display_name?: string
  }
  const member = await prisma.tripMember.findUnique({
    where: {
      trip_id_user_id: { trip_id: param(req, 'tripId'), user_id: param(req, 'userId') },
    },
    include: { user: { select: { is_guest: true } } },
  })
  if (!member) return err(res, 404, 'NOT_FOUND', 'Member not found')

  if (display_name !== undefined) {
    const trimmed = display_name.trim()
    if (!trimmed) return err(res, 400, 'VALIDATION_ERROR', 'display_name cannot be empty')
    if (!member.user.is_guest)
      return err(res, 403, 'FORBIDDEN', 'Only guest members added by the organizer can be renamed here')
    if (await nameTakenInTrip(param(req, 'tripId'), trimmed, member.user_id))
      return err(res, 409, 'CONFLICT', 'มีสมาชิกชื่อนี้ในทริปแล้ว โปรดใช้ชื่ออื่น')
    await prisma.user.update({ where: { id: member.user_id }, data: { display_name: trimmed } })
  }

  const updated = await prisma.tripMember.update({
    where: { id: member.id },
    data: {
      ...(status !== undefined && { status }),
      ...(role !== undefined && { role }),
    },
    include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
  })
  return ok(res, updated)
})

// Remove member (organizer only)
router.delete('/:userId', requireOrganizer, async (req, res) => {
  const member = await prisma.tripMember.findUnique({
    where: {
      trip_id_user_id: { trip_id: param(req, 'tripId'), user_id: param(req, 'userId') },
    },
  })
  if (!member) return err(res, 404, 'NOT_FOUND', 'Member not found')
  if (member.role === 'organizer')
    return err(res, 403, 'FORBIDDEN', 'Cannot remove the trip organizer')
  await prisma.tripMember.delete({ where: { id: member.id } })
  return ok(res, { deleted: true })
})

export default router
