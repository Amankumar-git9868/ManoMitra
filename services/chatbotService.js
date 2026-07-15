import { GoogleGenerativeAI } from '@google/generative-ai'

const SENTIMENT = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
}

const severeDistressPatterns = [
  /\b(i want to die|want to end it|end my life|kill myself|suicide|self harm|self-harm)\b/i,
  /\b(no reason to live|cannot go on|can't go on|hopeless|give up on life)\b/i,
  /\b(hurt myself|harm myself|cut myself)\b/i,
  /\b(मरना चाहता|आत्महत्या|suicid)\b/i,
  /\b(no quiero vivir|quiero morir|suicid)\b/i,
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

export const detectSevereDistress = (message) =>
  severeDistressPatterns.some((pattern) => pattern.test(message))

// Extract a short keyword phrase from the message for light acknowledgment
const extractKeyword = (message) => {
  const negativeWords = [
    'anxious', 'anxiety', 'overwhelmed', 'stressed', 'stress', 'sad',
    'depressed', 'lonely', 'panic', 'angry', 'tired', 'hopeless',
  ]
  const lower = message.toLowerCase()
  const found = negativeWords.find((w) => lower.includes(w))
  return found || null
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const buildRuleBasedResponse = ({ message, sentiment, severeDistress }) => {
  const keyword = extractKeyword(message)
  const acknowledgment = keyword
    ? `It sounds like you are feeling ${keyword} right now.`
    : 'It sounds like you are carrying something heavy right now.'

  if (severeDistress) {
    const openers = [
      'Thank you for trusting me with this.',
      'I am really glad you shared this.',
      'I hear you, and I am here with you.',
    ]
    return `${pick(openers)} ${severeSafetyText} ${copingStrategiesText}`
  }

  if (sentiment === SENTIMENT.NEGATIVE) {
    const options = [
      `${acknowledgment} That is a valid feeling and you do not have to push it away. ${copingStrategiesText}`,
      `${acknowledgment} You are not alone in this. ${copingStrategiesText}`,
      `Thank you for sharing that. ${acknowledgment} Sometimes naming what we feel is the first small step. ${copingStrategiesText}`,
      `${acknowledgment} Be gentle with yourself today. ${copingStrategiesText}`,
    ]
    return pick(options)
  }

  if (sentiment === SENTIMENT.POSITIVE) {
    const options = [
      'It is encouraging to hear some positive movement. Keep noticing what is helping and take things one step at a time.',
      'That sounds like real progress — even a small shift in how we feel matters. Hold onto that.',
      'I am glad to hear something feels a bit lighter. Keep taking it one day at a time.',
    ]
    return pick(options)
  }

  // Neutral
  const options = [
    'Thank you for sharing. If you would like, we can explore what has been on your mind and find one small, manageable next step.',
    'I am here to listen. Feel free to share more — whatever feels right.',
    'Sometimes just putting thoughts into words can help. Take your time — I am here.',
  ]
  return pick(options)
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

  if (severeDistress) {
    console.warn('[severe-distress] Event detected (message content not stored in logs).')
  }

  const model = getGeminiClient()
  if (!model) {
    console.info('[chatbot] GEMINI_API_KEY not set — using rule-based fallback.')
    return {
      sentiment,
      severeDistress,
      response: buildRuleBasedResponse({ message, sentiment, severeDistress }),
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
    const fallback = buildRuleBasedResponse({ message, sentiment, severeDistress })

    if (!geminiText) {
      console.warn('[chatbot] Gemini returned empty text — using rule-based fallback.')
    } else {
      console.info(`[chatbot] Gemini response OK (sentiment: ${sentiment}, distress: ${severeDistress})`)
    }

    return {
      sentiment,
      severeDistress,
      response: geminiText || fallback,
      provider: geminiText ? 'gemini' : 'rule-based',
    }
  } catch (error) {
    console.error('[chatbot] Gemini API call failed — using rule-based fallback.', error?.message || error)
    return {
      sentiment,
      severeDistress,
      response: buildRuleBasedResponse({ message, sentiment, severeDistress }),
      provider: 'rule-based',
    }
  }
}
