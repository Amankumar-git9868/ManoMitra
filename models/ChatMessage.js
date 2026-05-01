import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    aiResponse: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true,
    },
    severeDistress: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: ['gemini', 'rule-based'],
      default: 'rule-based',
    },
  },
  { timestamps: true },
)

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)
