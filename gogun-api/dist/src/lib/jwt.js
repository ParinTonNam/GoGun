"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// No fallback — a hardcoded default secret in a public repo would let anyone
// forge tokens. Fail fast at startup instead of running insecurely.
const envSecret = process.env.JWT_SECRET;
if (!envSecret || envSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
}
const SECRET = envSecret;
function signToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId }, SECRET, { expiresIn: '90d' });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, SECRET);
}
