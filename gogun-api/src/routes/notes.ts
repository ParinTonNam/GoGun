import { Router } from 'express'
import { err } from '../lib/response'

const router = Router({ mergeParams: true })

const gone = (_req: any, res: any) =>
  err(res, 410, 'GONE', 'Trip notes have been removed from this API version')

router.get('/', gone)
router.post('/', gone)
router.patch('/:noteId', gone)
router.delete('/:noteId', gone)

export default router
