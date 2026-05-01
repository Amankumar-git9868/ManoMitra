import { GoogleGenerativeAI } from '@google/generative-ai'

const SENTIMENT = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
}

const severeDistressPatterns = [
  /\b(i want to die|want to end it|end my life|kill myself|suicide|self harm|self-harm)\b/i,
  /\b(no reason to live|cannot go on|can't go on|hopeless)\b/i,
  /\b(hurt myself|harm myself)\b/i,
]

const positivePatterns = [
  /\b(feel better|feeling better|grateful|thankful|hopeful|calm|good|great|happy)\b/i,
]

const negativePatterns = [
  /\b(anxious|anxiety|overwhelmed|stressed|stress|sad|depressed|lonely|panic|angry|tired)\b/i,
]

const copingStrategiesText =
  'A few gentle options right now: try 4-4 breathing for one minute, take a short break with water, or talk to someone you trust.'

const severeSafetyText =
  'You are not alone. Please consider reaching out to a trusted person or counselor.'

const safeSystemPrompt = `You are a supportive mental health companion.
Rules:
- Be empathetic, non-judgmental, warm, and concise.
- Do not provide medical, legal, or diagnostic advice.
- Do not prescribe treatment or medication.
- Offer practical, low-risk coping suggestions.
- If user appears in severe distress, include exactly: "${severeSafetyText}".
- Return plain text only.`

const classifySentimentRuleBased = (message) => {
  if (negativePatterns.some((pattern) => pattern.test(message))) return SENTIMENT.NEGATIVE
  if (positivePatterns.some((pattern) => pattern.test(message))) return SENTIMENT.POSITIVE
  return SENTIMENT.NEUTRAL
}

const detectSevereDistress = (message) =>
  severeDistressPatterns.some((pattern) => pattern.test(message))

const buildRuleBasedResponse = ({ sentiment, severeDistress }) => {
  const prefix = 'Thank you for sharing this. Your feelings matter.'

  if (severeDistress) {
    return `${prefix} ${severeSafetyText} ${copingStrategiesText}`
  }

  if (sentiment === SENTIMENT.NEGATIVE) {
    return `${prefix} It sounds like this is heavy right now. ${copingStrategiesText}`
  }

  if (sentiment === SENTIMENT.POSITIVE) {
    return `${prefix} It is encouraging to hear some positive movement. Keep noticing what is helping and take things one step at a time.`
  }

  return `${prefix} If you would like, we can explore what has been on your mind and identify one small, manageable next step.`
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' })
}

const sanitizeModelResponse = (text) => text.replace(/\s+/g, ' ').trim()

export const generateSupportReply = async (message) => {
  const severeDistress = detectSevereDistress(message)
  const sentiment = classifySentimentRuleBased(message)

  const model = getGeminiClient()
  if (!model) {
    return {
      sentiment,
      severeDistress,
      response: buildRuleBasedResponse({ sentiment, severeDistress }),
      provider: 'rule-based',
    }
  }

  try {
    const prompt = `User message: "${message}"
Sentiment label from backend pre-check: ${sentiment}
Severe distress detected: ${severeDistress}

Create one supportive response in 2-4 sentences, following the rules exactly.`

    const result = await model.generateContent([
      { text: safeSystemPrompt },
      { text: prompt },
    ])

    const geminiText = sanitizeModelResponse(result.response.text() || '')
    const fallback = buildRuleBasedResponse({ sentiment, severeDistress })

    return {
      sentiment,
      severeDistress,
      response: geminiText || fallback,
      provider: 'gemini',
    }
  } catch {
    return {
      sentiment,
      severeDistress,
      response: buildRuleBasedResponse({ sentiment, severeDistress }),
      provider: 'rule-based',
    }
  }
}
