import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let memoryServer

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || ''
  const useMemoryDb = process.env.USE_MEMORY_DB === 'true'
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && !mongoUri) {
    throw new Error('MONGO_URI is required in production. In-memory mode is dev-only.')
  }

  if (!mongoUri && !useMemoryDb) {
    throw new Error(
      'MONGO_URI is not configured. Set USE_MEMORY_DB=true for local dev-only fallback.',
    )
  }

  try {
    if (useMemoryDb) {
      if (isProduction) {
        throw new Error('USE_MEMORY_DB is dev-only and cannot be used in production.')
      }
      console.warn('⚠ In-memory MongoDB is active — data is ephemeral. Use MONGO_URI for real persistence.')
      memoryServer = await MongoMemoryServer.create()
      const uri = memoryServer.getUri()
      await mongoose.connect(uri)
      console.log('MongoDB connected (in-memory, dev-only)')
      return
    }

    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } catch (error) {
    if (!mongoUri || isProduction) throw error

    console.warn('⚠ Primary MongoDB unreachable. Falling back to in-memory dev database.')
    memoryServer = await MongoMemoryServer.create()
    const uri = memoryServer.getUri()
    await mongoose.connect(uri)
    console.log('MongoDB connected (in-memory dev fallback)')
  }
}
