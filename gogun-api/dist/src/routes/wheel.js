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
router.get('/', async (req, res) => {
    const options = await prisma_1.default.wheelOption.findMany({
        where: { trip_id: (0, params_1.param)(req, 'tripId') },
        orderBy: { sort_order: 'asc' },
    });
    return (0, response_1.ok)(res, options);
});
router.post('/', async (req, res) => {
    const { text, color, sort_order } = req.body;
    if (!text || !color)
        return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'text and color are required');
    const option = await prisma_1.default.wheelOption.create({
        data: {
            trip_id: (0, params_1.param)(req, 'tripId'),
            text,
            color,
            sort_order: sort_order ?? 0,
        },
    });
    return (0, response_1.ok)(res, option, 201);
});
router.delete('/', async (req, res) => {
    await prisma_1.default.wheelOption.deleteMany({ where: { trip_id: (0, params_1.param)(req, 'tripId') } });
    return (0, response_1.ok)(res, { deleted: true });
});
router.delete('/:optId', async (req, res) => {
    const option = await prisma_1.default.wheelOption.findFirst({
        where: { id: (0, params_1.param)(req, 'optId'), trip_id: (0, params_1.param)(req, 'tripId') },
    });
    if (!option)
        return (0, response_1.err)(res, 404, 'NOT_FOUND', 'Option not found');
    await prisma_1.default.wheelOption.delete({ where: { id: (0, params_1.param)(req, 'optId') } });
    return (0, response_1.ok)(res, { deleted: true });
});
exports.default = router;
