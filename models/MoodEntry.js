import mongoose from 'mongoose'

const moodEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moodType: {
      type: String,
      enum: ['happy', 'neutral', 'stressed'],
      required: true,
    },
    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true },
)

export const MoodEntry = mongoose.model('MoodEntry', moodEntrySchema)
