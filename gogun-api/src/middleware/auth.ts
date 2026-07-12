import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import prisma from '../lib/prisma'
import { err } from '../lib/response'

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    err(res, 401, 'UNAUTHORIZED', 'Missing or invalid Authorization header')
    return
  }
  const token = header.slice(7)
  try {
    const { sub } = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: sub } })
    if (!user) {
      err(res, 401, 'UNAUTHORIZED', 'User not found')
      return
    }
    req.user = user
    next()
  } catch {
    err(res, 401, 'UNAUTHORIZED', 'Invalid or expired token')
  }
}
