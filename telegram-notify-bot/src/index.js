import http from 'http'
import { timingSafeEqual } from 'node:crypto'
import { config, isConfigured } from './config.js'
import { formatNotification, getInlineKeyboard } from './messages.js'
import { getStickerFileId } from './stickers.js'
import { sendMessage, sendSticker, parseUpdate } from './telegramApi.js'

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function checkSecret(req) {
  const header = req.headers['x-bot-secret'] || ''
  const actual = Buffer.from(String(header))
  const expected = Buffer.from(String(config.botSecret || ''))
  return actual.length > 0 && actual.length === expected.length && timingSafeEqual(actual, expected)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, configured: isConfigured(), bot: config.botUsername || null }))
    return
  }

  if (req.method === 'POST' && url.pathname === '/notify') {
    if (!checkSecret(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }
    try {
      const body = await readJson(req)
      const { chatId, type, data, appUrl } = body
      if (!chatId || !type) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'chatId and type required' }))
        return
      }
      const payload = data || {}
      const app = appUrl || config.appUrl
      await sendSticker(chatId, getStickerFileId(type))
      const text = formatNotification(type, payload, app)
      const replyMarkup = getInlineKeyboard(type, payload, app)
      await sendMessage(chatId, text, replyMarkup ? { reply_markup: replyMarkup } : {})
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    } catch (err) {
      console.error('[notify]', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/notify/bulk') {
    if (!checkSecret(req)) {
      res.writeHead(401)
      res.end()
      return
    }
    const body = await readJson(req)
    const items = Array.isArray(body.items) ? body.items : []
    let sent = 0
    for (const item of items.slice(0, 100)) {
      try {
        const payload = item.data || {}
        const app = body.appUrl || config.appUrl
        await sendSticker(item.chatId, getStickerFileId(item.type))
        const text = formatNotification(item.type, payload, app)
        const replyMarkup = getInlineKeyboard(item.type, payload, app)
        await sendMessage(item.chatId, text, replyMarkup ? { reply_markup: replyMarkup } : {})
        sent += 1
      } catch (err) {
        console.warn('[bulk]', item.chatId, err.message)
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, sent }))
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

if (!isConfigured()) {
  console.warn('[bot] Set TELEGRAM_BOT_TOKEN and BOT_SERVICE_SECRET')
}

server.listen(config.port, () => {
  console.log(`[telegram-notify-bot] http://localhost:${config.port}`)
  console.log(`[telegram-notify-bot] notify: POST /notify (header x-bot-secret)`)
  console.log('[telegram-notify-bot] Incoming messages: webhook on LMS API /api/telegram/webhook (do not set BOT_PUBLIC_URL webhook here)')
})
