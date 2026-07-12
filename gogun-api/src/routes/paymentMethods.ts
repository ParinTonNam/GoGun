import { Router } from 'express'
import { err } from '../lib/response'

const router = Router({ mergeParams: true })

const gone = (_req: any, res: any) =>
  err(res, 410, 'GONE', 'Payment methods have been removed from this API version')

router.get('/:userId', gone)
router.put('/', gone)

export default router
