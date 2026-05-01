import { Router } from 'express'
import {
  createMoodEntry,
  createPublicMoodEntry,
  getMoodHistory,
  getPublicMoodHistory,
} from '../controllers/moodController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/mood', protect, createMoodEntry)
router.get('/mood/history', protect, getMoodHistory)
router.post('/mood/public', createPublicMoodEntry)
router.get('/mood/public/history', getPublicMoodHistory)

export default router
