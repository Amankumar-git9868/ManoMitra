export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  })

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ')
    const error = new Error(message)
    error.statusCode = 400
    return next(error)
  }

  if (result.data.body) req.body = result.data.body
  if (result.data.query) req.query = result.data.query
  if (result.data.params) req.params = result.data.params
  return next()
}
