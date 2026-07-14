"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCode = generateCode;
exports.setOtp = setOtp;
exports.verifyOtp = verifyOtp;
const store = new Map();
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function setOtp(phone, code) {
    store.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
}
function verifyOtp(phone, code) {
    const entry = store.get(phone);
    if (!entry)
        return false;
    if (Date.now() > entry.expires) {
        store.delete(phone);
        return false;
    }
    if (entry.code !== code)
        return false;
    store.delete(phone);
    return true;
}
