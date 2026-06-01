import { sendTelegramMessage } from './telegram.js'
import { consumeLinkToken, linkByPersonalId, unlinkByChatId, getBotUsername } from './telegramLink.js'

const PERSONAL_ID_RE = /^AIA-[A-Z0-9]{6}$/i

export async function handleTelegramUpdate(update) {
  const msg = update?.message
  if (!msg) return

  const chatId = String(msg.chat.id)
  const text = (msg.text || '').trim()
  const username = msg.from?.username || ''

  if (text.startsWith('/start')) {
    const payload = (text.split(' ')[1] || '').trim()
    if (payload.startsWith('link_')) {
      return handleLinkToken(chatId, payload.slice(5), username)
    }
    return sendWelcome(chatId, msg.from?.first_name)
  }

  if (text.startsWith('/link')) {
    const arg = text.slice(5).trim()
    if (!arg) return askForPersonalId(chatId)
    if (arg.startsWith('link_')) return handleLinkToken(chatId, arg.slice(5), username)
    if (/^[a-f0-9]{16,64}$/i.test(arg)) return handleLinkToken(chatId, arg, username)
    if (PERSONAL_ID_RE.test(arg)) return handleLinkPersonalId(chatId, arg.toUpperCase(), username)
    return sendMessageInvalidId(chatId)
  }

  if (PERSONAL_ID_RE.test(text)) {
    return handleLinkPersonalId(chatId, text.toUpperCase(), username)
  }

  if (text === '/stop' || text === '/unlink') {
    await unlinkByChatId(chatId)
    return sendTelegramMessage(
      chatId,
      '🔕 Уведомления отключены.\n\nЧтобы снова подключить — отправьте /start и ваш ID с платформы.'
    )
  }

  if (text === '/help') {
    return sendTelegramMessage(
      chatId,
      '<b>Справка</b>\n\n/start — приветствие\nОтправьте <code>AIA-XXXXXX</code> — привязка аккаунта\n/stop — отключить уведомления\n\nID: Личный кабинет Academy → Telegram.'
    )
  }

  return askForPersonalId(chatId)
}

async function handleLinkPersonalId(chatId, personalId, username) {
  try {
    const result = await linkByPersonalId(personalId, chatId, username)
    if (!result.ok) {
      return sendTelegramMessage(
        chatId,
        `❌ ${result.error === 'Account not found' ? 'Аккаунт не найден. Проверьте ID в личном кабинете.' : result.error}`
      )
    }
    await sendTelegramMessage(
      chatId,
      `✅ <b>Готово!</b> Telegram подключён.\n\nАккаунт: ${result.email || personalId}\n\nВы будете получать уведомления о ДЗ, промокодах и новостях.\n\nОтключить: /stop`
    )
  } catch (err) {
    await sendTelegramMessage(chatId, `❌ Ошибка привязки: ${err.message}`)
  }
}

async function handleLinkToken(chatId, token, username) {
  try {
    const result = await consumeLinkToken(token, chatId, username)
    if (!result.ok) {
      return sendTelegramMessage(
        chatId,
        `❌ ${result.error}\n\nОткройте ссылку из кабинета ещё раз (действует 15 минут) или отправьте ID: <code>AIA-XXXXXX</code>`
      )
    }
    await sendTelegramMessage(
      chatId,
      `✅ <b>Готово!</b> Telegram подключён.\n\nАккаунт: ${result.email || 'Academy'}\n\nУведомления: ДЗ, промокоды, новости.\n\nОтключить: /stop`
    )
  } catch (err) {
    await sendTelegramMessage(chatId, `❌ Ошибка: ${err.message}`)
  }
}

async function sendWelcome(chatId, firstName) {
  const name = firstName ? `, ${firstName}` : ''
  const bot = getBotUsername() ? `@${getBotUsername()}` : ''
  await sendTelegramMessage(
    chatId,
    `👋 <b>Здравствуйте${name}!</b>\n\nЯ бот уведомлений <b>AI Insider Academy</b>.\n\n📩 Пришлите ваш <b>личный ID</b> с платформы — одним сообщением.\n\nФормат: <code>AIA-XXXXXX</code>\n(смотрите в <b>Личном кабинете → Telegram</b> на сайте Academy)\n\nПример:\n<code>AIA-X5MUH7</code>\n\nИли команда:\n<code>/link AIA-X5MUH7</code>${bot ? `\n\n${bot}` : ''}`
  )
}

async function askForPersonalId(chatId) {
  await sendTelegramMessage(
    chatId,
    '🔑 Отправьте ваш <b>личный ID</b> с платформы Academy.\n\nФормат: <code>AIA-XXXXXX</code>\n\nЕго можно скопировать в личном кабинете → раздел Telegram.'
  )
}

async function sendMessageInvalidId(chatId) {
  await sendTelegramMessage(
    chatId,
    '❌ Неверный формат.\n\nНужен ID вида <code>AIA-XXXXXX</code> из личного кабинета Academy.'
  )
}
