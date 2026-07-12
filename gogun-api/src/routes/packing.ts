import { Router } from 'express'
import prisma from '../lib/prisma'
import { ok, err } from '../lib/response'

const router = Router({ mergeParams: true })

const memberSelect = { id: true, display_name: true, avatar_color: true }

// List all items with check state for current user
router.get('/', async (req, res) => {
  const items = await prisma.packingItem.findMany({
    where: { trip_id: req.params.tripId },
    include: {
      assignees: { include: { user: { select: memberSelect } } },
      checks: { include: { user: { select: memberSelect } } },
    },
    orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
  })

  const userId = req.user!.id
  return ok(res, items.map(item => ({
    id: item.id,
    trip_id: item.trip_id,
    text: item.text,
    category: item.category,
    sort_order: item.sort_order,
    assignees: item.assignees.map(a => a.user),
    checked_by: item.checks.map(c => c.user),
    is_checked: item.checks.some(c => c.user_id === userId),
  })))
})

// Add item
router.post('/', async (req, res) => {
  const { text, category, assignees, sort_order } = req.body as {
    text?: string
    category?: string
    assignees?: string[]
    sort_order?: number
  }
  if (!text || !category) return err(res, 400, 'VALIDATION_ERROR', 'text and category are required')

  const item = await prisma.packingItem.create({
    data: {
      trip_id: req.params.tripId,
      text,
      category,
      sort_order: sort_order ?? 0,
      assignees: assignees
        ? { create: assignees.map(user_id => ({ user_id })) }
        : undefined,
    },
    include: {
      assignees: { include: { user: { select: memberSelect } } },
      checks: true,
    },
  })
  return ok(res, item, 201)
})

// Edit item
router.patch('/:itemId', async (req, res) => {
  const item = await prisma.packingItem.findFirst({
    where: { id: req.params.itemId, trip_id: req.params.tripId },
  })
  if (!item) return err(res, 404, 'NOT_FOUND', 'Item not found')

  const { text, category } = req.body as { text?: string; category?: string }
  const updated = await prisma.packingItem.update({
    where: { id: req.params.itemId },
    data: {
      ...(text !== undefined && { text }),
      ...(category !== undefined && { category }),
    },
  })
  return ok(res, updated)
})

// Delete item
router.delete('/:itemId', async (req, res) => {
  const item = await prisma.packingItem.findFirst({
    where: { id: req.params.itemId, trip_id: req.params.tripId },
  })
  if (!item) return err(res, 404, 'NOT_FOUND', 'Item not found')
  await prisma.packingItem.delete({ where: { id: req.params.itemId } })
  return ok(res, { deleted: true })
})

// Check item
router.post('/:itemId/check', async (req, res) => {
  const item = await prisma.packingItem.findFirst({
    where: { id: req.params.itemId, trip_id: req.params.tripId },
  })
  if (!item) return err(res, 404, 'NOT_FOUND', 'Item not found')

  await prisma.packingItemCheck.upsert({
    where: {
      item_id_user_id: { item_id: req.params.itemId, user_id: req.user!.id },
    },
    create: { item_id: req.params.itemId, user_id: req.user!.id },
    update: { checked_at: new Date() },
  })
  return ok(res, { checked: true })
})

// Uncheck item
router.delete('/:itemId/check', async (req, res) => {
  const existing = await prisma.packingItemCheck.findUnique({
    where: {
      item_id_user_id: { item_id: req.params.itemId, user_id: req.user!.id },
    },
  })
  if (!existing) return err(res, 404, 'NOT_FOUND', 'Check not found')
  await prisma.packingItemCheck.delete({
    where: { item_id_user_id: { item_id: req.params.itemId, user_id: req.user!.id } },
  })
  return ok(res, { deleted: true })
})

export default router
