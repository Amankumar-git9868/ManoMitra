import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, signup } from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { authLimiter } from '../middleware/rateLimiters.js'
import { loginSchema, signupSchema } from '../validators/schemas.js'

const router = Router()

router.use(authLimiter)
router.post('/signup', validate(signupSchema), signup)
router.post('/login', validate(loginSchema), login)

export default router
