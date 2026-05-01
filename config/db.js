import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let memoryServer

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || ''
  const useMemoryDb = process.env.USE_MEMORY_DB === 'true'

  if (!mongoUri && !useMemoryDb) {
    throw new Error('MONGO_URI is not configured. Set USE_MEMORY_DB=true for local fallback.')
  }

  try {
    if (useMemoryDb) {
      memoryServer = await MongoMemoryServer.create()
      const uri = memoryServer.getUri()
      await mongoose.connect(uri)
      console.log('MongoDB connected (in-memory)')
      return
    }

    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } catch (error) {
    if (!mongoUri) throw error

    // Development fallback: if local/atlas DB is unreachable, boot an in-memory MongoDB.
    memoryServer = await MongoMemoryServer.create()
    const uri = memoryServer.getUri()
    await mongoose.connect(uri)
    console.log('Primary MongoDB unreachable. Connected to in-memory MongoDB fallback.')
  }
}
