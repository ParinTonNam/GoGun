import { Router } from 'express'
import prisma from '../lib/prisma'
import { ok, err } from '../lib/response'
import { param } from '../lib/params'

const router = Router({ mergeParams: true })

const memberSelect = { id: true, display_name: true, avatar_color: true }

// List all items with check state per member
router.get('/', async (req, res) => {
  const items = await prisma.checklistItem.findMany({
    where: { trip_id: param(req, 'tripId') },
    include: {
      checks: { include: { user: { select: memberSelect } } },
    },
    orderBy: { sort_order: 'asc' },
  })
  const userId = req.user!.id
  return ok(res, items.map(item => ({
    id: item.id,
    trip_id: item.trip_id,
    text: item.text,
    sort_order: item.sort_order,
    checked_by: item.checks.map(c => ({ ...c.user, checked_at: c.checked_at })),
    is_checked: item.checks.some(c => c.user_id === userId),
  })))
})

// Add item
router.post('/', async (req, res) => {
  const { text, sort_order } = req.body as { text?: string; sort_order?: number }
  if (!text) return err(res, 400, 'VALIDATION_ERROR', 'text is required')

  const item = await prisma.checklistItem.create({
    data: { trip_id: param(req, 'tripId'), text, sort_order: sort_order ?? 0 },
  })
  return ok(res, item, 201)
})

// Edit item
router.patch('/:itemId', async (req, res) => {
  const item = await prisma.checklistItem.findFirst({
    where: { id: param(req, 'itemId'), trip_id: param(req, 'tripId') },
  })
  if (!item) return err(res, 404, 'NOT_FOUND', 'Item not found')

  const { text, sort_order } = req.body as { text?: string; sort_order?: number }
  const updated = await prisma.checklistItem.update({
    where: { id: param(req, 'itemId') },
    data: {
      ...(text !== undefined && { text }),
      ...(sort_order !== undefined && { sort_order }),
    },
  })
  return ok(res, updated)
})

// Delete item
router.delete('/:itemId', async (req, res) => {
  const item = await prisma.checklistItem.findFirst({
    where: { id: param(req, 'itemId'), trip_id: param(req, 'tripId') },
  })
  if (!item) return err(res, 404, 'NOT_FOUND', 'Item not found')
  await prisma.checklistItem.delete({ where: { id: param(req, 'itemId') } })
  return ok(res, { deleted: true })
})

// Check item for current user (or specific userId for organizer)
router.post('/:itemId/check', async (req, res) => {
  const item = await prisma.checklistItem.findFirst({
    where: { id: param(req, 'itemId'), trip_id: param(req, 'tripId') },
  })
  if (!item) return err(res, 404, 'NOT_FOUND', 'Item not found')

  const userId = req.user!.id

  await prisma.checklistItemCheck.upsert({
    where: {
      item_id_user_id: { item_id: param(req, 'itemId'), user_id: userId },
    },
    create: { item_id: param(req, 'itemId'), user_id: userId },
    update: { checked_at: new Date() },
  })
  return ok(res, { checked: true })
})

// Uncheck item
router.delete('/:itemId/check', async (req, res) => {
  const existing = await prisma.checklistItemCheck.findUnique({
    where: {
      item_id_user_id: { item_id: param(req, 'itemId'), user_id: req.user!.id },
    },
  })
  if (!existing) return err(res, 404, 'NOT_FOUND', 'Check not found')
  await prisma.checklistItemCheck.delete({
    where: {
      item_id_user_id: { item_id: param(req, 'itemId'), user_id: req.user!.id },
    },
  })
  return ok(res, { deleted: true })
})

export default router
