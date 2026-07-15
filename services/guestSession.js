import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const GUEST_EMAIL = 'guest.shared@mano-mitra.local'
let sharedGuestUserPromise = null

export const createGuestSessionToken = () => {
  const sessionId = crypto.randomBytes(16).toString('hex')
  const token = jwt.sign({ type: 'guest', sessionId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
  return { sessionToken: token, sessionId }
}

export const verifyGuestSessionToken = (sessionToken) => {
  if (!sessionToken) {
    const error = new Error('sessionToken is required.')
    error.statusCode = 400
    throw error
  }

  const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET)
  if (decoded.type !== 'guest' || !decoded.sessionId) {
    const error = new Error('Invalid guest session token.')
    error.statusCode = 401
    throw error
  }

  return decoded.sessionId
}

export const getSharedGuestUser = async () => {
  if (!sharedGuestUserPromise) {
    sharedGuestUserPromise = (async () => {
      let user = await User.findOne({ email: GUEST_EMAIL })
      if (!user) {
        const randomPassword = crypto.randomBytes(32).toString('hex')
        user = await User.create({
          name: 'Shared Guest',
          email: GUEST_EMAIL,
          password: randomPassword,
        })
      }
      return user
    })()
  }
  return sharedGuestUserPromise
}
