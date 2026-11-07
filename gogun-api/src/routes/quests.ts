import { Router } from 'express'
import prisma from '../lib/prisma'
import { requireOrganizer, requireQuestCreator } from '../middleware/trip'
import { param } from '../lib/params'
import { ok, err } from '../lib/response'
import { questDraft, validCompleted } from '../lib/quest-validation'
const router = Router({ mergeParams: true })
router.use((req, res, next) => {
  if (req.tripMember?.status !== 'joined') return err(res, 403, 'FORBIDDEN', 'เข้าร่วมทริปก่อนเล่นเควส')
  next()
})
router.get('/', async (req, res) => {
  const trip_id = param(req, 'tripId')
  const quests = await prisma.quest.findMany({ where: { trip_id }, orderBy: { created_at: 'desc' }, include: {
    progress: { where: { user: { trip_memberships: { some: { trip_id, status: 'joined' } } } }, include: { user: { select: { id: true, display_name: true, avatar_color: true } } } },
  } })
  return ok(res, quests)
})
router.post('/', requireQuestCreator, async (req, res) => {
  const data = questDraft(req.body)
  if (!data) return err(res, 400, 'VALIDATION_ERROR', 'กรอกชื่อเควสและเป้าหมายไม่ซ้ำกัน 1–12 ข้อ')
  return ok(res, await prisma.quest.create({ data: { trip_id: param(req, 'tripId'), ...data }, include: { progress: true } }), 201)
})
router.patch('/:questId', requireOrganizer, async (req, res) => {
  if (typeof req.body?.closed !== 'boolean') return err(res, 400, 'VALIDATION_ERROR', 'กรุณาระบุสถานะเควส')
  const result = await prisma.quest.updateMany({ where: { id: param(req, 'questId'), trip_id: param(req, 'tripId') }, data: { closed: req.body.closed } })
  if (!result.count) return err(res, 404, 'NOT_FOUND', 'ไม่พบเควสในทริปนี้')
  return ok(res, { closed: req.body.closed })
})
router.delete('/:questId', requireOrganizer, async (req, res) => {
  const result = await prisma.quest.deleteMany({ where: { id: param(req, 'questId'), trip_id: param(req, 'tripId') } })
  if (!result.count) return err(res, 404, 'NOT_FOUND', 'ไม่พบเควสในทริปนี้')
  return ok(res, { deleted: true })
})
router.put('/:questId/progress', async (req, res) => {
  const questId = param(req, 'questId'), tripId = param(req, 'tripId')
  const result = await prisma.$transaction(async tx => {
    // Lock against organizer closing/deleting while a member marks a target.
    await tx.$queryRaw`SELECT id FROM quests WHERE id = ${questId}::uuid AND trip_id = ${tripId}::uuid FOR UPDATE`
    const quest = await tx.quest.findFirst({ where: { id: questId, trip_id: tripId } })
    if (!quest) return { error: 'missing' } as const
    if (quest.closed) return { error: 'closed' } as const
    if (!validCompleted(req.body?.completed, quest.targets.length)) return { error: 'invalid' } as const
    const progress = await tx.questProgress.upsert({
      where: { quest_id_user_id: { quest_id: questId, user_id: req.user!.id } },
      create: { quest_id: questId, user_id: req.user!.id, completed: req.body.completed },
      update: { completed: req.body.completed },
      include: { user: { select: { id: true, display_name: true, avatar_color: true } } },
    })
    return { progress }
  })
  if ('error' in result) return result.error === 'missing' ? err(res, 404, 'NOT_FOUND', 'ไม่พบเควสในทริปนี้') : result.error === 'closed' ? err(res, 409, 'CLOSED', 'ผู้จัดปิดเควสนี้แล้ว') : err(res, 400, 'VALIDATION_ERROR', 'รายการเป้าหมายไม่ถูกต้อง')
  return ok(res, result.progress)
})
export default router
