import dotenv from 'dotenv'
import app from './app.js'
import { connectDB } from './config/db.js'
import { seedAdminUser } from './config/seedAdmin.js'
import { seedGroups } from './config/seedGroups.js'

dotenv.config()

const port = process.env.PORT || 5000

const bootstrap = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    await connectDB()
    await seedAdminUser()
    await seedGroups()
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
      const geminiKey = process.env.GEMINI_API_KEY
      if (geminiKey && geminiKey.length > 10) {
        console.log(`[chatbot] GEMINI_API_KEY loaded (model: ${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}) — AI chat active.`)
      } else {
        console.warn('[chatbot] GEMINI_API_KEY is missing or empty — chat will use rule-based fallback.')
      }
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

bootstrap()
