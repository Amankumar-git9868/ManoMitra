import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, signup } from '../controllers/authController.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many auth attempts. Try again later.',
  },
})

router.use(authLimiter)
router.post('/signup', signup)
router.post('/login', login)

export default router
