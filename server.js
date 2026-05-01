import dotenv from 'dotenv'
import app from './app.js'
import { connectDB } from './config/db.js'
import { seedAdminUser } from './config/seedAdmin.js'

dotenv.config()

const port = process.env.PORT || 5000

const bootstrap = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    await connectDB()
    await seedAdminUser()
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

bootstrap()
