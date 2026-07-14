"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const response_1 = require("../lib/response");
const params_1 = require("../lib/params");
const router = (0, express_1.Router)({ mergeParams: true });
const memberSelect = { id: true, display_name: true, avatar_color: true };
// List all items with check state for current user
router.get('/', async (req, res) => {
    const items = await prisma_1.default.packingItem.findMany({
        where: { trip_id: (0, params_1.param)(req, 'tripId') },
        include: {
            assignees: { include: { user: { select: memberSelect } } },
            checks: { include: { user: { select: memberSelect } } },
        },
        orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
    });
    const userId = req.user.id;
    return (0, response_1.ok)(res, items.map(item => ({
        id: item.id,
        trip_id: item.trip_id,
        text: item.text,
        category: item.category,
        sort_order: item.sort_order,
        assignees: item.assignees.map(a => a.user),
        checked_by: item.checks.map(c => c.user),
        is_checked: item.checks.some(c => c.user_id === userId),
    })));
});
// Add item
router.post('/', async (req, res) => {
    const { text, category, assignees, sort_order } = req.body;
    if (!text || !category)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'text and category are required');
    const item = await prisma_1.default.packingItem.create({
        data: {
            trip_id: (0, params_1.param)(req, 'tripId'),
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
    });
    return (0, response_1.ok)(res, item, 201);
});
// Edit item
router.patch('/:itemId', async (req, res) => {
    const item = await prisma_1.default.packingItem.findFirst({
        where: { id: (0, params_1.param)(req, 'itemId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!item)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Item not found');
    const { text, category } = req.body;
    const updated = await prisma_1.default.packingItem.update({
        where: { id: (0, params_1.param)(req, 'itemId') },
        data: {
            ...(text !== undefined && { text }),
            ...(category !== undefined && { category }),
        },
    });
    return (0, response_1.ok)(res, updated);
});
// Delete item
router.delete('/:itemId', async (req, res) => {
    const item = await prisma_1.default.packingItem.findFirst({
        where: { id: (0, params_1.param)(req, 'itemId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!item)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Item not found');
    await prisma_1.default.packingItem.delete({ where: { id: (0, params_1.param)(req, 'itemId') } });
    return (0, response_1.ok)(res, { deleted: true });
});
// Check item
router.post('/:itemId/check', async (req, res) => {
    const item = await prisma_1.default.packingItem.findFirst({
        where: { id: (0, params_1.param)(req, 'itemId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!item)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Item not found');
    await prisma_1.default.packingItemCheck.upsert({
        where: {
            item_id_user_id: { item_id: (0, params_1.param)(req, 'itemId'), user_id: req.user.id },
        },
        create: { item_id: (0, params_1.param)(req, 'itemId'), user_id: req.user.id },
        update: { checked_at: new Date() },
    });
    return (0, response_1.ok)(res, { checked: true });
});
// Uncheck item
router.delete('/:itemId/check', async (req, res) => {
    const existing = await prisma_1.default.packingItemCheck.findUnique({
        where: {
            item_id_user_id: { item_id: (0, params_1.param)(req, 'itemId'), user_id: req.user.id },
        },
    });
    if (!existing)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Check not found');
    await prisma_1.default.packingItemCheck.delete({
        where: { item_id_user_id: { item_id: (0, params_1.param)(req, 'itemId'), user_id: req.user.id } },
    });
    return (0, response_1.ok)(res, { deleted: true });
});
exports.default = router;
