import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'gogun-dev-secret'

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: '90d' })
}

export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, SECRET) as { sub: string }
}
