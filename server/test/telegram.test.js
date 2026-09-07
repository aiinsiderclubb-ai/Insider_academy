import test from 'node:test'
import assert from 'node:assert/strict'
import { formatNotification, getInlineKeyboard } from '../services/telegramMessages.js'

test('purchase telegram copy tells buyer to log in with the same email', () => {
  const text = formatNotification('purchase', {
    courseTitle: 'AI Productivity Master',
    targetPath: '/learn/ai-productivity-master',
    message: 'Зайдите в Academy под той же почтой, с которой оплачивали.',
  }, 'https://myinsideracademy.com')
  assert.match(text, /той же почтой/)
  assert.match(text, /\/learn\/ai-productivity-master/)
  assert.doesNotMatch(text, /личном кабинете/)

  const fallback = formatNotification('purchase', { courseTitle: 'X' }, 'https://myinsideracademy.com')
  assert.match(fallback, /той же почтой/)

  const keyboard = getInlineKeyboard(
    'purchase',
    { targetPath: '/learn/ai-productivity-master' },
    'https://myinsideracademy.com'
  )
  const urls = keyboard.inline_keyboard.flat().map((button) => button.url)
  assert.ok(urls.some((url) => url.endsWith('/login')))
  assert.ok(urls.some((url) => url.endsWith('/learn/ai-productivity-master')))
})
