import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireOrganizer } from '../middleware/trip'
import { ok, err } from '../lib/response'

const router = Router({ mergeParams: true })

const memberSelect = { id: true, display_name: true, avatar_color: true }

// List polls
router.get('/', async (req, res) => {
  const polls = await prisma.poll.findMany({
    where: { trip_id: req.params.tripId },
    include: {
      options: {
        include: { votes: { include: { user: { select: memberSelect } } } },
        orderBy: { sort_order: 'asc' },
      },
      votes: { where: { user_id: req.user!.id } },
    },
    orderBy: { created_at: 'desc' },
  })
  return ok(res, polls.map(({ votes: myVotes, ...p }) => ({
    ...p,
    close_date: p.close_date?.toISOString().slice(0, 10) ?? null,
    options: p.options.map(({ votes, ...o }) => ({
      ...o,
      vote_count: votes.length,
      voters: votes.map(v => v.user),
    })),
    my_vote_option_id: myVotes[0]?.option_id ?? null,
  })))
})

// Create poll (organizer only)
router.post('/', requireOrganizer, async (req, res) => {
  const { title, subtitle, close_date, options } = req.body as {
    title?: string
    subtitle?: string
    close_date?: string
    options?: Array<{ text: string; sort_order?: number }>
  }
  if (!title) return err(res, 400, 'VALIDATION_ERROR', 'title is required')

  const poll = await prisma.poll.create({
    data: {
      trip_id: req.params.tripId,
      title,
      subtitle,
      close_date: close_date ? new Date(close_date) : null,
      created_by_user_id: req.user!.id,
      options: options
        ? { create: options.map((o, i) => ({ text: o.text, sort_order: o.sort_order ?? i })) }
        : undefined,
    },
    include: { options: { orderBy: { sort_order: 'asc' } } },
  })
  return ok(res, poll, 201)
})

// Update poll
router.patch('/:pollId', requireOrganizer, async (req, res) => {
  const poll = await prisma.poll.findFirst({
    where: { id: req.params.pollId, trip_id: req.params.tripId },
  })
  if (!poll) return err(res, 404, 'NOT_FOUND', 'Poll not found')

  const { title, subtitle, status } = req.body as {
    title?: string
    subtitle?: string
    status?: string
  }
  const updated = await prisma.poll.update({
    where: { id: req.params.pollId },
    data: {
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(status !== undefined && { status }),
    },
  })
  return ok(res, updated)
})

// Delete poll
router.delete('/:pollId', requireOrganizer, async (req, res) => {
  const poll = await prisma.poll.findFirst({
    where: { id: req.params.pollId, trip_id: req.params.tripId },
  })
  if (!poll) return err(res, 404, 'NOT_FOUND', 'Poll not found')
  await prisma.poll.delete({ where: { id: req.params.pollId } })
  return ok(res, { deleted: true })
})

// Get poll detail with vote counts
router.get('/:pollId', async (req, res) => {
  const poll = await prisma.poll.findFirst({
    where: { id: req.params.pollId, trip_id: req.params.tripId },
    include: {
      options: {
        include: {
          votes: { include: { user: { select: memberSelect } } },
        },
        orderBy: { sort_order: 'asc' },
      },
      votes: true,
    },
  })
  if (!poll) return err(res, 404, 'NOT_FOUND', 'Poll not found')

  const myVote = poll.votes.find(v => v.user_id === req.user!.id)
  const maxVotes = Math.max(0, ...poll.options.map(o => o.votes.length))

  return ok(res, {
    poll: {
      id: poll.id,
      title: poll.title,
      subtitle: poll.subtitle,
      status: poll.status,
      close_date: poll.close_date?.toISOString().slice(0, 10) ?? null,
    },
    total_voters: new Set(poll.votes.map(v => v.user_id)).size,
    options: poll.options.map(o => ({
      id: o.id,
      text: o.text,
      sort_order: o.sort_order,
      vote_count: o.votes.length,
      voters: o.votes.map(v => ({
        user_id: v.user_id,
        display_name: v.user.display_name,
        avatar_color: v.user.avatar_color,
      })),
      ...(poll.status === 'closed' && {
        is_winner: o.votes.length === maxVotes && maxVotes > 0,
      }),
    })),
    my_vote_option_id: myVote?.option_id ?? null,
  })
})

// Vote (cast or change vote)
router.post('/:pollId/vote', async (req, res) => {
  const poll = await prisma.poll.findFirst({
    where: { id: req.params.pollId, trip_id: req.params.tripId },
  })
  if (!poll) return err(res, 404, 'NOT_FOUND', 'Poll not found')
  if (poll.status === 'closed') return err(res, 409, 'CONFLICT', 'Poll is closed')

  const { option_id } = req.body as { option_id?: string }
  if (!option_id) return err(res, 400, 'VALIDATION_ERROR', 'option_id is required')

  const option = await prisma.pollOption.findFirst({
    where: { id: option_id, poll_id: req.params.pollId },
  })
  if (!option) return err(res, 404, 'NOT_FOUND', 'Option not found')

  const vote = await prisma.pollVote.upsert({
    where: {
      poll_id_user_id: { poll_id: req.params.pollId, user_id: req.user!.id },
    },
    create: {
      poll_id: req.params.pollId,
      option_id,
      user_id: req.user!.id,
    },
    update: { option_id, voted_at: new Date() },
  })
  return ok(res, vote)
})

// Unvote
router.delete('/:pollId/vote', async (req, res) => {
  const poll = await prisma.poll.findFirst({
    where: { id: req.params.pollId, trip_id: req.params.tripId },
  })
  if (!poll) return err(res, 404, 'NOT_FOUND', 'Poll not found')

  const existing = await prisma.pollVote.findUnique({
    where: {
      poll_id_user_id: { poll_id: req.params.pollId, user_id: req.user!.id },
    },
  })
  if (!existing) return err(res, 404, 'NOT_FOUND', 'Vote not found')

  await prisma.pollVote.delete({ where: { id: existing.id } })
  return ok(res, { deleted: true })
})

export default router
