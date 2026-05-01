import { ChatMessage } from '../models/ChatMessage.js'
import { MoodEntry } from '../models/MoodEntry.js'
import { User } from '../models/User.js'

const buildLast7Days = () => {
  const today = new Date()
  const days = [...Array(7)].map((_, idx) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - idx))
    day.setHours(0, 0, 0, 0)
    const dateKey = day.toISOString().slice(0, 10)
    const label = day.toLocaleDateString('en-US', { weekday: 'short' })
    return { dateKey, label, date: day }
  })
  const from = new Date(days[0].date)
  return { days, from }
}

const toMapByDateKey = (rows) =>
  new Map(rows.map((row) => [row._id, row.count]))

const getAnonymousAdminStats = async () => {
  const { days, from } = buildLast7Days()

  const [
    totalUsers,
    totalChats,
    totalMoodEntries,
    negativeSentimentMessages,
    moodDistributionRows,
    chatsByDayRows,
    moodsByDayRows,
  ] = await Promise.all([
    User.countDocuments(),
    ChatMessage.countDocuments(),
    MoodEntry.countDocuments(),
    ChatMessage.countDocuments({ sentiment: 'negative' }),
    MoodEntry.aggregate([
      { $group: { _id: '$moodType', count: { $sum: 1 } } },
      { $project: { _id: 0, moodType: '$_id', count: 1 } },
    ]),
    ChatMessage.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $project: { dateKey: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
      { $group: { _id: '$dateKey', count: { $sum: 1 } } },
    ]),
    MoodEntry.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $project: { dateKey: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
      { $group: { _id: '$dateKey', count: { $sum: 1 } } },
    ]),
  ])

  const moodDistribution = ['happy', 'neutral', 'stressed'].map((moodType) => {
    const row = moodDistributionRows.find((item) => item.moodType === moodType)
    return { moodType, count: row?.count || 0 }
  })

  const chatsByDay = toMapByDateKey(chatsByDayRows)
  const moodsByDay = toMapByDateKey(moodsByDayRows)

  const usageTrends = days.map((day) => ({
    date: day.dateKey,
    label: day.label,
    chats: chatsByDay.get(day.dateKey) || 0,
    moods: moodsByDay.get(day.dateKey) || 0,
  }))

  return {
    totals: {
      totalUsers,
      totalChats,
      totalMoodEntries,
      negativeSentimentMessages,
    },
    moodDistribution,
    usageTrends,
  }
}

export const getAdminStats = async (_req, res, next) => {
  try {
    const stats = await getAnonymousAdminStats()
    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    next(error)
  }
}

export const getAdminStatsPublic = async (_req, res, next) => {
  try {
    const stats = await getAnonymousAdminStats()
    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    next(error)
  }
}
