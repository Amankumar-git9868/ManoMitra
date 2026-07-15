import { z } from 'zod'

const moodTypeSchema = z.enum(['happy', 'neutral', 'stressed'])

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required.').max(80),
    email: z.string().trim().email('Valid email is required.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Valid email is required.'),
    password: z.string().min(1, 'Password is required.'),
  }),
})

export const chatMessageSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, 'Message is required.').max(2000),
  }),
})

export const moodEntrySchema = z.object({
  body: z
    .object({
      moodType: moodTypeSchema.optional(),
      moodScore: z.number().int().min(1).max(3).optional(),
      note: z.string().trim().max(500).optional(),
    })
    .refine((data) => data.moodType || data.moodScore, {
      message: 'Provide moodType (happy|neutral|stressed) or moodScore (1-3).',
    }),
})

export const sessionTokenSchema = z.object({
  body: z
    .object({
      sessionToken: z.string().trim().min(1, 'sessionToken is required.'),
      moodType: moodTypeSchema.optional(),
      moodScore: z.number().int().min(1).max(3).optional(),
      note: z.string().trim().max(500).optional(),
    })
    .refine((data) => data.moodType || data.moodScore, {
      message: 'Provide moodType (happy|neutral|stressed) or moodScore (1-3).',
    }),
})

export const sessionTokenQuerySchema = z.object({
  query: z.object({
    sessionToken: z.string().trim().min(1, 'sessionToken is required.'),
  }),
})
