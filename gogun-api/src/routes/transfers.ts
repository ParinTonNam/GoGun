import { Router } from 'express'
import path from 'path'
import prisma from '../lib/prisma'
import { requireOrganizer } from '../middleware/trip'
import { uploadSlip } from '../middleware/upload'
import { ok, err } from '../lib/response'

const router = Router({ mergeParams: true })

const memberSelect = { id: true, display_name: true, avatar_color: true }

// List transfers
router.get('/', async (req, res) => {
  const transfers = await prisma.transferSlip.findMany({
    where: { trip_id: req.params.tripId },
    include: {
      from_user: { select: memberSelect },
      to_user: { select: memberSelect },
    },
  })
  return ok(res, transfers.map(serializeTransfer))
})

// Upload slip
router.post('/:transferId/slip', uploadSlip.single('slip'), async (req, res) => {
  const transfer = await prisma.transferSlip.findFirst({
    where: { id: req.params.transferId, trip_id: req.params.tripId },
  })
  if (!transfer) return err(res, 404, 'NOT_FOUND', 'Transfer not found')

  if (transfer.from_user_id !== req.user!.id)
    return err(res, 403, 'FORBIDDEN', 'Only the sender can upload a slip')

  if (!req.file)
    return err(res, 400, 'VALIDATION_ERROR', 'slip file is required')

  const slip_url = `/uploads/slips/${path.basename(req.file.path)}`
  const updated = await prisma.transferSlip.update({
    where: { id: req.params.transferId },
    data: { slip_url, status: 'slip_attached' },
    include: {
      from_user: { select: memberSelect },
      to_user: { select: memberSelect },
    },
  })
  return ok(res, serializeTransfer(updated))
})

// Confirm receipt (organizer only)
router.patch('/:transferId/confirm', requireOrganizer, async (req, res) => {
  const transfer = await prisma.transferSlip.findFirst({
    where: { id: req.params.transferId, trip_id: req.params.tripId },
  })
  if (!transfer) return err(res, 404, 'NOT_FOUND', 'Transfer not found')

  const updated = await prisma.transferSlip.update({
    where: { id: req.params.transferId },
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
  slip_url: string | null
  confirmed_at: Date | null
  from_user: { id: string; display_name: string; avatar_color: string }
  to_user: { id: string; display_name: string; avatar_color: string }
}) {
  return { ...t, amount: Number(t.amount) }
}

export default router
