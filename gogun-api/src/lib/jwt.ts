import jwt from 'jsonwebtoken'

// No fallback — a hardcoded default secret in a public repo would let anyone
// forge tokens. Fail fast at startup instead of running insecurely.
const envSecret = process.env.JWT_SECRET
if (!envSecret || envSecret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters')
}
const SECRET: string = envSecret

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: '7d' })
}

export function signGuestToken(userId: string): string {
  return jwt.sign({ sub: userId, guest: true }, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { sub: string; guest?: boolean } {
  return jwt.verify(token, SECRET, { maxAge: '7d' }) as { sub: string; guest?: boolean }
}
