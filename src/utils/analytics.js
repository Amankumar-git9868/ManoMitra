export function countBy(items, getKey) {
  const map = new Map()
  for (const item of items || []) {
    const key = getKey(item)
    if (!key) continue
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

export function toPercentages(countMap) {
  const entries = Array.from(countMap.entries()).map(([key, count]) => ({ key, count }))
  const total = entries.reduce((sum, e) => sum + e.count, 0)
  return entries.map((e) => ({
    ...e,
    percent: total ? Math.round((e.count / total) * 100) : 0,
    total,
  }))
}

export function mostFrequentKey(countMap) {
  let bestKey = ''
  let bestCount = 0
  for (const [key, count] of (countMap || new Map()).entries()) {
    if (count > bestCount) {
      bestKey = key
      bestCount = count
    }
  }
  return { key: bestKey, count: bestCount }
}

export function keywordInsights(messages, keywords) {
  const counts = {}
  for (const keyword of keywords) counts[keyword] = 0

  for (const message of messages || []) {
    const text = (message?.text || '').toLowerCase()
    if (!text) continue
    for (const keyword of keywords) {
      if (text.includes(keyword)) counts[keyword] += 1
    }
  }

  return counts
}

