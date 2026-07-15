import { Router } from 'express'
import {
  createMoodEntry,
  createPublicMoodEntry,
  getMoodHistory,
  getPublicMoodHistory,
  issueGuestSession,
} from '../controllers/moodController.js'
import { protect } from '../middleware/authMiddleware.js'
import {
  guestSessionLimiter,
  moodLimiter,
  publicLimiter,
} from '../middleware/rateLimiters.js'
import { validate } from '../middleware/validate.js'
import {
  moodEntrySchema,
  sessionTokenQuerySchema,
  sessionTokenSchema,
} from '../validators/schemas.js'

const router = Router()

router.post('/mood/public/session', guestSessionLimiter, issueGuestSession)
router.post('/mood', protect, moodLimiter, validate(moodEntrySchema), createMoodEntry)
router.get('/mood/history', protect, moodLimiter, getMoodHistory)
router.post('/mood/public', publicLimiter, validate(sessionTokenSchema), createPublicMoodEntry)
router.get(
  '/mood/public/history',
  publicLimiter,
  validate(sessionTokenQuerySchema),
  getPublicMoodHistory,
)

export default router
