import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { requireTripMember, requireOrganizer } from '../middleware/trip'
import { ok, err, generateInviteCode } from '../lib/response'
import invitationsRouter from './invitations'
import { param } from '../lib/params'
import { DateStatus, TripType } from '../../generated/prisma/enums'

const TRIP_TYPES: string[] = ['one_day', 'overnight', 'long']
const TRIP_THEMES = ['lake', 'sakura', 'sunset', 'beach', 'autumn', 'windmill']

const router = Router()

// List my trips
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id

  const memberships = await prisma.tripMember.findMany({
    where: { user_id: userId, status: 'joined' },
    include: {
      trip: {
        include: {
          organizer: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
          members: {
            where: { status: { not: 'declined' } },
            include: { user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } } },
          },
        },
      },
    },
    orderBy: { joined_at: 'desc' },
  })

  return ok(res, memberships.map(m => m.trip))
})

router.use(invitationsRouter)

// Create trip
router.post('/', requireAuth, async (req, res) => {
  const { name, destination, icon, theme, trip_type, duration_days, proposed_start_date, currency } =
    req.body as {
      name?: string
      destination?: string
      icon?: string
      theme?: string
      trip_type?: string
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

  if (trip_type !== undefined && trip_type !== null && !TRIP_TYPES.includes(trip_type))
    return err(res, 400, 'VALIDATION_ERROR', `trip_type must be one of: ${TRIP_TYPES.join(', ')}`)

  // icon เก็บเป็น emoji สั้นๆ — กันส่ง string ยาวมาลง DB
  if (icon !== undefined && icon !== null && (typeof icon !== 'string' || icon.length > 16))
    return err(res, 400, 'VALIDATION_ERROR', 'icon must be a short emoji string')

  if (theme !== undefined && (typeof theme !== 'string' || !TRIP_THEMES.includes(theme)))
    return err(res, 400, 'VALIDATION_ERROR', `theme must be one of: ${TRIP_THEMES.join(', ')}`)

  // invite_code is unique — on the (rare) collision Prisma throws P2002, so
  // retry with a fresh code instead of surfacing a 500.
  const MAX_INVITE_ATTEMPTS = 3
  for (let attempt = 1; ; attempt++) {
    try {
      const trip = await prisma.trip.create({
        data: {
          name,
          destination,
          icon: icon ?? null,
          theme: theme ?? null,
          trip_type: (trip_type as TripType) ?? null,
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
        include: { organizer: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } } },
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
    where: { id: param(req, 'tripId') },
    include: {
      organizer: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
      members: {
        where: { status: { not: 'declined' } },
        include: { user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } } },
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
    icon,
    theme,
    trip_type,
    duration_days,
    proposed_start_date,
    confirmed_start_date,
    date_status,
    currency,
    budget_per_person,
    allow_member_expenses,
    allow_member_expense_edit,
    allow_member_itinerary_edit,
    allow_member_invite,
    allow_member_polls,
    allow_member_quests,
  } = req.body as Record<string, string | number | boolean | null | undefined>

  if (trip_type !== undefined && trip_type !== null && !TRIP_TYPES.includes(String(trip_type)))
    return err(res, 400, 'VALIDATION_ERROR', `trip_type must be one of: ${TRIP_TYPES.join(', ')}`)

  if (icon !== undefined && icon !== null && (typeof icon !== 'string' || icon.length > 16))
    return err(res, 400, 'VALIDATION_ERROR', 'icon must be a short emoji string')

  if (theme !== undefined && theme !== null && (typeof theme !== 'string' || !TRIP_THEMES.includes(theme)))
    return err(res, 400, 'VALIDATION_ERROR', `theme must be one of: ${TRIP_THEMES.join(', ')}`)

  const trip = await prisma.$transaction(async tx => {
  const updated = await tx.trip.update({
    where: { id: param(req, 'tripId') },
    data: {
      ...(name !== undefined && { name: String(name) }),
      ...(destination !== undefined && { destination: String(destination) }),
      ...(icon !== undefined && { icon: icon === null || icon === '' ? null : String(icon) }),
      ...(theme !== undefined && { theme: theme === null ? null : String(theme) }),
      ...(trip_type !== undefined && { trip_type: trip_type === null ? null : (trip_type as TripType) }),
      ...(duration_days !== undefined && { duration_days: Number(duration_days) }),
      ...(proposed_start_date !== undefined && {
        proposed_start_date: proposed_start_date ? new Date(String(proposed_start_date)) : null,
      }),
      ...(confirmed_start_date !== undefined && {
        confirmed_start_date: confirmed_start_date
          ? new Date(String(confirmed_start_date))
          : null,
      }),
      ...(date_status !== undefined && { date_status: String(date_status) as DateStatus }),
      ...(currency !== undefined && { currency: String(currency) }),
      ...(budget_per_person !== undefined && {
        budget_per_person: budget_per_person === null || budget_per_person === '' ? null : Number(budget_per_person),
      }),
      ...(allow_member_expenses !== undefined && { allow_member_expenses: Boolean(allow_member_expenses) }),
      ...(allow_member_expense_edit !== undefined && {
        allow_member_expense_edit: Boolean(allow_member_expense_edit),
      }),
      ...(allow_member_itinerary_edit !== undefined && {
        allow_member_itinerary_edit: Boolean(allow_member_itinerary_edit),
      }),
      ...(allow_member_invite !== undefined && { allow_member_invite: Boolean(allow_member_invite) }),
      ...(allow_member_polls !== undefined && { allow_member_polls: Boolean(allow_member_polls) }),
      ...(allow_member_quests !== undefined && { allow_member_quests: Boolean(allow_member_quests) }),
    },
  })
  const start = updated.confirmed_start_date || updated.proposed_start_date
  if (start && (confirmed_start_date !== undefined || proposed_start_date !== undefined)) {
    const days = await tx.itineraryDay.findMany({ where: { trip_id: updated.id } })
    for (const day of days) {
      const date = new Date(start)
      date.setUTCDate(date.getUTCDate() + day.day_number - 1)
      await tx.itineraryDay.update({ where: { id: day.id }, data: { date } })
    }
  }
  return updated
  })
  return ok(res, trip)
})

// Transfer organizer role to another joined member
router.post('/:tripId/transfer-host', requireAuth, requireTripMember, requireOrganizer, async (req, res) => {
  const { new_organizer_user_id } = req.body as { new_organizer_user_id?: string }
  if (!new_organizer_user_id)
    return err(res, 400, 'VALIDATION_ERROR', 'new_organizer_user_id is required')

  const trip = await prisma.trip.findUnique({ where: { id: param(req, 'tripId') } })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')

  const target = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id: param(req, 'tripId'), user_id: new_organizer_user_id } },
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
      where: { trip_id_user_id: { trip_id: param(req, 'tripId'), user_id: trip.organizer_id } },
      data: { role: 'member' },
    }),
  ])

  return ok(res, updatedTrip)
})

// Delete trip (cascades to all trip-scoped data)
router.delete('/:tripId', requireAuth, requireTripMember, requireOrganizer, async (req, res) => {
  await prisma.trip.delete({ where: { id: param(req, 'tripId') } })
  return ok(res, { deleted: true })
})

export default router
