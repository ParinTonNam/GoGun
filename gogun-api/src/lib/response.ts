import { randomInt } from 'crypto'
import type { Response } from 'express'

export function ok(
  res: Response,
  data: unknown,
  statusCode = 200,
  meta?: Record<string, unknown>,
) {
  return res.status(statusCode).json({ data, ...(meta ? { meta } : {}) })
}

export function err(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
) {
  return res.status(statusCode).json({ error: { code, message } })
}

export function maskPhone(phone: string): string {
  if (phone.length <= 3) return phone
  return phone.slice(0, -3) + '***'
}

// Invite codes are the only thing guarding trip data (preview and claim need
// no auth), so they must be unguessable: CSPRNG, 12 chars of a-z0-9 ≈ 62 bits.
const INVITE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const INVITE_CODE_LENGTH = 12

export function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)]
  }
  return code
}
