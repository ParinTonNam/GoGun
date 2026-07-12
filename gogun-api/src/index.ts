import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
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

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static file serving for uploads
const uploadsDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(path.join(uploadsDir, 'slips'), { recursive: true })
fs.mkdirSync(path.join(uploadsDir, 'qr'), { recursive: true })
app.use('/uploads', express.static(uploadsDir))

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

// API Docs
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
