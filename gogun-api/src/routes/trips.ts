import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { requireTripMember, requireOrganizer } from '../middleware/trip'
import { ok, err, generateInviteCode } from '../lib/response'
import { signToken } from '../lib/jwt'
import { param } from '../lib/params'
import { DateStatus, TripType } from '../../generated/prisma/enums'

const TRIP_TYPES: string[] = ['one_day', 'overnight', 'long']

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
    where: { invite_code: param(req, 'invite_code') },
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
    where: { invite_code: param(req, 'invite_code') },
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
    where: { invite_code: param(req, 'invite_code') },
  })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')

  const member = await prisma.tripMember.findUnique({
    where: { id: param(req, 'memberId') },
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

// Merge a guest placeholder into the CURRENT (real, logged-in) account.
// Fixes the "I was pre-added by name, then joining created a second copy of me"
// duplicate: instead of a parallel membership, the guest slot's trip-scoped data
// (expenses, splits, transfers, availability, votes, packing/checklist) is
// reassigned to the caller, the guest membership is removed, and the orphan
// guest user is deleted. Unique-constraint clashes are resolved in favour of the
// caller's existing rows so the merge never violates an invariant.
router.post('/join/:invite_code/merge/:memberId', requireAuth, async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { invite_code: param(req, 'invite_code') },
  })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')

  const guestMember = await prisma.tripMember.findUnique({
    where: { id: param(req, 'memberId') },
    include: { user: { select: { id: true, is_guest: true } } },
  })
  if (!guestMember || guestMember.trip_id !== trip.id)
    return err(res, 404, 'NOT_FOUND', 'Member not found')
  if (!guestMember.user.is_guest)
    return err(res, 409, 'CONFLICT', 'This name is already linked to an account')

  const realId = req.user!.id
  const guestId = guestMember.user_id
  if (realId === guestId)
    return err(res, 400, 'VALIDATION_ERROR', 'Cannot merge a member into itself')

  await prisma.$transaction(async tx => {
    // Expense payer — no unique on (trip, payer), safe bulk reassign
    await tx.expense.updateMany({
      where: { trip_id: trip.id, paid_by_user_id: guestId },
      data: { paid_by_user_id: realId },
    })

    // Expense splits — unique(expense_id, user_id): if the caller already has a
    // split on the same expense, fold the guest's amount in and drop the guest row
    const splits = await tx.expenseSplit.findMany({
      where: { user_id: guestId, expense: { trip_id: trip.id } },
    })
    for (const s of splits) {
      const clash = await tx.expenseSplit.findUnique({
        where: { expense_id_user_id: { expense_id: s.expense_id, user_id: realId } },
      })
      if (clash) {
        await tx.expenseSplit.update({ where: { id: clash.id }, data: { amount: { increment: s.amount } } })
        await tx.expenseSplit.delete({ where: { id: s.id } })
      } else {
        await tx.expenseSplit.update({ where: { id: s.id }, data: { user_id: realId } })
      }
    }

    // Transfer slips — no unique, bulk reassign both directions
    await tx.transferSlip.updateMany({ where: { trip_id: trip.id, from_user_id: guestId }, data: { from_user_id: realId } })
    await tx.transferSlip.updateMany({ where: { trip_id: trip.id, to_user_id: guestId }, data: { to_user_id: realId } })

    // Availability — unique(trip, user, date): keep caller's own vote on a clash
    const avail = await tx.availability.findMany({ where: { trip_id: trip.id, user_id: guestId } })
    for (const a of avail) {
      const clash = await tx.availability.findUnique({
        where: { trip_id_user_id_date: { trip_id: trip.id, user_id: realId, date: a.date } },
      })
      if (clash) await tx.availability.delete({ where: { id: a.id } })
      else await tx.availability.update({ where: { id: a.id }, data: { user_id: realId } })
    }

    // Poll votes — unique(poll, user): keep caller's own vote on a clash
    const votes = await tx.pollVote.findMany({ where: { user_id: guestId, poll: { trip_id: trip.id } } })
    for (const v of votes) {
      const clash = await tx.pollVote.findUnique({
        where: { poll_id_user_id: { poll_id: v.poll_id, user_id: realId } },
      })
      if (clash) await tx.pollVote.delete({ where: { id: v.id } })
      else await tx.pollVote.update({ where: { id: v.id }, data: { user_id: realId } })
    }

    // Packing assignees — PK(item, user)
    const assignees = await tx.packingItemAssignee.findMany({ where: { user_id: guestId, item: { trip_id: trip.id } } })
    for (const pa of assignees) {
      const clash = await tx.packingItemAssignee.findUnique({
        where: { item_id_user_id: { item_id: pa.item_id, user_id: realId } },
      })
      if (clash) await tx.packingItemAssignee.delete({ where: { item_id_user_id: { item_id: pa.item_id, user_id: guestId } } })
      else await tx.packingItemAssignee.update({ where: { item_id_user_id: { item_id: pa.item_id, user_id: guestId } }, data: { user_id: realId } })
    }

    // Packing checks — PK(item, user)
    const packChecks = await tx.packingItemCheck.findMany({ where: { user_id: guestId, item: { trip_id: trip.id } } })
    for (const c of packChecks) {
      const clash = await tx.packingItemCheck.findUnique({
        where: { item_id_user_id: { item_id: c.item_id, user_id: realId } },
      })
      if (clash) await tx.packingItemCheck.delete({ where: { item_id_user_id: { item_id: c.item_id, user_id: guestId } } })
      else await tx.packingItemCheck.update({ where: { item_id_user_id: { item_id: c.item_id, user_id: guestId } }, data: { user_id: realId } })
    }

    // Checklist checks — PK(item, user)
    const listChecks = await tx.checklistItemCheck.findMany({ where: { user_id: guestId, item: { trip_id: trip.id } } })
    for (const c of listChecks) {
      const clash = await tx.checklistItemCheck.findUnique({
        where: { item_id_user_id: { item_id: c.item_id, user_id: realId } },
      })
      if (clash) await tx.checklistItemCheck.delete({ where: { item_id_user_id: { item_id: c.item_id, user_id: guestId } } })
      else await tx.checklistItemCheck.update({ where: { item_id_user_id: { item_id: c.item_id, user_id: guestId } }, data: { user_id: realId } })
    }

    // Memberships — unique(trip, user). If the caller already has a membership,
    // drop the guest one and make sure the caller is joined; otherwise hand the
    // guest membership over to the caller.
    const realMember = await tx.tripMember.findUnique({
      where: { trip_id_user_id: { trip_id: trip.id, user_id: realId } },
    })
    if (realMember) {
      await tx.tripMember.delete({ where: { id: guestMember.id } })
      if (realMember.status !== 'joined')
        await tx.tripMember.update({ where: { id: realMember.id }, data: { status: 'joined', joined_at: new Date() } })
    } else {
      await tx.tripMember.update({
        where: { id: guestMember.id },
        data: { user_id: realId, status: 'joined', joined_at: guestMember.joined_at ?? new Date() },
      })
    }
  })

  // Guest placeholders belong to a single trip, so after reassigning everything
  // the account is unreferenced — remove it. Best-effort: if some stray FK still
  // holds it, leave the orphan rather than fail the (already committed) merge.
  try {
    await prisma.user.delete({ where: { id: guestId } })
  } catch (e) {
    console.error('merge: could not delete orphan guest user', guestId, e)
  }

  return ok(res, { trip_id: trip.id, merged: true })
})

// Create trip
router.post('/', requireAuth, async (req, res) => {
  const { name, destination, icon, trip_type, duration_days, proposed_start_date, currency } =
    req.body as {
      name?: string
      destination?: string
      icon?: string
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
    where: { id: param(req, 'tripId') },
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
    icon,
    trip_type,
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

  if (trip_type !== undefined && trip_type !== null && !TRIP_TYPES.includes(String(trip_type)))
    return err(res, 400, 'VALIDATION_ERROR', `trip_type must be one of: ${TRIP_TYPES.join(', ')}`)

  if (icon !== undefined && icon !== null && (typeof icon !== 'string' || icon.length > 16))
    return err(res, 400, 'VALIDATION_ERROR', 'icon must be a short emoji string')

  const trip = await prisma.trip.update({
    where: { id: param(req, 'tripId') },
    data: {
      ...(name !== undefined && { name: String(name) }),
      ...(destination !== undefined && { destination: String(destination) }),
      ...(icon !== undefined && { icon: icon === null || icon === '' ? null : String(icon) }),
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
