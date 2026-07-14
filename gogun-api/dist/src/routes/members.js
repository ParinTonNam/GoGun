"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_1 = __importDefault(require("../lib/prisma"));
const trip_1 = require("../middleware/trip");
const response_1 = require("../lib/response");
const params_1 = require("../lib/params");
const router = (0, express_1.Router)({ mergeParams: true });
const GUEST_COLORS = [
    '#4f6e7a', '#7b8b57', '#8a6e9e', '#c0613e', '#3d7068', '#a8763e',
];
function randomGuestColor() {
    return GUEST_COLORS[Math.floor(Math.random() * GUEST_COLORS.length)];
}
// List members
router.get('/', async (req, res) => {
    const members = await prisma_1.default.tripMember.findMany({
        where: { trip_id: (0, params_1.param)(req, 'tripId') },
        include: {
            user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
        },
        orderBy: { joined_at: 'asc' },
    });
    return (0, response_1.ok)(res, members);
});
// Join trip (member selects display name on join page)
router.post('/', async (req, res) => {
    const { display_name, avatar_color } = req.body;
    // Update user profile if provided
    if (display_name || avatar_color) {
        await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                ...(display_name && { display_name }),
                ...(avatar_color && { avatar_color }),
            },
        });
    }
    const existing = await prisma_1.default.tripMember.findUnique({
        where: {
            trip_id_user_id: { trip_id: (0, params_1.param)(req, 'tripId'), user_id: req.user.id },
        },
    });
    if (existing) {
        if (existing.status === 'joined')
            return (0, response_1.err)(res, 409, 'CONFLICT', 'Already a member of this trip');
        const member = await prisma_1.default.tripMember.update({
            where: { id: existing.id },
            data: { status: 'joined', joined_at: new Date() },
            include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
        });
        return (0, response_1.ok)(res, member, 201);
    }
    const member = await prisma_1.default.tripMember.create({
        data: {
            trip_id: (0, params_1.param)(req, 'tripId'),
            user_id: req.user.id,
            role: 'member',
            status: 'joined',
            joined_at: new Date(),
        },
        include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
    });
    return (0, response_1.ok)(res, member, 201);
});
// Add a member by nickname (organizer only) — creates a placeholder guest
// account the trip member can later claim by joining via the invite link.
router.post('/add', trip_1.requireOrganizer, async (req, res) => {
    const { display_name } = req.body;
    const name = display_name?.trim();
    if (!name)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'display_name is required');
    const guestId = (0, crypto_1.randomUUID)();
    const password_hash = await bcrypt_1.default.hash((0, crypto_1.randomUUID)(), 10);
    const guest = await prisma_1.default.user.create({
        data: {
            username: `guest_${guestId}`,
            email: `guest_${guestId}@guests.gogun.app`,
            password_hash,
            display_name: name,
            avatar_color: randomGuestColor(),
            is_guest: true,
        },
    });
    const member = await prisma_1.default.tripMember.create({
        data: {
            trip_id: (0, params_1.param)(req, 'tripId'),
            user_id: guest.id,
            role: 'member',
            status: 'invited',
        },
        include: {
            user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
        },
    });
    return (0, response_1.ok)(res, member, 201);
});
// Update member status/role, or rename a guest member (organizer only)
router.patch('/:userId', trip_1.requireOrganizer, async (req, res) => {
    const { status, role, display_name } = req.body;
    const member = await prisma_1.default.tripMember.findUnique({
        where: {
            trip_id_user_id: { trip_id: (0, params_1.param)(req, 'tripId'), user_id: (0, params_1.param)(req, 'userId') },
        },
        include: { user: { select: { is_guest: true } } },
    });
    if (!member)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Member not found');
    if (display_name !== undefined) {
        const trimmed = display_name.trim();
        if (!trimmed)
            return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'display_name cannot be empty');
        if (!member.user.is_guest)
            return (0, response_1.err)(res, 403, 'FORBIDDEN', 'Only guest members added by the organizer can be renamed here');
        await prisma_1.default.user.update({ where: { id: member.user_id }, data: { display_name: trimmed } });
    }
    const updated = await prisma_1.default.tripMember.update({
        where: { id: member.id },
        data: {
            ...(status !== undefined && { status }),
            ...(role !== undefined && { role }),
        },
        include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
    });
    return (0, response_1.ok)(res, updated);
});
// Remove member (organizer only)
router.delete('/:userId', trip_1.requireOrganizer, async (req, res) => {
    const member = await prisma_1.default.tripMember.findUnique({
        where: {
            trip_id_user_id: { trip_id: (0, params_1.param)(req, 'tripId'), user_id: (0, params_1.param)(req, 'userId') },
        },
    });
    if (!member)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Member not found');
    if (member.role === 'organizer')
        return (0, response_1.err)(res, 403, 'FORBIDDEN', 'Cannot remove the trip organizer');
    await prisma_1.default.tripMember.delete({ where: { id: member.id } });
    return (0, response_1.ok)(res, { deleted: true });
});
exports.default = router;
