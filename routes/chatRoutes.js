import { Router } from 'express'
import {
  createChatMessage,
  createPublicChatMessage,
} from '../controllers/chatController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/chat/public', createPublicChatMessage)
router.post('/chat', protect, createChatMessage)

export default router
