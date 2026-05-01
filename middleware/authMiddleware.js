import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const getTokenFromHeader = (authorization) => {
  if (!authorization || !authorization.startsWith('Bearer ')) return null
  return authorization.split(' ')[1]
}

export const protect = async (req, _res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization)

    if (!token) {
      const error = new Error('Not authorized. Missing token.')
      error.statusCode = 401
      throw error
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      const error = new Error('Not authorized. User not found.')
      error.statusCode = 401
      throw error
    }

    req.user = user
    next()
  } catch (error) {
    error.statusCode = error.statusCode || 401
    next(error)
  }
}

export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    const error = new Error('Admin access required.')
    error.statusCode = 403
    return next(error)
  }

  return next()
}
