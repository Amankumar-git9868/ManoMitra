import { ChatMessage } from '../models/ChatMessage.js'
import { generateSupportReply } from '../services/chatbotService.js'

const validateMessage = (message) => {
  if (!message || typeof message !== 'string' || !message.trim()) {
    const error = new Error('message is required.')
    error.statusCode = 400
    throw error
  }
}

export const createChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body

    validateMessage(message)

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
    validateMessage(message)

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
