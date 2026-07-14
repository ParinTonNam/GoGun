import { Router } from 'express'
import prisma from '../lib/prisma'
import { ok, err } from '../lib/response'
import { computeSettlements } from '../lib/settlements'
import { param } from '../lib/params'

const router = Router({ mergeParams: true })

const memberSelect = { id: true, display_name: true, avatar_color: true }

// DB column is Decimal(12,2) — reject anything that would overflow or lose precision
const MAX_AMOUNT = 9_999_999_999.99

function isTwoDecimalPlaces(n: number) {
  return Math.abs(Math.round(n * 100) / 100 - n) < 1e-9
}

// Validates expense money data. Returns an error message, or null when valid.
// Invariant protected: sum(splits) === total_amount, so per-member net balances
// in /balance and /settlements always sum to zero.
async function validateExpenseMoney(
  tripId: string,
  total_amount: number,
  paid_by_user_id: string,
  splits: Array<{ user_id?: unknown; amount?: unknown }>,
): Promise<string | null> {
  if (typeof total_amount !== 'number' || !Number.isFinite(total_amount) || total_amount <= 0)
    return 'total_amount must be a positive number'
  if (total_amount > MAX_AMOUNT || !isTwoDecimalPlaces(total_amount))
    return 'total_amount must have at most 2 decimal places and be at most 9,999,999,999.99'
  if (typeof paid_by_user_id !== 'string' || !paid_by_user_id)
    return 'paid_by_user_id must be a string'
  if (!Array.isArray(splits) || splits.length === 0)
    return 'splits must be a non-empty array'

  for (const s of splits) {
    if (!s || typeof s !== 'object' || typeof s.user_id !== 'string' || !s.user_id)
      return 'each split must have a user_id'
    if (typeof s.amount !== 'number' || !Number.isFinite(s.amount) || s.amount < 0)
      return 'each split amount must be a non-negative number'
    if (s.amount > MAX_AMOUNT || !isTwoDecimalPlaces(s.amount))
      return 'split amounts must have at most 2 decimal places and be at most 9,999,999,999.99'
  }

  const splitUserIds = splits.map(s => s.user_id as string)
  if (new Set(splitUserIds).size !== splitUserIds.length)
    return 'splits must not contain the same user twice'

  const sum = Math.round(splits.reduce((acc, s) => acc + (s.amount as number), 0) * 100) / 100
  if (Math.abs(sum - total_amount) > 0.01)
    return `splits must add up to total_amount (splits total ${sum}, expected ${total_amount})`

  const requiredIds = [...new Set([paid_by_user_id, ...splitUserIds])]
  const memberCount = await prisma.tripMember.count({
    where: { trip_id: tripId, user_id: { in: requiredIds }, status: { not: 'declined' } },
  })
  if (memberCount !== requiredIds.length)
    return 'paid_by_user_id and every split user must be a member of this trip'

  return null
}

// List expenses
router.get('/', async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: { trip_id: param(req, 'tripId') },
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

  const invalid = await validateExpenseMoney(param(req, 'tripId'), total_amount, paid_by_user_id, splits)
  if (invalid) return err(res, 400, 'VALIDATION_ERROR', invalid)

  const expense = await prisma.expense.create({
    data: {
      trip_id: param(req, 'tripId'),
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
    where: { id: param(req, 'expId'), trip_id: param(req, 'tripId') },
    include: { splits: true },
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

  // Validate the money fields as they will be AFTER the update (merge of
  // provided values over existing ones) so a partial update can't break the
  // sum(splits) === total_amount invariant.
  if (total_amount !== undefined || paid_by_user_id !== undefined || splits !== undefined) {
    const effectiveTotal = total_amount !== undefined ? total_amount : Number(expense.total_amount)
    const effectivePaidBy = paid_by_user_id !== undefined ? paid_by_user_id : expense.paid_by_user_id
    const effectiveSplits =
      splits !== undefined
        ? splits
        : expense.splits.map(s => ({ user_id: s.user_id, amount: Number(s.amount) }))
    const invalid = await validateExpenseMoney(
      param(req, 'tripId'),
      effectiveTotal,
      effectivePaidBy,
      effectiveSplits,
    )
    if (invalid) return err(res, 400, 'VALIDATION_ERROR', invalid)
  }

  const updated = await prisma.$transaction(async tx => {
    if (splits) {
      await tx.expenseSplit.deleteMany({ where: { expense_id: param(req, 'expId') } })
    }
    return tx.expense.update({
      where: { id: param(req, 'expId') },
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
    where: { id: param(req, 'expId'), trip_id: param(req, 'tripId') },
  })
  if (!expense) return err(res, 404, 'NOT_FOUND', 'Expense not found')
  await prisma.expense.delete({ where: { id: param(req, 'expId') } })
  return ok(res, { deleted: true })
})

// Balance summary
router.get('/balance', async (req, res) => {
  const [expenses, members, trip] = await Promise.all([
    prisma.expense.findMany({
      where: { trip_id: param(req, 'tripId') },
      include: { splits: true },
    }),
    prisma.tripMember.findMany({
      where: { trip_id: param(req, 'tripId'), status: { not: 'declined' } },
      include: { user: { select: memberSelect } },
    }),
    prisma.trip.findUnique({ where: { id: param(req, 'tripId') } }),
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
      where: { trip_id: param(req, 'tripId') },
      include: { splits: true },
    }),
    prisma.tripMember.findMany({
      where: { trip_id: param(req, 'tripId'), status: { not: 'declined' } },
      include: { user: { select: memberSelect } },
    }),
    prisma.trip.findUnique({ where: { id: param(req, 'tripId') } }),
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
