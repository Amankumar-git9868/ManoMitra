import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/authRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import moodRoutes from './routes/moodRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import groupRoutes from './routes/groupRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js'
import { sanitizeInputs } from './middleware/sanitize.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const isProduction = process.env.NODE_ENV === 'production'

const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : defaultDevOrigins)],
        frameSrc: ["'self'", 'https://www.youtube.com'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }),
)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || defaultDevOrigins,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(morgan(isProduction ? 'combined' : 'dev'))
app.use(sanitizeInputs)

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Mano-Mitra API is running.' })
})

app.use('/auth', authRoutes)
app.use('/', chatRoutes)
app.use('/', moodRoutes)
app.use('/', adminRoutes)
app.use('/', appointmentRoutes)
app.use('/', groupRoutes)

if (isProduction) {
  const distPath = path.join(__dirname, 'dist')
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/chat') || req.path.startsWith('/mood') || req.path.startsWith('/admin') || req.path.startsWith('/appointments') || req.path.startsWith('/groups') || req.path === '/health') {
      return next()
    }
    return res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use(notFoundHandler)
app.use(errorHandler)

export default app
