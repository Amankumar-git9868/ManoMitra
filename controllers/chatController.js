import { ChatMessage } from '../models/ChatMessage.js'
import { generateSupportReply } from '../services/chatbotService.js'

export const createChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body
    const chatOutput = await generateSupportReply(message)

    const chat = await ChatMessage.create({
      user: req.user._id,
      message,
      aiResponse: chatOutput.response,
      sentiment: chatOutput.sentiment,
      severeDistress: chatOutput.severeDistress,
      provider: chatOutput.provider,
    })

    res.status(201).json({
      success: true,
      message: 'Chat message processed.',
      data: {
        ...chat.toObject(),
        aiResponse: chatOutput.response,
        sentiment: chatOutput.sentiment,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const createPublicChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body
    const chatOutput = await generateSupportReply(message)

    res.status(200).json({
      success: true,
      message: 'Public chat response generated.',
      data: {
        message,
        aiResponse: chatOutput.response,
        sentiment: chatOutput.sentiment,
        severeDistress: chatOutput.severeDistress,
        provider: chatOutput.provider,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getChatHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const chats = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(limit)
      .select('message aiResponse createdAt sentiment')

    const messages = chats.flatMap((chat) => [
      {
        role: 'user',
        text: chat.message,
        timestamp: chat.createdAt.getTime(),
      },
      {
        role: 'ai',
        text: chat.aiResponse,
        timestamp: chat.createdAt.getTime() + 1,
      },
    ])

    res.status(200).json({
      success: true,
      data: { messages },
    })
  } catch (error) {
    next(error)
  }
}
