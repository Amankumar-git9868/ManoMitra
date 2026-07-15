import mongoose from 'mongoose'

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    distressFlagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

export const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema)
