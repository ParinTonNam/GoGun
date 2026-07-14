"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./swagger"));
const auth_1 = require("./middleware/auth");
const trip_1 = require("./middleware/trip");
const auth_2 = __importDefault(require("./routes/auth"));
const trips_1 = __importDefault(require("./routes/trips"));
const members_1 = __importDefault(require("./routes/members"));
const itinerary_1 = __importDefault(require("./routes/itinerary"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const transfers_1 = __importDefault(require("./routes/transfers"));
const paymentMethods_1 = __importDefault(require("./routes/paymentMethods"));
const availability_1 = __importDefault(require("./routes/availability"));
const polls_1 = __importDefault(require("./routes/polls"));
const packing_1 = __importDefault(require("./routes/packing"));
const checklist_1 = __importDefault(require("./routes/checklist"));
const wheel_1 = __importDefault(require("./routes/wheel"));
const notes_1 = __importDefault(require("./routes/notes"));
const app = (0, express_1.default)();
// Behind a proxy (e.g. Render/Nginx) the client IP arrives in X-Forwarded-For.
// Trust one hop so the rate limiter keys on the real client, not the proxy.
app.set('trust proxy', 1);
// Security headers on every response.
app.use((0, helmet_1.default)());
// CORS — only the frontend origins listed in CORS_ORIGIN (comma-separated)
// may call the API from a browser; everything else gets no CORS headers.
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
// General rate limit — a loose ceiling to blunt abuse/DoS across the API.
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static file serving for uploads. Uploaded files are user content, so force
// the browser to (a) never MIME-sniff them into executable types and (b) treat
// them as downloads rather than rendering inline — this neutralises any file
// that slips past the upload filter (stored-XSS defence in depth).
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
fs_1.default.mkdirSync(path_1.default.join(uploadsDir, 'slips'), { recursive: true });
fs_1.default.mkdirSync(path_1.default.join(uploadsDir, 'qr'), { recursive: true });
app.use('/uploads', express_1.default.static(uploadsDir, {
    setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'attachment');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
    },
}));
// Strict rate limit on auth — login/register are the brute-force surface.
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
});
// Auth routes (per-route auth in the router)
app.use('/api/v1/auth', authLimiter, auth_2.default);
// Trip top-level routes (GET /join/:code is public; rest are per-route guarded)
app.use('/api/v1/trips', trips_1.default);
// Trip sub-resources — all require auth + trip membership
const tripBase = '/api/v1/trips/:tripId';
app.use(`${tripBase}/members`, auth_1.requireAuth, trip_1.requireTripMember, members_1.default);
app.use(`${tripBase}/itinerary`, auth_1.requireAuth, trip_1.requireTripMember, itinerary_1.default);
app.use(`${tripBase}/expenses`, auth_1.requireAuth, trip_1.requireTripMember, expenses_1.default);
app.use(`${tripBase}/transfers`, auth_1.requireAuth, trip_1.requireTripMember, transfers_1.default);
app.use(`${tripBase}/payment-methods`, auth_1.requireAuth, trip_1.requireTripMember, paymentMethods_1.default);
app.use(`${tripBase}/availability`, auth_1.requireAuth, trip_1.requireTripMember, availability_1.default);
app.use(`${tripBase}/polls`, auth_1.requireAuth, trip_1.requireTripMember, polls_1.default);
app.use(`${tripBase}/packing`, auth_1.requireAuth, trip_1.requireTripMember, packing_1.default);
app.use(`${tripBase}/checklist`, auth_1.requireAuth, trip_1.requireTripMember, checklist_1.default);
app.use(`${tripBase}/wheel`, auth_1.requireAuth, trip_1.requireTripMember, wheel_1.default);
app.use(`${tripBase}/notes`, auth_1.requireAuth, trip_1.requireTripMember, notes_1.default);
// API Docs — Swagger UI relies on inline scripts/styles, which helmet's
// default Content-Security-Policy blocks, so disable CSP for this route only.
app.use('/api/docs', (0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    customSiteTitle: 'GoGun API Docs',
    swaggerOptions: { persistAuthorization: true },
}));
app.get('/api/docs.json', (_req, res) => res.json(swagger_1.default));
// 404
app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`GoGun API running on http://localhost:${PORT}`);
});
