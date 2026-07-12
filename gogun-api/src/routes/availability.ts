import { Router } from 'express'
import prisma from '../lib/prisma'
import { ok, err } from '../lib/response'
import { requireOrganizer } from '../middleware/trip'

const router = Router({ mergeParams: true })

const MAX_RANGE_DAYS = 62

// Organizer view — all members' availability by date. Accepts an optional
// ?start=YYYY-MM-DD&end=YYYY-MM-DD range (e.g. the month currently being
// browsed in the calendar); falls back to the trip's proposed window.
router.get('/', async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.tripId } })
  if (!trip) return err(res, 404, 'NOT_FOUND', 'Trip not found')

  const { start, end } = req.query as { start?: string; end?: string }

  const dates: Date[] = []
  if (start && end) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      return err(res, 400, 'VALIDATION_ERROR', 'start and end must be valid dates')
    for (
      let d = new Date(startDate);
      d <= endDate && dates.length < MAX_RANGE_DAYS;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d))
    }
  } else {
    const startDate = trip.confirmed_start_date || trip.proposed_start_date
    if (!startDate) return ok(res, [])
    for (let i = 0; i < trip.duration_days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }
  }

  const [allAvailability, members] = await Promise.all([
    prisma.availability.findMany({
      where: {
        trip_id: req.params.tripId,
        date: { in: dates },
      },
      include: {
        user: { select: { id: true, display_name: true, avatar_color: true } },
      },
    }),
    prisma.tripMember.findMany({
      where: { trip_id: req.params.tripId, status: 'joined' },
    }),
  ])

  const memberCount = members.length

  const result = dates.map(date => {
    const iso = date.toISOString().slice(0, 10)
    const dayAvail = allAvailability.filter(
      a => a.date.toISOString().slice(0, 10) === iso,
    )
    const available = dayAvail.filter(a => a.status === 'available').length
    const uncertain = dayAvail.filter(a => a.status === 'uncertain').length

    let variant: string
    if (available === memberCount && memberCount > 0) variant = 'all'
    else if (available > 0) variant = 'some'
    else if (uncertain > 0) variant = 'uncertain'
    else variant = 'default'

    return {
      date: iso,
      available,
      uncertain,
      member_count: memberCount,
      variant,
      members: dayAvail.map(a => ({
        user_id: a.user_id,
        display_name: a.user.display_name,
        avatar_color: a.user.avatar_color,
        status: a.status,
      })),
    }
  })

  return ok(res, result)
})

// Current user's availability
router.get('/me', async (req, res) => {
  const avail = await prisma.availability.findMany({
    where: { trip_id: req.params.tripId, user_id: req.user!.id },
    orderBy: { date: 'asc' },
  })
  return ok(res, avail.map(a => ({ ...a, date: a.date.toISOString().slice(0, 10) })))
})

// Upsert current user's availability
router.put('/', async (req, res) => {
  const entries = req.body as Array<{ date: string; status: string }>
  if (!Array.isArray(entries))
    return err(res, 400, 'VALIDATION_ERROR', 'body must be an array of { date, status }')

  const result = await prisma.$transaction(
    entries.map(({ date, status }) =>
      prisma.availability.upsert({
        where: {
          trip_id_user_id_date: {
            trip_id: req.params.tripId,
            user_id: req.user!.id,
            date: new Date(date),
          },
        },
        create: {
          trip_id: req.params.tripId,
          user_id: req.user!.id,
          date: new Date(date),
          status,
        },
        update: { status },
      }),
    ),
  )
  return ok(res, result.map(a => ({ ...a, date: a.date.toISOString().slice(0, 10) })))
})

// Organizer views a specific member's availability (to edit on their behalf)
router.get('/:userId', requireOrganizer, async (req, res) => {
  const member = await prisma.tripMember.findUnique({
    where: {
      trip_id_user_id: { trip_id: req.params.tripId, user_id: req.params.userId },
    },
  })
  if (!member) return err(res, 404, 'NOT_FOUND', 'Member not found')

  const avail = await prisma.availability.findMany({
    where: { trip_id: req.params.tripId, user_id: req.params.userId },
    orderBy: { date: 'asc' },
  })
  return ok(res, avail.map(a => ({ ...a, date: a.date.toISOString().slice(0, 10) })))
})

// Organizer sets availability on behalf of a specific member
router.put('/:userId', requireOrganizer, async (req, res) => {
  const member = await prisma.tripMember.findUnique({
    where: {
      trip_id_user_id: { trip_id: req.params.tripId, user_id: req.params.userId },
    },
  })
  if (!member) return err(res, 404, 'NOT_FOUND', 'Member not found')

  const entries = req.body as Array<{ date: string; status: string }>
  if (!Array.isArray(entries))
    return err(res, 400, 'VALIDATION_ERROR', 'body must be an array of { date, status }')

  const result = await prisma.$transaction(
    entries.map(({ date, status }) =>
      prisma.availability.upsert({
        where: {
          trip_id_user_id_date: {
            trip_id: req.params.tripId,
            user_id: req.params.userId,
            date: new Date(date),
          },
        },
        create: {
          trip_id: req.params.tripId,
          user_id: req.params.userId,
          date: new Date(date),
          status,
        },
        update: { status },
      }),
    ),
  )
  return ok(res, result.map(a => ({ ...a, date: a.date.toISOString().slice(0, 10) })))
})

export default router
