import crypto from 'node:crypto'
import { MoodEntry } from '../models/MoodEntry.js'
import { User } from '../models/User.js'

const moodTypeToScore = {
  happy: 3,
  neutral: 2,
  stressed: 1,
}

const scoreToMoodType = {
  3: 'happy',
  2: 'neutral',
  1: 'stressed',
}

const getTrendInsights = (points) => {
  const values = points.map((point) => point.moodScore)
  if (!values.length) {
    return {
      trend: 'neutral',
      message: 'Start logging your mood to see your weekly trend.',
    }
  }

  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first

  if (delta > 0) {
    return {
      trend: 'positive',
      message: 'Great progress this week. Keep doing what supports your wellbeing.',
    }
  }

  if (delta < 0) {
    return {
      trend: 'negative',
      message:
        'Your mood trend looks lower this week. Consider self-care: a short walk, mindful breathing, hydration, and reaching out to someone you trust.',
    }
  }

  return {
    trend: 'neutral',
    message: 'Your mood appears steady this week. Small consistent habits can help.',
  }
}

const buildSevenDaySeries = (entries) => {
  const today = new Date()
  const labels = [...Array(7)].map((_, idx) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - idx))
    return day
  })

  return labels.map((date) => {
    const key = date.toISOString().slice(0, 10)
    const dayEntries = entries.filter((entry) => entry.createdAt.toISOString().slice(0, 10) === key)

    if (!dayEntries.length) {
      return {
        date: key,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        moodScore: 0,
        moodType: 'none',
      }
    }

    const average = dayEntries.reduce((sum, item) => sum + item.moodScore, 0) / dayEntries.length
    const rounded = Math.round(average)
    return {
      date: key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      moodScore: rounded,
      moodType: scoreToMoodType[rounded] || 'neutral',
    }
  })
}

const resolveMoodPayload = ({ moodType, moodScore }) => {
  if (moodType && moodTypeToScore[moodType]) {
    return { moodType, moodScore: moodTypeToScore[moodType] }
  }

  if (typeof moodScore === 'number' && moodScore >= 1 && moodScore <= 3) {
    return { moodScore, moodType: scoreToMoodType[moodScore] }
  }

  const error = new Error('Provide moodType (happy|neutral|stressed) or moodScore (1-3).')
  error.statusCode = 400
  throw error
}

const getOrCreatePublicUser = async (sessionId) => {
  if (!sessionId) {
    const error = new Error('sessionId is required for public mood logging.')
    error.statusCode = 400
    throw error
  }

  const email = `guest.${sessionId.toLowerCase()}@mano-mitra.local`
  let user = await User.findOne({ email })

  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString('hex')
    user = await User.create({
      name: `Guest ${sessionId.slice(0, 6)}`,
      email,
      password: randomPassword,
    })
  }

  return user
}

export const createMoodEntry = async (req, res, next) => {
  try {
    const { moodType, moodScore, note } = req.body
    const normalizedMood = resolveMoodPayload({ moodType, moodScore })

    const moodEntry = await MoodEntry.create({
      user: req.user._id,
      ...normalizedMood,
      note: note || '',
    })

    res.status(201).json({
      success: true,
      message: 'Mood logged successfully.',
      data: moodEntry,
    })
  } catch (error) {
    next(error)
  }
}

export const createPublicMoodEntry = async (req, res, next) => {
  try {
    const { moodType, moodScore, note, sessionId } = req.body
    const normalizedMood = resolveMoodPayload({ moodType, moodScore })
    const user = await getOrCreatePublicUser(sessionId)

    const moodEntry = await MoodEntry.create({
      user: user._id,
      ...normalizedMood,
      note: note || '',
    })

    res.status(201).json({
      success: true,
      message: 'Public mood logged successfully.',
      data: moodEntry,
    })
  } catch (error) {
    next(error)
  }
}

export const getMoodHistory = async (req, res, next) => {
  try {
    const from = new Date()
    from.setDate(from.getDate() - 6)
    from.setHours(0, 0, 0, 0)

    const entries = await MoodEntry.find({
      user: req.user._id,
      createdAt: { $gte: from },
    }).sort({ createdAt: 1 })

    const series = buildSevenDaySeries(entries)
    const insights = getTrendInsights(series.filter((item) => item.moodScore > 0))

    res.status(200).json({
      success: true,
      data: {
        series,
        ...insights,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getPublicMoodHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query
    const user = await getOrCreatePublicUser(sessionId)

    const from = new Date()
    from.setDate(from.getDate() - 6)
    from.setHours(0, 0, 0, 0)

    const entries = await MoodEntry.find({
      user: user._id,
      createdAt: { $gte: from },
    }).sort({ createdAt: 1 })

    const series = buildSevenDaySeries(entries)
    const insights = getTrendInsights(series.filter((item) => item.moodScore > 0))

    res.status(200).json({
      success: true,
      data: {
        series,
        ...insights,
      },
    })
  } catch (error) {
    next(error)
  }
}
