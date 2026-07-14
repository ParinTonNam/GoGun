"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_1 = require("../lib/jwt");
const prisma_1 = __importDefault(require("../lib/prisma"));
const response_1 = require("../lib/response");
async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        (0, response_1.err)(res, 401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
        return;
    }
    const token = header.slice(7);
    try {
        const { sub } = (0, jwt_1.verifyToken)(token);
        const user = await prisma_1.default.user.findUnique({ where: { id: sub } });
        if (!user) {
            (0, response_1.err)(res, 401, 'UNAUTHORIZED', 'User not found');
            return;
        }
        req.user = user;
        next();
    }
    catch {
        (0, response_1.err)(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
    }
}
