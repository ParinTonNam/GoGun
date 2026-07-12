import { Router } from 'express'
import prisma from '../lib/prisma'
import { ok, err } from '../lib/response'

const router = Router({ mergeParams: true })

router.get('/', async (req, res) => {
  const options = await prisma.wheelOption.findMany({
    where: { trip_id: req.params.tripId },
    orderBy: { sort_order: 'asc' },
  })
  return ok(res, options)
})

router.post('/', async (req, res) => {
  const { text, color, sort_order } = req.body as {
    text?: string
    color?: string
    sort_order?: number
  }
  if (!text || !color) return err(res, 400, 'VALIDATION_ERROR', 'text and color are required')

  const option = await prisma.wheelOption.create({
    data: {
      trip_id: req.params.tripId,
      text,
      color,
      sort_order: sort_order ?? 0,
    },
  })
  return ok(res, option, 201)
})

router.delete('/', async (req, res) => {
  await prisma.wheelOption.deleteMany({ where: { trip_id: req.params.tripId } })
  return ok(res, { deleted: true })
})

router.delete('/:optId', async (req, res) => {
  const option = await prisma.wheelOption.findFirst({
    where: { id: req.params.optId, trip_id: req.params.tripId },
  })
  if (!option) return err(res, 404, 'NOT_FOUND', 'Option not found')
  await prisma.wheelOption.delete({ where: { id: req.params.optId } })
  return ok(res, { deleted: true })
})

export default router
