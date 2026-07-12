import { Router } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { requireAuth } from '../middleware/auth'
import { ok, err } from '../lib/response'

const router = Router()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body as {
    username?: string
    email?: string
    password?: string
  }

  if (!username?.trim() || !email?.trim() || !password)
    return err(res, 400, 'VALIDATION_ERROR', 'username, email and password are required')

  if (!EMAIL_REGEX.test(email.trim()))
    return err(res, 400, 'VALIDATION_ERROR', 'email is not a valid email address')

  if (password.length < 8)
    return err(res, 400, 'VALIDATION_ERROR', 'password must be at least 8 characters')

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: username.trim() }, { email: email.trim().toLowerCase() }] },
  })
  if (existing) {
    const field = existing.username === username.trim() ? 'Username' : 'Email'
    return err(res, 409, 'CONFLICT', `${field} is already taken`)
  }

  const password_hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      display_name: username.trim(),
      avatar_color: randomColor(),
    },
  })

  const token = signToken(user.id)
  return ok(res, { token, user: serializeUser(user) })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username?.trim() || !password)
    return err(res, 400, 'VALIDATION_ERROR', 'username and password are required')

  // Accept either username or email — guests who linked an email never chose
  // a username, so email is their only credential.
  const identifier = username.trim()
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
  })
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return err(res, 401, 'UNAUTHORIZED', 'Invalid username or password')

  const token = signToken(user.id)
  return ok(res, { token, user: serializeUser(user) })
})

// Link an email + password to a guest account, turning it into a permanent
// account. Locks the guest's name on invite pages (no longer claimable).
router.post('/link', requireAuth, async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!req.user!.is_guest)
    return err(res, 409, 'CONFLICT', 'This account is already linked to an email')

  if (!email?.trim() || !password)
    return err(res, 400, 'VALIDATION_ERROR', 'email and password are required')

  if (!EMAIL_REGEX.test(email.trim()))
    return err(res, 400, 'VALIDATION_ERROR', 'email is not a valid email address')

  if (password.length < 8)
    return err(res, 400, 'VALIDATION_ERROR', 'password must be at least 8 characters')

  const normalized = email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: normalized } })
  if (existing && existing.id !== req.user!.id)
    return err(res, 409, 'CONFLICT', 'Email is already taken')

  const password_hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { email: normalized, password_hash, is_guest: false },
  })

  return ok(res, serializeUser(user))
})

router.get('/me', requireAuth, (req, res) => {
  return ok(res, serializeUser(req.user!))
})

router.patch('/me', requireAuth, async (req, res) => {
  const { display_name, email, phone } = req.body as {
    display_name?: string
    email?: string
    phone?: string
  }

  if (display_name !== undefined && !display_name.trim())
    return err(res, 400, 'VALIDATION_ERROR', 'display_name cannot be empty')

  if (email !== undefined) {
    if (!email.trim())
      return err(res, 400, 'VALIDATION_ERROR', 'email cannot be empty')
    if (!EMAIL_REGEX.test(email.trim()))
      return err(res, 400, 'VALIDATION_ERROR', 'email is not a valid email address')
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing && existing.id !== req.user!.id)
      return err(res, 409, 'CONFLICT', 'Email is already taken')
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(display_name !== undefined && { display_name: display_name.trim() }),
      ...(email !== undefined && { email: email.trim().toLowerCase() }),
      ...(phone !== undefined && { phone: phone.trim() || null }),
    },
  })

  return ok(res, serializeUser(user))
})

function serializeUser(user: {
  id: string
  username: string
  email: string
  display_name: string
  avatar_color: string
  phone: string | null
  is_guest: boolean
  created_at: Date
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar_color: user.avatar_color,
    phone: user.phone,
    is_guest: user.is_guest,
    created_at: user.created_at,
  }
}

const COLORS = [
  '#c0613e', '#4f6e7a', '#7b8b57', '#8a6e9e',
  '#d4a04a', '#5b8fa8', '#b06a6a', '#5a7a5a',
]
function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

export default router
