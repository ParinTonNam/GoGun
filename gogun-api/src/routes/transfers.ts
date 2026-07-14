import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireOrganizer } from '../middleware/trip'
import { ok, err } from '../lib/response'
import { param } from '../lib/params'

const router = Router({ mergeParams: true })

const memberSelect = { id: true, display_name: true, avatar_color: true }

// List transfers
router.get('/', async (req, res) => {
  const transfers = await prisma.transferSlip.findMany({
    where: { trip_id: param(req, 'tripId') },
    include: {
      from_user: { select: memberSelect },
      to_user: { select: memberSelect },
    },
  })
  return ok(res, transfers.map(serializeTransfer))
})

// Confirm receipt (organizer only)
router.patch('/:transferId/confirm', requireOrganizer, async (req, res) => {
  const transfer = await prisma.transferSlip.findFirst({
    where: { id: param(req, 'transferId'), trip_id: param(req, 'tripId') },
  })
  if (!transfer) return err(res, 404, 'NOT_FOUND', 'Transfer not found')

  const updated = await prisma.transferSlip.update({
    where: { id: param(req, 'transferId') },
    data: { status: 'confirmed', confirmed_at: new Date() },
    include: {
      from_user: { select: memberSelect },
      to_user: { select: memberSelect },
    },
  })
  return ok(res, serializeTransfer(updated))
})

function serializeTransfer(t: {
  id: string
  trip_id: string
  from_user_id: string
  to_user_id: string
  amount: { toString(): string }
  currency: string
  status: string
  confirmed_at: Date | null
  from_user: { id: string; display_name: string; avatar_color: string }
  to_user: { id: string; display_name: string; avatar_color: string }
}) {
  return { ...t, amount: Number(t.amount) }
}

export default router
