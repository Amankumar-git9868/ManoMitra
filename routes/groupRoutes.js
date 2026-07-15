import { Router } from 'express'
import {
  getGroups,
  toggleJoinGroup,
  getGroupMessages,
  postGroupMessage,
  createGroup
} from '../controllers/groupController.js'
import { protect, requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/groups', protect, getGroups)
router.post('/groups', protect, requireAdmin, createGroup)
router.post('/groups/:id/join', protect, toggleJoinGroup)
router.get('/groups/:id/messages', protect, getGroupMessages)
router.post('/groups/:id/messages', protect, postGroupMessage)

export default router
