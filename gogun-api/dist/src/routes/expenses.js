"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const response_1 = require("../lib/response");
const settlements_1 = require("../lib/settlements");
const params_1 = require("../lib/params");
const router = (0, express_1.Router)({ mergeParams: true });
const memberSelect = { id: true, display_name: true, avatar_color: true };
// List expenses
router.get('/', async (req, res) => {
    const expenses = await prisma_1.default.expense.findMany({
        where: { trip_id: (0, params_1.param)(req, 'tripId') },
        include: {
            paid_by: { select: memberSelect },
            splits: { include: { user: { select: memberSelect } } },
        },
        orderBy: { created_at: 'asc' },
    });
    return (0, response_1.ok)(res, expenses.map(serializeExpense));
});
// Add expense
router.post('/', async (req, res) => {
    const { name, category, total_amount, currency, paid_by_user_id, splits } = req.body;
    if (!name || !category || total_amount == null || !currency || !paid_by_user_id || !splits)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'name, category, total_amount, currency, paid_by_user_id, splits are required');
    const expense = await prisma_1.default.expense.create({
        data: {
            trip_id: (0, params_1.param)(req, 'tripId'),
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
    });
    return (0, response_1.ok)(res, serializeExpense(expense), 201);
});
// Edit expense
router.patch('/:expId', async (req, res) => {
    const expense = await prisma_1.default.expense.findFirst({
        where: { id: (0, params_1.param)(req, 'expId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!expense)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Expense not found');
    const { name, category, total_amount, currency, paid_by_user_id, splits } = req.body;
    const updated = await prisma_1.default.$transaction(async (tx) => {
        if (splits) {
            await tx.expenseSplit.deleteMany({ where: { expense_id: (0, params_1.param)(req, 'expId') } });
        }
        return tx.expense.update({
            where: { id: (0, params_1.param)(req, 'expId') },
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
        });
    });
    return (0, response_1.ok)(res, serializeExpense(updated));
});
// Delete expense
router.delete('/:expId', async (req, res) => {
    const expense = await prisma_1.default.expense.findFirst({
        where: { id: (0, params_1.param)(req, 'expId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!expense)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Expense not found');
    await prisma_1.default.expense.delete({ where: { id: (0, params_1.param)(req, 'expId') } });
    return (0, response_1.ok)(res, { deleted: true });
});
// Balance summary
router.get('/balance', async (req, res) => {
    const [expenses, members, trip] = await Promise.all([
        prisma_1.default.expense.findMany({
            where: { trip_id: (0, params_1.param)(req, 'tripId') },
            include: { splits: true },
        }),
        prisma_1.default.tripMember.findMany({
            where: { trip_id: (0, params_1.param)(req, 'tripId'), status: { not: 'declined' } },
            include: { user: { select: memberSelect } },
        }),
        prisma_1.default.trip.findUnique({ where: { id: (0, params_1.param)(req, 'tripId') } }),
    ]);
    const balances = members.map(m => {
        const paid = expenses
            .filter(e => e.paid_by_user_id === m.user_id)
            .reduce((s, e) => s + Number(e.total_amount), 0);
        const share = expenses
            .flatMap(e => e.splits)
            .filter(s => s.user_id === m.user_id)
            .reduce((s, sp) => s + Number(sp.amount), 0);
        return {
            user_id: m.user_id,
            display_name: m.user.display_name,
            avatar_color: m.user.avatar_color,
            paid: round(paid),
            share: round(share),
            net: round(paid - share),
        };
    });
    const total_amount = round(expenses.reduce((s, e) => s + Number(e.total_amount), 0));
    const currency = expenses[0]?.currency || trip?.currency || 'JPY';
    return (0, response_1.ok)(res, { total_amount, currency, member_count: members.length, balances });
});
// Settlements
router.get('/settlements', async (req, res) => {
    const [expenses, members, trip] = await Promise.all([
        prisma_1.default.expense.findMany({
            where: { trip_id: (0, params_1.param)(req, 'tripId') },
            include: { splits: true },
        }),
        prisma_1.default.tripMember.findMany({
            where: { trip_id: (0, params_1.param)(req, 'tripId'), status: { not: 'declined' } },
            include: { user: { select: memberSelect } },
        }),
        prisma_1.default.trip.findUnique({ where: { id: (0, params_1.param)(req, 'tripId') } }),
    ]);
    const netBalances = members.map(m => {
        const paid = expenses
            .filter(e => e.paid_by_user_id === m.user_id)
            .reduce((s, e) => s + Number(e.total_amount), 0);
        const share = expenses
            .flatMap(e => e.splits)
            .filter(s => s.user_id === m.user_id)
            .reduce((s, sp) => s + Number(sp.amount), 0);
        return { user_id: m.user_id, net: round(paid - share) };
    });
    const transfers = (0, settlements_1.computeSettlements)(netBalances);
    const currency = expenses[0]?.currency || trip?.currency || 'JPY';
    const enriched = transfers.map(t => ({
        ...t,
        currency,
        from_user: members.find(m => m.user_id === t.from_user_id)?.user,
        to_user: members.find(m => m.user_id === t.to_user_id)?.user,
    }));
    return (0, response_1.ok)(res, enriched);
});
function round(n) {
    return Math.round(n * 100) / 100;
}
function serializeExpense(e) {
    return {
        ...e,
        total_amount: Number(e.total_amount),
        splits: e.splits.map(s => ({ ...s, amount: Number(s.amount) })),
    };
}
exports.default = router;
