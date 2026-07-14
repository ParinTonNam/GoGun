"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const trip_1 = require("../middleware/trip");
const upload_1 = require("../middleware/upload");
const response_1 = require("../lib/response");
const params_1 = require("../lib/params");
const router = (0, express_1.Router)({ mergeParams: true });
const memberSelect = { id: true, display_name: true, avatar_color: true };
// List transfers
router.get('/', async (req, res) => {
    const transfers = await prisma_1.default.transferSlip.findMany({
        where: { trip_id: (0, params_1.param)(req, 'tripId') },
        include: {
            from_user: { select: memberSelect },
            to_user: { select: memberSelect },
        },
    });
    return (0, response_1.ok)(res, transfers.map(serializeTransfer));
});
// Upload slip
router.post('/:transferId/slip', upload_1.uploadSlip, async (req, res) => {
    const transfer = await prisma_1.default.transferSlip.findFirst({
        where: { id: (0, params_1.param)(req, 'transferId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!transfer)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Transfer not found');
    if (transfer.from_user_id !== req.user.id)
        return (0, response_1.err)(res, 403, 'FORBIDDEN', 'Only the sender can upload a slip');
    if (!req.file)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'slip file is required');
    const slip_url = `/uploads/slips/${path_1.default.basename(req.file.path)}`;
    const updated = await prisma_1.default.transferSlip.update({
        where: { id: (0, params_1.param)(req, 'transferId') },
        data: { slip_url, status: 'slip_attached' },
        include: {
            from_user: { select: memberSelect },
            to_user: { select: memberSelect },
        },
    });
    return (0, response_1.ok)(res, serializeTransfer(updated));
});
// Confirm receipt (organizer only)
router.patch('/:transferId/confirm', trip_1.requireOrganizer, async (req, res) => {
    const transfer = await prisma_1.default.transferSlip.findFirst({
        where: { id: (0, params_1.param)(req, 'transferId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!transfer)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Transfer not found');
    const updated = await prisma_1.default.transferSlip.update({
        where: { id: (0, params_1.param)(req, 'transferId') },
        data: { status: 'confirmed', confirmed_at: new Date() },
        include: {
            from_user: { select: memberSelect },
            to_user: { select: memberSelect },
        },
    });
    return (0, response_1.ok)(res, serializeTransfer(updated));
});
function serializeTransfer(t) {
    return { ...t, amount: Number(t.amount) };
}
exports.default = router;
