import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger'

import { requireAuth } from './middleware/auth'
import { requireTripMember } from './middleware/trip'

import authRouter from './routes/auth'
import tripsRouter from './routes/trips'
import membersRouter from './routes/members'
import itineraryRouter from './routes/itinerary'
import expensesRouter from './routes/expenses'
import transfersRouter from './routes/transfers'
import paymentMethodsRouter from './routes/paymentMethods'
import availabilityRouter from './routes/availability'
import pollsRouter from './routes/polls'
import packingRouter from './routes/packing'
import checklistRouter from './routes/checklist'
import wheelRouter from './routes/wheel'
import notesRouter from './routes/notes'

const app = express()

// Behind a proxy (e.g. Render/Nginx) the client IP arrives in X-Forwarded-For.
// Trust one hop so the rate limiter keys on the real client, not the proxy.
app.set('trust proxy', 1)

// Security headers on every response.
app.use(helmet())

// CORS — only the frontend origins listed in CORS_ORIGIN (comma-separated)
// may call the API from a browser; everything else gets no CORS headers.
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
app.use(cors({ origin: allowedOrigins, credentials: true }))

// General rate limit — a loose ceiling to blunt abuse/DoS across the API.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Strict rate limit on credential endpoints — login/register/link are the
// brute-force surface. Must NOT cover /auth/me, which the frontend calls on
// nearly every page load and would exhaust this limit in normal use.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
})
app.use('/api/v1/auth/login', authLimiter)
app.use('/api/v1/auth/register', authLimiter)
app.use('/api/v1/auth/link', authLimiter)

// Auth routes (per-route auth in the router)
app.use('/api/v1/auth', authRouter)

// Trip top-level routes (GET /join/:code is public; rest are per-route guarded)
app.use('/api/v1/trips', tripsRouter)

// Trip sub-resources — all require auth + trip membership
const tripBase = '/api/v1/trips/:tripId'
app.use(`${tripBase}/members`, requireAuth, requireTripMember, membersRouter)
app.use(`${tripBase}/itinerary`, requireAuth, requireTripMember, itineraryRouter)
app.use(`${tripBase}/expenses`, requireAuth, requireTripMember, expensesRouter)
app.use(`${tripBase}/transfers`, requireAuth, requireTripMember, transfersRouter)
app.use(`${tripBase}/payment-methods`, requireAuth, requireTripMember, paymentMethodsRouter)
app.use(`${tripBase}/availability`, requireAuth, requireTripMember, availabilityRouter)
app.use(`${tripBase}/polls`, requireAuth, requireTripMember, pollsRouter)
app.use(`${tripBase}/packing`, requireAuth, requireTripMember, packingRouter)
app.use(`${tripBase}/checklist`, requireAuth, requireTripMember, checklistRouter)
app.use(`${tripBase}/wheel`, requireAuth, requireTripMember, wheelRouter)
app.use(`${tripBase}/notes`, requireAuth, requireTripMember, notesRouter)

// API Docs — Swagger UI relies on inline scripts/styles, which helmet's
// default Content-Security-Policy blocks, so disable CSP for this route only.
app.use('/api/docs', helmet({ contentSecurityPolicy: false }))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'GoGun API Docs',
  swaggerOptions: { persistAuthorization: true },
}))
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec))

// 404
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`GoGun API running on http://localhost:${PORT}`)
})
