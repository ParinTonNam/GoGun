"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const trip_1 = require("../middleware/trip");
const response_1 = require("../lib/response");
const params_1 = require("../lib/params");
const router = (0, express_1.Router)({ mergeParams: true });
// List all days + activities
router.get('/', async (req, res) => {
    const days = await prisma_1.default.itineraryDay.findMany({
        where: { trip_id: (0, params_1.param)(req, 'tripId') },
        include: {
            activities: { orderBy: { sort_order: 'asc' } },
        },
        orderBy: { day_number: 'asc' },
    });
    return (0, response_1.ok)(res, days);
});
// Swap two days' order (3-step to avoid unique constraint on day_number)
router.post('/days/swap', trip_1.requireOrganizer, async (req, res) => {
    const { day_id_a, day_id_b } = req.body;
    if (!day_id_a || !day_id_b)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'day_id_a and day_id_b are required');
    const [dayA, dayB] = await Promise.all([
        prisma_1.default.itineraryDay.findFirst({ where: { id: day_id_a, trip_id: (0, params_1.param)(req, 'tripId') } }),
        prisma_1.default.itineraryDay.findFirst({ where: { id: day_id_b, trip_id: (0, params_1.param)(req, 'tripId') } }),
    ]);
    if (!dayA || !dayB)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Day not found');
    await prisma_1.default.$transaction([
        prisma_1.default.itineraryDay.update({ where: { id: day_id_a }, data: { day_number: -1 } }),
        prisma_1.default.itineraryDay.update({ where: { id: day_id_b }, data: { day_number: dayA.day_number } }),
        prisma_1.default.itineraryDay.update({ where: { id: day_id_a }, data: { day_number: dayB.day_number } }),
    ]);
    return (0, response_1.ok)(res, { swapped: true });
});
// Add day
router.post('/days', trip_1.requireOrganizer, async (req, res) => {
    const { day_number, date, label } = req.body;
    if (!day_number || !date || !label)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'day_number, date, label are required');
    const day = await prisma_1.default.itineraryDay.create({
        data: {
            trip_id: (0, params_1.param)(req, 'tripId'),
            day_number,
            date: new Date(date),
            label,
        },
        include: { activities: true },
    });
    return (0, response_1.ok)(res, day, 201);
});
// Update day
router.patch('/days/:dayId', trip_1.requireOrganizer, async (req, res) => {
    const { label, date, day_number } = req.body;
    const day = await prisma_1.default.itineraryDay.findFirst({
        where: { id: (0, params_1.param)(req, 'dayId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!day)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Day not found');
    const updated = await prisma_1.default.itineraryDay.update({
        where: { id: (0, params_1.param)(req, 'dayId') },
        data: {
            ...(label !== undefined && { label }),
            ...(date !== undefined && { date: new Date(date) }),
            ...(day_number !== undefined && { day_number }),
        },
        include: { activities: { orderBy: { sort_order: 'asc' } } },
    });
    return (0, response_1.ok)(res, updated);
});
// Delete day (cascade deletes its activities) + compact remaining day_numbers
router.delete('/days/:dayId', trip_1.requireOrganizer, async (req, res) => {
    const day = await prisma_1.default.itineraryDay.findFirst({
        where: { id: (0, params_1.param)(req, 'dayId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!day)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Day not found');
    const tripId = (0, params_1.param)(req, 'tripId');
    await prisma_1.default.$transaction(async (tx) => {
        await tx.itineraryDay.delete({ where: { id: day.id } });
        // เลื่อนวันที่อยู่หลังวันที่ลบลง 1 เพื่อให้ day_number ต่อเนื่อง (กันชน @@unique)
        const rest = await tx.itineraryDay.findMany({
            where: { trip_id: tripId, day_number: { gt: day.day_number } },
            orderBy: { day_number: 'asc' },
        });
        for (const d of rest) {
            await tx.itineraryDay.update({
                where: { id: d.id },
                data: { day_number: d.day_number - 1 },
            });
        }
    });
    return (0, response_1.ok)(res, { deleted: true });
});
// Add activity to day
router.post('/days/:dayId/activities', trip_1.requireOrganizer, async (req, res) => {
    const { time, title, sort_order } = req.body;
    if (!time || !title)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'time and title are required');
    const day = await prisma_1.default.itineraryDay.findFirst({
        where: { id: (0, params_1.param)(req, 'dayId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!day)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Day not found');
    const activity = await prisma_1.default.itineraryActivity.create({
        data: { day_id: (0, params_1.param)(req, 'dayId'), time, title, sort_order: sort_order ?? 0 },
    });
    return (0, response_1.ok)(res, activity, 201);
});
// Edit activity
router.patch('/activities/:actId', trip_1.requireOrganizer, async (req, res) => {
    const { time, title, sort_order } = req.body;
    const activity = await prisma_1.default.itineraryActivity.findUnique({
        where: { id: (0, params_1.param)(req, 'actId') },
        include: { day: true },
    });
    if (!activity || activity.day.trip_id !== (0, params_1.param)(req, 'tripId'))
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Activity not found');
    const updated = await prisma_1.default.itineraryActivity.update({
        where: { id: (0, params_1.param)(req, 'actId') },
        data: {
            ...(time !== undefined && { time }),
            ...(title !== undefined && { title }),
            ...(sort_order !== undefined && { sort_order }),
        },
    });
    return (0, response_1.ok)(res, updated);
});
// Delete activity
router.delete('/activities/:actId', trip_1.requireOrganizer, async (req, res) => {
    const activity = await prisma_1.default.itineraryActivity.findUnique({
        where: { id: (0, params_1.param)(req, 'actId') },
        include: { day: true },
    });
    if (!activity || activity.day.trip_id !== (0, params_1.param)(req, 'tripId'))
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Activity not found');
    await prisma_1.default.itineraryActivity.delete({ where: { id: (0, params_1.param)(req, 'actId') } });
    return (0, response_1.ok)(res, { deleted: true });
});
// Reorder activity
router.patch('/activities/:actId/reorder', trip_1.requireOrganizer, async (req, res) => {
    const { sort_order } = req.body;
    if (sort_order === undefined)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'sort_order is required');
    const activity = await prisma_1.default.itineraryActivity.findUnique({
        where: { id: (0, params_1.param)(req, 'actId') },
        include: { day: true },
    });
    if (!activity || activity.day.trip_id !== (0, params_1.param)(req, 'tripId'))
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Activity not found');
    const updated = await prisma_1.default.itineraryActivity.update({
        where: { id: (0, params_1.param)(req, 'actId') },
        data: { sort_order },
    });
    return (0, response_1.ok)(res, updated);
});
exports.default = router;
