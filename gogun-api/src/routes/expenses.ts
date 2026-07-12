import { Router } from 'express'
import prisma from '../lib/prisma'
import { ok, err } from '../lib/response'
import { computeSettlements } from '../lib/settlements'

const router = Router({ mergeParams: true })

const memberSelect = { id: true, display_name: true, avatar_color: true }

// List expenses
router.get('/', async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: { trip_id: req.params.tripId },
    include: {
      paid_by: { select: memberSelect },
      splits: { include: { user: { select: memberSelect } } },
    },
    orderBy: { created_at: 'asc' },
  })
  return ok(res, expenses.map(serializeExpense))
})

// Add expense
router.post('/', async (req, res) => {
  const { name, category, total_amount, currency, paid_by_user_id, splits } =
    req.body as {
      name?: string
      category?: string
      total_amount?: number
      currency?: string
      paid_by_user_id?: string
      splits?: Array<{ user_id: string; amount: number }>
    }

  if (!name || !category || total_amount == null || !currency || !paid_by_user_id || !splits)
    return err(res, 400, 'VALIDATION_ERROR', 'name, category, total_amount, currency, paid_by_user_id, splits are required')

  const expense = await prisma.expense.create({
    data: {
      trip_id: req.params.tripId,
      name,
      category,
      total_amount,
      currency,
      paid_by_user_id,
      splits: { create: splits.map(s => ({ user_id: s.user_id, amount: s.amount })) },
    },
    include: {
      paid_by: { select: memberSelect },
      splits: { include: { user: { select: memberSelect } } },
    },
  })
  return ok(res, serializeExpense(expense), 201)
})

// Edit expense
router.patch('/:expId', async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.expId, trip_id: req.params.tripId },
  })
  if (!expense) return err(res, 404, 'NOT_FOUND', 'Expense not found')

  const { name, category, total_amount, currency, paid_by_user_id, splits } =
    req.body as {
      name?: string
      category?: string
      total_amount?: number
      currency?: string
      paid_by_user_id?: string
      splits?: Array<{ user_id: string; amount: number }>
    }

  const updated = await prisma.$transaction(async tx => {
    if (splits) {
      await tx.expenseSplit.deleteMany({ where: { expense_id: req.params.expId } })
    }
    return tx.expense.update({
      where: { id: req.params.expId },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(total_amount !== undefined && { total_amount }),
        ...(currency !== undefined && { currency }),
        ...(paid_by_user_id !== undefined && { paid_by_user_id }),
        ...(splits && {
          splits: { create: splits.map(s => ({ user_id: s.user_id, amount: s.amount })) },
        }),
      },
      include: {
        paid_by: { select: memberSelect },
        splits: { include: { user: { select: memberSelect } } },
      },
    })
  })
  return ok(res, serializeExpense(updated))
})

// Delete expense
router.delete('/:expId', async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.expId, trip_id: req.params.tripId },
  })
  if (!expense) return err(res, 404, 'NOT_FOUND', 'Expense not found')
  await prisma.expense.delete({ where: { id: req.params.expId } })
  return ok(res, { deleted: true })
})

// Balance summary
router.get('/balance', async (req, res) => {
  const [expenses, members, trip] = await Promise.all([
    prisma.expense.findMany({
      where: { trip_id: req.params.tripId },
      include: { splits: true },
    }),
    prisma.tripMember.findMany({
      where: { trip_id: req.params.tripId, status: { not: 'declined' } },
      include: { user: { select: memberSelect } },
    }),
    prisma.trip.findUnique({ where: { id: req.params.tripId } }),
  ])

  const balances = members.map(m => {
    const paid = expenses
      .filter(e => e.paid_by_user_id === m.user_id)
      .reduce((s, e) => s + Number(e.total_amount), 0)
    const share = expenses
      .flatMap(e => e.splits)
      .filter(s => s.user_id === m.user_id)
      .reduce((s, sp) => s + Number(sp.amount), 0)
    return {
      user_id: m.user_id,
      display_name: m.user.display_name,
      avatar_color: m.user.avatar_color,
      paid: round(paid),
      share: round(share),
      net: round(paid - share),
    }
  })

  const total_amount = round(expenses.reduce((s, e) => s + Number(e.total_amount), 0))
  const currency = expenses[0]?.currency || trip?.currency || 'JPY'

  return ok(res, { total_amount, currency, member_count: members.length, balances })
})

// Settlements
router.get('/settlements', async (req, res) => {
  const [expenses, members, trip] = await Promise.all([
    prisma.expense.findMany({
      where: { trip_id: req.params.tripId },
      include: { splits: true },
    }),
    prisma.tripMember.findMany({
      where: { trip_id: req.params.tripId, status: { not: 'declined' } },
      include: { user: { select: memberSelect } },
    }),
    prisma.trip.findUnique({ where: { id: req.params.tripId } }),
  ])

  const netBalances = members.map(m => {
    const paid = expenses
      .filter(e => e.paid_by_user_id === m.user_id)
      .reduce((s, e) => s + Number(e.total_amount), 0)
    const share = expenses
      .flatMap(e => e.splits)
      .filter(s => s.user_id === m.user_id)
      .reduce((s, sp) => s + Number(sp.amount), 0)
    return { user_id: m.user_id, net: round(paid - share) }
  })

  const transfers = computeSettlements(netBalances)
  const currency = expenses[0]?.currency || trip?.currency || 'JPY'

  const enriched = transfers.map(t => ({
    ...t,
    currency,
    from_user: members.find(m => m.user_id === t.from_user_id)?.user,
    to_user: members.find(m => m.user_id === t.to_user_id)?.user,
  }))

  return ok(res, enriched)
})

function round(n: number) {
  return Math.round(n * 100) / 100
}

function serializeExpense(e: {
  id: string
  trip_id: string
  name: string
  category: string
  total_amount: { toString(): string }
  currency: string
  paid_by_user_id: string
  created_at: Date
  paid_by: { id: string; display_name: string; avatar_color: string }
  splits: Array<{
    id: string
    expense_id: string
    user_id: string
    amount: { toString(): string }
    user: { id: string; display_name: string; avatar_color: string }
  }>
}) {
  return {
    ...e,
    total_amount: Number(e.total_amount),
    splits: e.splits.map(s => ({ ...s, amount: Number(s.amount) })),
  }
}

export default router
