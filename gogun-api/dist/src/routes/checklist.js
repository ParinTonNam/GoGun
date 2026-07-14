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
// List all items with check state per member
router.get('/', async (req, res) => {
    const items = await prisma_1.default.checklistItem.findMany({
        where: { trip_id: (0, params_1.param)(req, 'tripId') },
        include: {
            checks: { include: { user: { select: memberSelect } } },
        },
        orderBy: { sort_order: 'asc' },
    });
    const userId = req.user.id;
    return (0, response_1.ok)(res, items.map(item => ({
        id: item.id,
        trip_id: item.trip_id,
        text: item.text,
        sort_order: item.sort_order,
        checked_by: item.checks.map(c => ({ ...c.user, checked_at: c.checked_at })),
        is_checked: item.checks.some(c => c.user_id === userId),
    })));
});
// Add item
router.post('/', async (req, res) => {
    const { text, sort_order } = req.body;
    if (!text)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'text is required');
    const item = await prisma_1.default.checklistItem.create({
        data: { trip_id: (0, params_1.param)(req, 'tripId'), text, sort_order: sort_order ?? 0 },
    });
    return (0, response_1.ok)(res, item, 201);
});
// Edit item
router.patch('/:itemId', async (req, res) => {
    const item = await prisma_1.default.checklistItem.findFirst({
        where: { id: (0, params_1.param)(req, 'itemId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!item)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Item not found');
    const { text, sort_order } = req.body;
    const updated = await prisma_1.default.checklistItem.update({
        where: { id: (0, params_1.param)(req, 'itemId') },
        data: {
            ...(text !== undefined && { text }),
            ...(sort_order !== undefined && { sort_order }),
        },
    });
    return (0, response_1.ok)(res, updated);
});
// Delete item
router.delete('/:itemId', async (req, res) => {
    const item = await prisma_1.default.checklistItem.findFirst({
        where: { id: (0, params_1.param)(req, 'itemId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!item)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Item not found');
    await prisma_1.default.checklistItem.delete({ where: { id: (0, params_1.param)(req, 'itemId') } });
    return (0, response_1.ok)(res, { deleted: true });
});
// Check item for current user (or specific userId for organizer)
router.post('/:itemId/check', async (req, res) => {
    const item = await prisma_1.default.checklistItem.findFirst({
        where: { id: (0, params_1.param)(req, 'itemId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!item)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Item not found');
    const userId = req.user.id;
    await prisma_1.default.checklistItemCheck.upsert({
        where: {
            item_id_user_id: { item_id: (0, params_1.param)(req, 'itemId'), user_id: userId },
        },
        create: { item_id: (0, params_1.param)(req, 'itemId'), user_id: userId },
        update: { checked_at: new Date() },
    });
    return (0, response_1.ok)(res, { checked: true });
});
// Uncheck item
router.delete('/:itemId/check', async (req, res) => {
    const existing = await prisma_1.default.checklistItemCheck.findUnique({
        where: {
            item_id_user_id: { item_id: (0, params_1.param)(req, 'itemId'), user_id: req.user.id },
        },
    });
    if (!existing)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Check not found');
    await prisma_1.default.checklistItemCheck.delete({
        where: {
            item_id_user_id: { item_id: (0, params_1.param)(req, 'itemId'), user_id: req.user.id },
        },
    });
    return (0, response_1.ok)(res, { deleted: true });
});
exports.default = router;
