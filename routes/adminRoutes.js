import { Router } from 'express'
import { getAdminStats, getAdminStatsPublic } from '../controllers/adminController.js'
import { protect, requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/admin/stats/public', getAdminStatsPublic)
router.get('/admin/stats', protect, requireAdmin, getAdminStats)

export default router
