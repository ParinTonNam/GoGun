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

// แก้ itinerary ได้ถ้าเป็น organizer หรือทริปเปิดสิทธิ์ให้สมาชิกแก้ร่วมกัน
// (allow_member_itinerary_edit). ใช้แทน requireOrganizer เฉพาะ route แก้ itinerary
export async function requireItineraryEditor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.tripMember?.role === 'organizer') {
    next()
    return
  }
  const trip = await prisma.trip.findUnique({
    where: { id: param(req, 'tripId') },
    select: { allow_member_itinerary_edit: true },
  })
  if (!trip?.allow_member_itinerary_edit) {
    err(res, 403, 'FORBIDDEN', 'Editing the itinerary is limited to the organizer for this trip')
    return
  }
  next()
}

// Requires requireTripMember to run first, as with requireItineraryEditor.
export async function requireExpenseEditor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.tripMember?.role === 'organizer') {
    next()
    return
  }
  const trip = await prisma.trip.findUnique({
    where: { id: param(req, 'tripId') },
    select: { allow_member_expenses: true },
  })
  if (!trip?.allow_member_expenses) {
    err(res, 403, 'FORBIDDEN', 'Editing expenses is limited to the organizer for this trip')
    return
  }
  next()
}

export async function requirePollCreator(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.tripMember?.role === 'organizer') {
    next()
    return
  }
  const trip = await prisma.trip.findUnique({
    where: { id: param(req, 'tripId') },
    select: { allow_member_polls: true },
  })
  if (trip?.allow_member_polls === false) {
    err(res, 403, 'FORBIDDEN', 'Creating polls is limited to the organizer for this trip')
    return
  }
  next()
}

export async function requireQuestCreator(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.tripMember?.role === 'organizer') {
    next()
    return
  }
  const trip = await prisma.trip.findUnique({
    where: { id: param(req, 'tripId') },
    select: { allow_member_quests: true },
  })
  if (trip?.allow_member_quests === false) {
    err(res, 403, 'FORBIDDEN', 'Starting events is limited to the organizer for this trip')
    return
  }
  next()
}

