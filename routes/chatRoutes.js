import { Router } from 'express'
import {
  createChatMessage,
  createPublicChatMessage,
  getChatHistory,
} from '../controllers/chatController.js'
import { protect } from '../middleware/authMiddleware.js'
import { chatLimiter, publicLimiter } from '../middleware/rateLimiters.js'
import { validate } from '../middleware/validate.js'
import { chatMessageSchema } from '../validators/schemas.js'

const router = Router()

router.get('/chat/history', protect, chatLimiter, getChatHistory)
router.post('/chat/public', publicLimiter, validate(chatMessageSchema), createPublicChatMessage)
router.post('/chat', protect, chatLimiter, validate(chatMessageSchema), createChatMessage)

export default router
