import { Router } from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { requireOrganizer } from '../middleware/trip'
import { ok, err } from '../lib/response'

const router = Router({ mergeParams: true })

const GUEST_COLORS = [
  '#4f6e7a', '#7b8b57', '#8a6e9e', '#c0613e', '#3d7068', '#a8763e',
]
function randomGuestColor(): string {
  return GUEST_COLORS[Math.floor(Math.random() * GUEST_COLORS.length)]
}

// List members
router.get('/', async (req, res) => {
  const members = await prisma.tripMember.findMany({
    where: { trip_id: req.params.tripId },
    include: {
      user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
    },
    orderBy: { joined_at: 'asc' },
  })
  return ok(res, members)
})

// Join trip (member selects display name on join page)
router.post('/', async (req, res) => {
  const { display_name, avatar_color } = req.body as {
    display_name?: string
    avatar_color?: string
  }

  // Update user profile if provided
  if (display_name || avatar_color) {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(display_name && { display_name }),
        ...(avatar_color && { avatar_color }),
      },
    })
  }

  const existing = await prisma.tripMember.findUnique({
    where: {
      trip_id_user_id: { trip_id: req.params.tripId, user_id: req.user!.id },
    },
  })

  if (existing) {
    if (existing.status === 'joined')
      return err(res, 409, 'CONFLICT', 'Already a member of this trip')

    const member = await prisma.tripMember.update({
      where: { id: existing.id },
      data: { status: 'joined', joined_at: new Date() },
      include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
    })
    return ok(res, member, 201)
  }

  const member = await prisma.tripMember.create({
    data: {
      trip_id: req.params.tripId,
      user_id: req.user!.id,
      role: 'member',
      status: 'joined',
      joined_at: new Date(),
    },
    include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
  })
  return ok(res, member, 201)
})

// Add a member by nickname (organizer only) — creates a placeholder guest
// account the trip member can later claim by joining via the invite link.
router.post('/add', requireOrganizer, async (req, res) => {
  const { display_name } = req.body as { display_name?: string }
  const name = display_name?.trim()
  if (!name) return err(res, 400, 'VALIDATION_ERROR', 'display_name is required')

  const guestId = randomUUID()
  const password_hash = await bcrypt.hash(randomUUID(), 10)
  const guest = await prisma.user.create({
    data: {
      username: `guest_${guestId}`,
      email: `guest_${guestId}@guests.gogun.app`,
      password_hash,
      display_name: name,
      avatar_color: randomGuestColor(),
      is_guest: true,
    },
  })

  const member = await prisma.tripMember.create({
    data: {
      trip_id: req.params.tripId,
      user_id: guest.id,
      role: 'member',
      status: 'invited',
    },
    include: {
      user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
    },
  })
  return ok(res, member, 201)
})

// Update member status/role, or rename a guest member (organizer only)
router.patch('/:userId', requireOrganizer, async (req, res) => {
  const { status, role, display_name } = req.body as {
    status?: string
    role?: string
    display_name?: string
  }
  const member = await prisma.tripMember.findUnique({
    where: {
      trip_id_user_id: { trip_id: req.params.tripId, user_id: req.params.userId },
    },
    include: { user: { select: { is_guest: true } } },
  })
  if (!member) return err(res, 404, 'NOT_FOUND', 'Member not found')

  if (display_name !== undefined) {
    const trimmed = display_name.trim()
    if (!trimmed) return err(res, 400, 'VALIDATION_ERROR', 'display_name cannot be empty')
    if (!member.user.is_guest)
      return err(res, 403, 'FORBIDDEN', 'Only guest members added by the organizer can be renamed here')
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
      trip_id_user_id: { trip_id: req.params.tripId, user_id: req.params.userId },
    },
  })
  if (!member) return err(res, 404, 'NOT_FOUND', 'Member not found')
  if (member.role === 'organizer')
    return err(res, 403, 'FORBIDDEN', 'Cannot remove the trip organizer')
  await prisma.tripMember.delete({ where: { id: member.id } })
  return ok(res, { deleted: true })
})

export default router
