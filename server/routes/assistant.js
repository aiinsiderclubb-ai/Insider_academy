import { Router } from 'express'
import { getDb } from '../db.js'
import { config, isOpenAIEnabled } from '../config.js'
import { optionalUser } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { rateLimit } from '../services/rateLimiter.js'
import { LANGUAGES, buildSystemPrompt, sanitizeHistory, streamCompletion } from '../services/assistant.js'

/*
 * POST /api/assistant — the site assistant, open to guests and learners.
 *
 * Body: { messages: [{ role: 'user' | 'assistant', content }], locale,
 *         page?: '/ru/learn/x', lesson?: { courseId, lessonId } }
 *
 * Answers as a server-sent event stream: `{ type: 'delta', text }` for each
 * piece of the reply, then `{ type: 'done', truncated }` or
 * `{ type: 'error', code }`. Anything refused before the model is asked —
 * offline, over the limit, a malformed body — is a plain JSON error instead.
 *
 * GET /api/assistant/status — `{ online }`, whether an OpenAI key is set.
 */
const router = Router()

const WINDOW = 15 * 60_000
const DAY = 24 * 60 * 60_000

function over(key, windowMs, max) {
  try {
    rateLimit({ key: `assistant:${key}`, windowMs, max })
    return false
  } catch {
    return true
  }
}

/** Which limit this message would break, or null. */
function limitReached(req) {
  const limits = config.assistant
  if (req.userId) {
    if (over(`user-15m:${req.userId}`, WINDOW, limits.userPerWindow)) return 'rate_limited'
    if (over(`user-day:${req.userId}`, DAY, limits.userPerDay)) return 'daily_limit'
    return null
  }
  const ip = req.ip || 'unknown'
  if (over(`guest-15m:${ip}`, WINDOW, limits.guestPerWindow)) return 'rate_limited'
  if (over(`guest-day:${ip}`, DAY, limits.guestPerDay)) return 'daily_limit'
  if (over('guests-day', DAY, limits.guestTotalPerDay)) return 'busy'
  return null
}

/** Whether there is a model to answer with. The site hides the chat until there is. */
router.get('/status', (_req, res) => {
  res.json({ online: isOpenAIEnabled() })
})

router.post('/', optionalUser, asyncHandler(async (req, res) => {
  if (!isOpenAIEnabled()) {
    return res.status(503).json({ error: 'The assistant is offline', code: 'offline' })
  }

  const history = sanitizeHistory(req.body?.messages)
  if (!history) {
    return res.status(400).json({ error: 'Send the conversation, ending with a question', code: 'bad_request' })
  }

  const limit = limitReached(req)
  if (limit) {
    return res.status(429).json({ error: 'Too many messages', code: limit, guest: !req.userId })
  }

  const locale = Object.hasOwn(LANGUAGES, req.body?.locale) ? req.body.locale : 'ru'
  const lesson = req.body?.lesson && typeof req.body.lesson === 'object'
    ? { courseId: String(req.body.lesson.courseId ?? '').slice(0, 100), lessonId: String(req.body.lesson.lessonId ?? '').slice(0, 100) }
    : null
  const system = await buildSystemPrompt(getDb(), { locale, userId: req.userId ?? null, page: req.body?.page, lesson })

  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-store, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // The visitor closing the chat, or pressing stop, ends the request: stop
  // paying for tokens nobody will read.
  const controller = new AbortController()
  res.on('close', () => {
    if (!res.writableEnded) controller.abort()
  })
  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`)

  try {
    const { finish } = await streamCompletion({
      system,
      history,
      signal: controller.signal,
      onDelta: (text) => send({ type: 'delta', text }),
    })
    send({ type: 'done', truncated: finish === 'length' })
  } catch (err) {
    if (controller.signal.aborted) return
    console.error('[assistant] upstream failed:', err.message, err.detail || '')
    send({ type: 'error', code: 'upstream' })
  }
  res.end()
}))

export default router
