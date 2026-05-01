import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/authRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import moodRoutes from './routes/moodRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Mano-Mitra API is running.' })
})

app.use('/auth', authRoutes)
app.use('/', chatRoutes)
app.use('/', moodRoutes)
app.use('/', adminRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
