import { config } from './config.js'

export async function confirmLink({ token, chatId, username }) {
  const res = await fetch(`${config.lmsApiUrl}/api/telegram/bot/confirm-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': config.botSecret,
    },
    body: JSON.stringify({ token, chatId, username }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || data.errorRu || 'Link failed')
    err.status = res.status
    throw err
  }
  return data
}

export async function linkByPersonalId({ personalId, chatId, username }) {
  const res = await fetch(`${config.lmsApiUrl}/api/telegram/bot/link-personal-id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': config.botSecret,
    },
    body: JSON.stringify({ personalId, chatId, username }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Link failed')
    err.status = res.status
    throw err
  }
  return data
}

export async function unlinkChat(chatId) {
  await fetch(`${config.lmsApiUrl}/api/telegram/bot/unlink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': config.botSecret,
    },
    body: JSON.stringify({ chatId }),
  }).catch(() => {})
}
