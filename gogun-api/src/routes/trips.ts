import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { requireTripMember, requireOrganizer } from '../middleware/trip'
import { ok, err, generateInviteCode } from '../lib/response'
import { signToken } from '../lib/jwt'

const router = Router()

// List my trips
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id

  const memberships = await prisma.tripMember.findMany({
    where: { user_id: userId, status: 'joined' },
    include: {
      trip: {
        include: {
          organizer: { select: { id: true, display_name: true, avatar_color: true } },
          members: {
            where: { status: { not: 'declined' } },
            include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
          },
        },
      },
    },
    orderBy: { joined_at: 'desc' },
  })

  return ok(res, memberships.map(m => m.trip))
})

// Public — join page preview
router.get('/join/:invite_code', async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { invite_code: req.params.invite_code },
    include: {
      organizer: { select: { id: true, display_name: true, avatar_color: true } },
      members: {
        where: { status: { not: 'declined' } },
        include: {
          user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
        },
      },
    },
  })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')
  return ok(res, trip)
})

// Join trip by invite code (auth required, no membership check)
router.post('/join/:invite_code', requireAuth, async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { invite_code: req.params.invite_code },
  })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')

  const userId = req.user!.id

  const existing = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id: trip.id, user_id: userId } },
  })

  if (existing) {
    if (existing.status === 'joined') {
      return ok(res, { trip_id: trip.id, already_member: true })
    }
    await prisma.tripMember.update({
      where: { id: existing.id },
      data: { status: 'joined', joined_at: new Date() },
    })
    return ok(res, { trip_id: trip.id, already_member: false }, 201)
  }

  await prisma.tripMember.create({
    data: {
      trip_id: trip.id,
      user_id: userId,
      role: 'member',
      status: 'joined',
      joined_at: new Date(),
    },
  })

  return ok(res, { trip_id: trip.id, already_member: false }, 201)
})

// Claim a guest member slot by tapping your name — no login required.
// Guest names stay selectable by anyone with the link (so a guest who lost
// their session can just tap their name again) until the guest links an
// email, which locks the name to that account permanently.
router.post('/join/:invite_code/claim/:memberId', async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { invite_code: req.params.invite_code },
  })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')

  const member = await prisma.tripMember.findUnique({
    where: { id: req.params.memberId },
    include: { user: { select: { is_guest: true } } },
  })
  if (!member || member.trip_id !== trip.id)
    return err(res, 404, 'NOT_FOUND', 'Member not found')
  if (!member.user.is_guest)
    return err(res, 409, 'CONFLICT', 'This name is linked to an account — log in to use it')

  const updated = await prisma.tripMember.update({
    where: { id: member.id },
    data: member.status === 'joined' ? {} : { status: 'joined', joined_at: new Date() },
    include: {
      user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
    },
  })

  const token = signToken(member.user_id)
  return ok(res, { token, trip_id: trip.id, member: updated })
})

// Create trip
router.post('/', requireAuth, async (req, res) => {
  const { name, destination, duration_days, proposed_start_date, currency } =
    req.body as {
      name?: string
      destination?: string
      duration_days?: number
      proposed_start_date?: string
      currency?: string
    }

  // Organizers must be real accounts — a guest who lost their session could
  // never get back into a trip they organize.
  if (req.user!.is_guest)
    return err(res, 403, 'FORBIDDEN', 'Link an email to your account before creating a trip')

  if (!name || !destination || !duration_days)
    return err(res, 400, 'VALIDATION_ERROR', 'name, destination, duration_days are required')

  // invite_code is unique — on the (rare) collision Prisma throws P2002, so
  // retry with a fresh code instead of surfacing a 500.
  const MAX_INVITE_ATTEMPTS = 3
  for (let attempt = 1; ; attempt++) {
    try {
      const trip = await prisma.trip.create({
        data: {
          name,
          destination,
          duration_days,
          proposed_start_date: proposed_start_date ? new Date(proposed_start_date) : null,
          currency: currency || 'JPY',
          invite_code: generateInviteCode(),
          organizer_id: req.user!.id,
          members: {
            create: {
              user_id: req.user!.id,
              role: 'organizer',
              status: 'joined',
              joined_at: new Date(),
            },
          },
        },
        include: { organizer: { select: { id: true, display_name: true, avatar_color: true } } },
      })

      return ok(res, trip, 201)
    } catch (e) {
      const isUniqueViolation = (e as { code?: string }).code === 'P2002'
      if (!isUniqueViolation || attempt >= MAX_INVITE_ATTEMPTS) throw e
    }
  }
})

// Get trip detail
router.get('/:tripId', requireAuth, requireTripMember, async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.tripId },
    include: {
      organizer: { select: { id: true, display_name: true, avatar_color: true } },
      members: {
        where: { status: { not: 'declined' } },
        include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
      },
    },
  })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')
  return ok(res, trip)
})

// Update trip
router.patch('/:tripId', requireAuth, requireTripMember, requireOrganizer, async (req, res) => {
  const {
    name,
    destination,
    duration_days,
    proposed_start_date,
    confirmed_start_date,
    date_status,
    currency,
    budget_per_person,
    allow_member_expenses,
    allow_member_itinerary_edit,
    allow_member_invite,
  } = req.body as Record<string, string | number | boolean | null | undefined>

  const trip = await prisma.trip.update({
    where: { id: req.params.tripId },
    data: {
      ...(name !== undefined && { name: String(name) }),
      ...(destination !== undefined && { destination: String(destination) }),
      ...(duration_days !== undefined && { duration_days: Number(duration_days) }),
      ...(proposed_start_date !== undefined && {
        proposed_start_date: proposed_start_date ? new Date(String(proposed_start_date)) : null,
      }),
      ...(confirmed_start_date !== undefined && {
        confirmed_start_date: confirmed_start_date
          ? new Date(String(confirmed_start_date))
          : null,
      }),
      ...(date_status !== undefined && { date_status: String(date_status) }),
      ...(currency !== undefined && { currency: String(currency) }),
      ...(budget_per_person !== undefined && {
        budget_per_person: budget_per_person === null || budget_per_person === '' ? null : Number(budget_per_person),
      }),
      ...(allow_member_expenses !== undefined && { allow_member_expenses: Boolean(allow_member_expenses) }),
      ...(allow_member_itinerary_edit !== undefined && {
        allow_member_itinerary_edit: Boolean(allow_member_itinerary_edit),
      }),
      ...(allow_member_invite !== undefined && { allow_member_invite: Boolean(allow_member_invite) }),
    },
  })
  return ok(res, trip)
})

// Transfer organizer role to another joined member
router.post('/:tripId/transfer-host', requireAuth, requireTripMember, requireOrganizer, async (req, res) => {
  const { new_organizer_user_id } = req.body as { new_organizer_user_id?: string }
  if (!new_organizer_user_id)
    return err(res, 400, 'VALIDATION_ERROR', 'new_organizer_user_id is required')

  const trip = await prisma.trip.findUnique({ where: { id: req.params.tripId } })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')

  const target = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id: req.params.tripId, user_id: new_organizer_user_id } },
  })
  if (!target || target.status !== 'joined')
    return err(res, 404, 'NOT_FOUND', 'Member not found or has not joined the trip')
  if (target.user_id === trip.organizer_id)
    return err(res, 400, 'VALIDATION_ERROR', 'This member is already the organizer')

  const targetUser = await prisma.user.findUnique({
    where: { id: new_organizer_user_id },
    select: { is_guest: true },
  })
  if (targetUser?.is_guest)
    return err(res, 403, 'FORBIDDEN', 'The new organizer must have linked an email to their account')

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({ where: { id: trip.id }, data: { organizer_id: new_organizer_user_id } }),
    prisma.tripMember.update({ where: { id: target.id }, data: { role: 'organizer' } }),
    prisma.tripMember.update({
      where: { trip_id_user_id: { trip_id: req.params.tripId, user_id: trip.organizer_id } },
      data: { role: 'member' },
    }),
  ])

  return ok(res, updatedTrip)
})

// Delete trip (cascades to all trip-scoped data)
router.delete('/:tripId', requireAuth, requireTripMember, requireOrganizer, async (req, res) => {
  await prisma.trip.delete({ where: { id: req.params.tripId } })
  return ok(res, { deleted: true })
})

export default router
