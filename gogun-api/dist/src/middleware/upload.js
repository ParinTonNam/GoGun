"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadQr = exports.uploadSlip = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const response_1 = require("../lib/response");
// Only real image uploads are allowed. Anything else (.html, .svg, .php, …)
// could be served back from /uploads and executed in the victim's browser
// (stored XSS), so we whitelist both the MIME type and the extension.
const ALLOWED = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
function diskStorage(subdir) {
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            const dir = path_1.default.join(process.cwd(), 'uploads', subdir);
            fs_1.default.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (_req, file, cb) => {
            // Derive the extension from the (validated) MIME type, never from the
            // client-supplied originalname — that stops path/extension smuggling.
            const ext = ALLOWED.get(file.mimetype) ?? '';
            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
    });
}
const fileFilter = (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
};
function imageUpload(subdir) {
    return (0, multer_1.default)({
        storage: diskStorage(subdir),
        fileFilter,
        limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    });
}
// Wrap multer's single-file handler so its rejections (size limit, bad MIME
// type) become a clean 400 instead of falling through to the generic 500
// error handler.
function singleImage(upload, field) {
    const handler = upload.single(field);
    return (req, res, next) => {
        handler(req, res, (e) => {
            if (!e)
                return next();
            if (e instanceof multer_1.default.MulterError) {
                const message = e.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : e.message;
                return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', message);
            }
            if (e instanceof Error)
                return (0, response_1.err)(res, 400, 'VALIDATION_ERROR', e.message);
            next(e);
        });
    };
}
exports.uploadSlip = singleImage(imageUpload('slips'), 'slip');
exports.uploadQr = singleImage(imageUpload('qr'), 'qr');
