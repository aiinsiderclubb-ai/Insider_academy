import http from 'http'
import { config, isConfigured } from './config.js'
import { formatNotification } from './messages.js'
import { sendMessage, parseUpdate } from './telegramApi.js'
import { handleTelegramUpdate } from './handlers.js'

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
  return header && header === config.botSecret
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, configured: isConfigured(), bot: config.botUsername || null }))
    return
  }

  if (req.method === 'POST' && url.pathname === '/telegram/webhook') {
    try {
      const update = await readJson(req)
      await handleTelegramUpdate(update)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"ok":true}')
    } catch (err) {
      console.error('[webhook]', err)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"ok":true}')
    }
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
      const text = formatNotification(type, data || {}, appUrl || config.appUrl)
      await sendMessage(chatId, text)
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
        const text = formatNotification(item.type, item.data || {}, body.appUrl || config.appUrl)
        await sendMessage(item.chatId, text)
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
  console.log(`[telegram-notify-bot] webhook path: POST /telegram/webhook`)
  console.log(`[telegram-notify-bot] notify: POST /notify (header x-bot-secret)`)
})
