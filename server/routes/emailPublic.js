import { Router } from 'express'
import { copyFor, normalizeLocale } from '../services/emailCopy.js'
import { unsubscribePageHtml } from '../services/emailTemplates.js'
import { readUnsubscribeToken, recordUnsubscribe } from '../services/emailUnsub.js'
import { config } from '../config.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.js'

const router = Router()
const limiter = rateLimitMiddleware({
  windowMs: 15 * 60_000,
  max: 30,
  keyFn: (req) => `unsub:${req.ip || 'unknown'}`,
})

router.use(limiter)

async function unsubscribe(req, res) {
  const token = String(req.query.token || req.body?.token || '')
  const email = readUnsubscribeToken(token)
  const locale = normalizeLocale(req.query.locale || req.body?.locale)
  const copy = copyFor(locale)
  const siteUrl = String(config.appUrl || 'https://myinsideracademy.com').replace(/\/$/, '')

  if (!email) {
    res.status(400).type('html').send(unsubscribePageHtml({
      title: locale === 'en' ? 'Link expired' : locale === 'ukr' ? 'Посилання недійсне' : 'Ссылка недействительна',
      lead: copy.ignore,
      siteUrl,
    }))
    return
  }

  await recordUnsubscribe(email)
  if (req.method === 'POST' && req.headers.accept?.includes('application/json')) {
    return res.json({ ok: true, email })
  }
  res.type('html').send(unsubscribePageHtml({
    title: copy.unsubPage.title,
    lead: copy.unsubPage.lead,
    siteUrl,
  }))
}

router.get('/unsubscribe', unsubscribe)
router.post('/unsubscribe', unsubscribe)

export default router
