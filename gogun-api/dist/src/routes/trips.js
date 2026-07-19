"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const trip_1 = require("../middleware/trip");
const response_1 = require("../lib/response");
const jwt_1 = require("../lib/jwt");
const params_1 = require("../lib/params");
const TRIP_TYPES = ['one_day', 'overnight', 'long'];
const router = (0, express_1.Router)();
// List my trips
router.get('/', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.id;
    const memberships = await prisma_1.default.tripMember.findMany({
        where: { user_id: userId, status: 'joined' },
        include: {
            trip: {
                include: {
                    organizer: { select: { id: true, display_name: true, avatar_color: true } },
                    members: {
                        where: { status: { not: 'declined' } },
                        include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
                    },
                },
            },
        },
        orderBy: { joined_at: 'desc' },
    });
    return (0, response_1.ok)(res, memberships.map(m => m.trip));
});
// Public — join page preview
router.get('/join/:invite_code', async (req, res) => {
    const trip = await prisma_1.default.trip.findUnique({
        where: { invite_code: (0, params_1.param)(req, 'invite_code') },
        include: {
            organizer: { select: { id: true, display_name: true, avatar_color: true } },
            members: {
                where: { status: { not: 'declined' } },
                include: {
                    user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
                },
            },
        },
    });
    if (!trip)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Trip not found');
    return (0, response_1.ok)(res, trip);
});
// Join trip by invite code (auth required, no membership check)
router.post('/join/:invite_code', auth_1.requireAuth, async (req, res) => {
    const trip = await prisma_1.default.trip.findUnique({
        where: { invite_code: (0, params_1.param)(req, 'invite_code') },
    });
    if (!trip)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Trip not found');
    const userId = req.user.id;
    const existing = await prisma_1.default.tripMember.findUnique({
        where: { trip_id_user_id: { trip_id: trip.id, user_id: userId } },
    });
    if (existing) {
        if (existing.status === 'joined') {
            return (0, response_1.ok)(res, { trip_id: trip.id, already_member: true });
        }
        await prisma_1.default.tripMember.update({
            where: { id: existing.id },
            data: { status: 'joined', joined_at: new Date() },
        });
        return (0, response_1.ok)(res, { trip_id: trip.id, already_member: false }, 201);
    }
    await prisma_1.default.tripMember.create({
        data: {
            trip_id: trip.id,
            user_id: userId,
            role: 'member',
            status: 'joined',
            joined_at: new Date(),
        },
    });
    return (0, response_1.ok)(res, { trip_id: trip.id, already_member: false }, 201);
});
// Claim a guest member slot by tapping your name — no login required.
// Guest names stay selectable by anyone with the link (so a guest who lost
// their session can just tap their name again) until the guest links an
// email, which locks the name to that account permanently.
router.post('/join/:invite_code/claim/:memberId', async (req, res) => {
    const trip = await prisma_1.default.trip.findUnique({
        where: { invite_code: (0, params_1.param)(req, 'invite_code') },
    });
    if (!trip)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Trip not found');
    const member = await prisma_1.default.tripMember.findUnique({
        where: { id: (0, params_1.param)(req, 'memberId') },
        include: { user: { select: { is_guest: true } } },
    });
    if (!member || member.trip_id !== trip.id)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Member not found');
    if (!member.user.is_guest)
        return (0, response_1.err)(res, 409, 'CONFLICT', 'This name is linked to an account — log in to use it');
    const updated = await prisma_1.default.tripMember.update({
        where: { id: member.id },
        data: member.status === 'joined' ? {} : { status: 'joined', joined_at: new Date() },
        include: {
            user: { select: { id: true, display_name: true, avatar_color: true, is_guest: true } },
        },
    });
    const token = (0, jwt_1.signToken)(member.user_id);
    return (0, response_1.ok)(res, { token, trip_id: trip.id, member: updated });
});
// Create trip
router.post('/', auth_1.requireAuth, async (req, res) => {
    const { name, destination, icon, trip_type, duration_days, proposed_start_date, currency } = req.body;
    // Organizers must be real accounts — a guest who lost their session could
    // never get back into a trip they organize.
    if (req.user.is_guest)
        return (0, response_1.err)(res, 403, 'FORBIDDEN', 'Link an email to your account before creating a trip');
    if (!name || !destination || !duration_days)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'name, destination, duration_days are required');
    if (trip_type !== undefined && trip_type !== null && !TRIP_TYPES.includes(trip_type))
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', `trip_type must be one of: ${TRIP_TYPES.join(', ')}`);
    // icon เก็บเป็น emoji สั้นๆ — กันส่ง string ยาวมาลง DB
    if (icon !== undefined && icon !== null && (typeof icon !== 'string' || icon.length > 16))
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'icon must be a short emoji string');
    // invite_code is unique — on the (rare) collision Prisma throws P2002, so
    // retry with a fresh code instead of surfacing a 500.
    const MAX_INVITE_ATTEMPTS = 3;
    for (let attempt = 1;; attempt++) {
        try {
            const trip = await prisma_1.default.trip.create({
                data: {
                    name,
                    destination,
                    icon: icon ?? null,
                    trip_type: trip_type ?? null,
                    duration_days,
                    proposed_start_date: proposed_start_date ? new Date(proposed_start_date) : null,
                    currency: currency || 'JPY',
                    invite_code: (0, response_1.generateInviteCode)(),
                    organizer_id: req.user.id,
                    members: {
                        create: {
                            user_id: req.user.id,
                            role: 'organizer',
                            status: 'joined',
                            joined_at: new Date(),
                        },
                    },
                },
                include: { organizer: { select: { id: true, display_name: true, avatar_color: true } } },
            });
            return (0, response_1.ok)(res, trip, 201);
        }
        catch (e) {
            const isUniqueViolation = e.code === 'P2002';
            if (!isUniqueViolation || attempt >= MAX_INVITE_ATTEMPTS)
                throw e;
        }
    }
});
// Get trip detail
router.get('/:tripId', auth_1.requireAuth, trip_1.requireTripMember, async (req, res) => {
    const trip = await prisma_1.default.trip.findUnique({
        where: { id: (0, params_1.param)(req, 'tripId') },
        include: {
            organizer: { select: { id: true, display_name: true, avatar_color: true } },
            members: {
                where: { status: { not: 'declined' } },
                include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
            },
        },
    });
    if (!trip)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Trip not found');
    return (0, response_1.ok)(res, trip);
});
// Update trip
router.patch('/:tripId', auth_1.requireAuth, trip_1.requireTripMember, trip_1.requireOrganizer, async (req, res) => {
    const { name, destination, icon, trip_type, duration_days, proposed_start_date, confirmed_start_date, date_status, currency, budget_per_person, allow_member_expenses, allow_member_itinerary_edit, allow_member_invite, } = req.body;
    if (trip_type !== undefined && trip_type !== null && !TRIP_TYPES.includes(String(trip_type)))
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', `trip_type must be one of: ${TRIP_TYPES.join(', ')}`);
    if (icon !== undefined && icon !== null && (typeof icon !== 'string' || icon.length > 16))
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'icon must be a short emoji string');
    const trip = await prisma_1.default.trip.update({
        where: { id: (0, params_1.param)(req, 'tripId') },
        data: {
            ...(name !== undefined && { name: String(name) }),
            ...(destination !== undefined && { destination: String(destination) }),
            ...(icon !== undefined && { icon: icon === null || icon === '' ? null : String(icon) }),
            ...(trip_type !== undefined && { trip_type: trip_type === null ? null : trip_type }),
            ...(duration_days !== undefined && { duration_days: Number(duration_days) }),
            ...(proposed_start_date !== undefined && {
                proposed_start_date: proposed_start_date ? new Date(String(proposed_start_date)) : null,
            }),
            ...(confirmed_start_date !== undefined && {
                confirmed_start_date: confirmed_start_date
                    ? new Date(String(confirmed_start_date))
                    : null,
            }),
            ...(date_status !== undefined && { date_status: String(date_status) }),
            ...(currency !== undefined && { currency: String(currency) }),
            ...(budget_per_person !== undefined && {
                budget_per_person: budget_per_person === null || budget_per_person === '' ? null : Number(budget_per_person),
            }),
            ...(allow_member_expenses !== undefined && { allow_member_expenses: Boolean(allow_member_expenses) }),
            ...(allow_member_itinerary_edit !== undefined && {
                allow_member_itinerary_edit: Boolean(allow_member_itinerary_edit),
            }),
            ...(allow_member_invite !== undefined && { allow_member_invite: Boolean(allow_member_invite) }),
        },
    });
    return (0, response_1.ok)(res, trip);
});
// Transfer organizer role to another joined member
router.post('/:tripId/transfer-host', auth_1.requireAuth, trip_1.requireTripMember, trip_1.requireOrganizer, async (req, res) => {
    const { new_organizer_user_id } = req.body;
    if (!new_organizer_user_id)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'new_organizer_user_id is required');
    const trip = await prisma_1.default.trip.findUnique({ where: { id: (0, params_1.param)(req, 'tripId') } });
    if (!trip)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Trip not found');
    const target = await prisma_1.default.tripMember.findUnique({
        where: { trip_id_user_id: { trip_id: (0, params_1.param)(req, 'tripId'), user_id: new_organizer_user_id } },
    });
    if (!target || target.status !== 'joined')
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Member not found or has not joined the trip');
    if (target.user_id === trip.organizer_id)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'This member is already the organizer');
    const targetUser = await prisma_1.default.user.findUnique({
        where: { id: new_organizer_user_id },
        select: { is_guest: true },
    });
    if (targetUser?.is_guest)
        return (0, response_1.err)(res, 403, 'FORBIDDEN', 'The new organizer must have linked an email to their account');
    const [updatedTrip] = await prisma_1.default.$transaction([
        prisma_1.default.trip.update({ where: { id: trip.id }, data: { organizer_id: new_organizer_user_id } }),
        prisma_1.default.tripMember.update({ where: { id: target.id }, data: { role: 'organizer' } }),
        prisma_1.default.tripMember.update({
            where: { trip_id_user_id: { trip_id: (0, params_1.param)(req, 'tripId'), user_id: trip.organizer_id } },
            data: { role: 'member' },
        }),
    ]);
    return (0, response_1.ok)(res, updatedTrip);
});
// Delete trip (cascades to all trip-scoped data)
router.delete('/:tripId', auth_1.requireAuth, trip_1.requireTripMember, trip_1.requireOrganizer, async (req, res) => {
    await prisma_1.default.trip.delete({ where: { id: (0, params_1.param)(req, 'tripId') } });
    return (0, response_1.ok)(res, { deleted: true });
});
exports.default = router;
