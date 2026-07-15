const sanitizeString = (value) => {
  if (typeof value !== 'string') return value
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

const sanitizeValue = (value) => {
  if (typeof value === 'string') return sanitizeString(value)
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)]))
  }
  return value
}

export const sanitizeInputs = (req, _res, next) => {
  if (req.body) req.body = sanitizeValue(req.body)
  // Note: req.query is read-only in Express 5 — skip reassignment
  next()
}
