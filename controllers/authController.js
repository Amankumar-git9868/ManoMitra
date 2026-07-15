import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      const error = new Error('Email already registered.')
      error.statusCode = 409
      throw error
    }

    const user = await User.create({ name, email, password })
    const token = signToken(user._id)

    res.status(201).json({
      success: true,
      message: 'Signup successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      const error = new Error('Invalid credentials.')
      error.statusCode = 401
      throw error
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials.')
      error.statusCode = 401
      throw error
    }

    const token = signToken(user._id)

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}
