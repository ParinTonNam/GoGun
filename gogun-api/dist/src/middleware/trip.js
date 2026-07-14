"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTripMember = requireTripMember;
exports.requireOrganizer = requireOrganizer;
const prisma_1 = __importDefault(require("../lib/prisma"));
const response_1 = require("../lib/response");
const params_1 = require("../lib/params");
async function requireTripMember(req, res, next) {
    const tripId = (0, params_1.param)(req, 'tripId');
    if (!tripId) {
        (0, response_1.err)(res, 400, 'VALIDATION_ERROR', 'tripId param missing');
        return;
    }
    const member = await prisma_1.default.tripMember.findUnique({
        where: { trip_id_user_id: { trip_id: tripId, user_id: req.user.id } },
    });
    if (!member || member.status === 'declined') {
        (0, response_1.err)(res, 403, 'FORBIDDEN', 'You are not a member of this trip');
        return;
    }
    req.tripMember = member;
    next();
}
function requireOrganizer(req, res, next) {
    if (req.tripMember?.role !== 'organizer') {
        (0, response_1.err)(res, 403, 'FORBIDDEN', 'Only the trip organizer can perform this action');
        return;
    }
    next();
}
