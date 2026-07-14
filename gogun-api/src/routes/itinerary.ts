import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireOrganizer } from '../middleware/trip'
import { ok, err } from '../lib/response'
import { param } from '../lib/params'

const router = Router({ mergeParams: true })

// List all days + activities
router.get('/', async (req, res) => {
  const days = await prisma.itineraryDay.findMany({
    where: { trip_id: param(req, 'tripId') },
    include: {
      activities: { orderBy: { sort_order: 'asc' } },
    },
    orderBy: { day_number: 'asc' },
  })
  return ok(res, days)
})

// Swap two days' order (3-step to avoid unique constraint on day_number)
router.post('/days/swap', requireOrganizer, async (req, res) => {
  const { day_id_a, day_id_b } = req.body as { day_id_a?: string; day_id_b?: string }
  if (!day_id_a || !day_id_b)
    return err(res, 400, 'VALIDATION_ERROR', 'day_id_a and day_id_b are required')

  const [dayA, dayB] = await Promise.all([
    prisma.itineraryDay.findFirst({ where: { id: day_id_a, trip_id: param(req, 'tripId') } }),
    prisma.itineraryDay.findFirst({ where: { id: day_id_b, trip_id: param(req, 'tripId') } }),
  ])
  if (!dayA || !dayB) return err(res, 404, 'NOT_FOUND', 'Day not found')

  await prisma.$transaction([
    prisma.itineraryDay.update({ where: { id: day_id_a }, data: { day_number: -1 } }),
    prisma.itineraryDay.update({ where: { id: day_id_b }, data: { day_number: dayA.day_number } }),
    prisma.itineraryDay.update({ where: { id: day_id_a }, data: { day_number: dayB.day_number } }),
  ])
  return ok(res, { swapped: true })
})

// Add day
router.post('/days', requireOrganizer, async (req, res) => {
  const { day_number, date, label } = req.body as {
    day_number?: number
    date?: string
    label?: string
  }
  if (!day_number || !date || !label)
    return err(res, 400, 'VALIDATION_ERROR', 'day_number, date, label are required')

  const day = await prisma.itineraryDay.create({
    data: {
      trip_id: param(req, 'tripId'),
      day_number,
      date: new Date(date),
      label,
    },
    include: { activities: true },
  })
  return ok(res, day, 201)
})

// Update day
router.patch('/days/:dayId', requireOrganizer, async (req, res) => {
  const { label, date, day_number } = req.body as {
    label?: string
    date?: string
    day_number?: number
  }
  const day = await prisma.itineraryDay.findFirst({
    where: { id: param(req, 'dayId'), trip_id: param(req, 'tripId') },
  })
  if (!day) return err(res, 404, 'NOT_FOUND', 'Day not found')

  const updated = await prisma.itineraryDay.update({
    where: { id: param(req, 'dayId') },
    data: {
      ...(label !== undefined && { label }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(day_number !== undefined && { day_number }),
    },
    include: { activities: { orderBy: { sort_order: 'asc' } } },
  })
  return ok(res, updated)
})

// Add activity to day
router.post('/days/:dayId/activities', requireOrganizer, async (req, res) => {
  const { time, title, sort_order } = req.body as {
    time?: string
    title?: string
    sort_order?: number
  }
  if (!time || !title)
    return err(res, 400, 'VALIDATION_ERROR', 'time and title are required')

  const day = await prisma.itineraryDay.findFirst({
    where: { id: param(req, 'dayId'), trip_id: param(req, 'tripId') },
  })
  if (!day) return err(res, 404, 'NOT_FOUND', 'Day not found')

  const activity = await prisma.itineraryActivity.create({
    data: { day_id: param(req, 'dayId'), time, title, sort_order: sort_order ?? 0 },
  })
  return ok(res, activity, 201)
})

// Edit activity
router.patch('/activities/:actId', requireOrganizer, async (req, res) => {
  const { time, title, sort_order } = req.body as {
    time?: string
    title?: string
    sort_order?: number
  }
  const activity = await prisma.itineraryActivity.findUnique({
    where: { id: param(req, 'actId') },
    include: { day: true },
  })
  if (!activity || activity.day.trip_id !== param(req, 'tripId'))
    return err(res, 404, 'NOT_FOUND', 'Activity not found')

  const updated = await prisma.itineraryActivity.update({
    where: { id: param(req, 'actId') },
    data: {
      ...(time !== undefined && { time }),
      ...(title !== undefined && { title }),
      ...(sort_order !== undefined && { sort_order }),
    },
  })
  return ok(res, updated)
})

// Delete activity
router.delete('/activities/:actId', requireOrganizer, async (req, res) => {
  const activity = await prisma.itineraryActivity.findUnique({
    where: { id: param(req, 'actId') },
    include: { day: true },
  })
  if (!activity || activity.day.trip_id !== param(req, 'tripId'))
    return err(res, 404, 'NOT_FOUND', 'Activity not found')

  await prisma.itineraryActivity.delete({ where: { id: param(req, 'actId') } })
  return ok(res, { deleted: true })
})

// Reorder activity
router.patch('/activities/:actId/reorder', requireOrganizer, async (req, res) => {
  const { sort_order } = req.body as { sort_order?: number }
  if (sort_order === undefined)
    return err(res, 400, 'VALIDATION_ERROR', 'sort_order is required')

  const activity = await prisma.itineraryActivity.findUnique({
    where: { id: param(req, 'actId') },
    include: { day: true },
  })
  if (!activity || activity.day.trip_id !== param(req, 'tripId'))
    return err(res, 404, 'NOT_FOUND', 'Activity not found')

  const updated = await prisma.itineraryActivity.update({
    where: { id: param(req, 'actId') },
    data: { sort_order },
  })
  return ok(res, updated)
})

export default router
