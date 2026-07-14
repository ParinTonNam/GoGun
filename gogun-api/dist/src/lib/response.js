"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.err = err;
exports.maskPhone = maskPhone;
exports.generateInviteCode = generateInviteCode;
const crypto_1 = require("crypto");
function ok(res, data, statusCode = 200, meta) {
    return res.status(statusCode).json({ data, ...(meta ? { meta } : {}) });
}
function err(res, statusCode, code, message) {
    return res.status(statusCode).json({ error: { code, message } });
}
function maskPhone(phone) {
    if (phone.length <= 3)
        return phone;
    return phone.slice(0, -3) + '***';
}
// Invite codes are the only thing guarding trip data (preview and claim need
// no auth), so they must be unguessable: CSPRNG, 12 chars of a-z0-9 ≈ 62 bits.
const INVITE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const INVITE_CODE_LENGTH = 12;
function generateInviteCode() {
    let code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        code += INVITE_ALPHABET[(0, crypto_1.randomInt)(INVITE_ALPHABET.length)];
    }
    return code;
}
