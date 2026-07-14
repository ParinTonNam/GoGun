import type { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'
import { err } from '../lib/response'
import { param } from '../lib/params'

export async function requireTripMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const tripId = param(req, 'tripId')
  if (!tripId) {
    err(res, 400, 'VALIDATION_ERROR', 'tripId param missing')
    return
  }
  const member = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id: tripId, user_id: req.user!.id } },
  })
  if (!member || member.status === 'declined') {
    err(res, 403, 'FORBIDDEN', 'You are not a member of this trip')
    return
  }
  req.tripMember = member
  next()
}

export function requireOrganizer(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.tripMember?.role !== 'organizer') {
    err(res, 403, 'FORBIDDEN', 'Only the trip organizer can perform this action')
    return
  }
  next()
}
