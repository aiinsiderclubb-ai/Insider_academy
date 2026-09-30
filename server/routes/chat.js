import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { chatCompletion } from '../services/openai.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.js'

const router = Router()
const chatRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60_000,
  max: 20,
  keyFn: (req) => req.userId || req.ip || 'unknown',
})

router.post('/', requireUser, chatRateLimit, async (req, res) => {
  // A `system` turn from the browser is dropped, not obeyed: honouring it let
  // any caller replace the assistant's instructions with their own. The site
  // uses /api/assistant now; this stays for older clients.
  const messages = Array.isArray(req.body.messages)
    ? req.body.messages
      .filter((message) => message?.role !== 'system')
      .slice(-12)
      .map((message) => ({
        role: message?.role === 'assistant' ? 'assistant' : 'user',
        content: String(message?.content || '').slice(0, 4_000),
      }))
    : []
  const result = await chatCompletion(messages)
  res.json(result)
})

export default router
