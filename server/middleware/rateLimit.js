import { rateLimit } from '../services/rateLimiter.js'

export function rateLimitMiddleware({ windowMs = 60_000, max = 10, keyFn }) {
  return (req, res, next) => {
    try {
      const key = keyFn ? keyFn(req) : req.ip || 'global'
      rateLimit({ key: `${req.path}:${key}`, windowMs, max })
      next()
    } catch (err) {
      res.status(err.status || 429).json({ error: err.message || 'Too many requests' })
    }
  }
}
