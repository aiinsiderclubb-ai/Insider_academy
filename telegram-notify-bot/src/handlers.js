import { config } from './config.js'
import { sendMessage } from './telegramApi.js'
import { confirmLink, linkByPersonalId, unlinkChat } from './lmsClient.js'

const PERSONAL_ID_RE = /^AIA-[A-Z0-9]{6}$/i

export async function handleTelegramUpdate(update) {
  const msg = update?.message
  if (!msg) return

  const chatId = String(msg.chat.id)
  const text = (msg.text || '').trim()

  if (text.startsWith('/start')) {
    const payload = text.split(' ')[1] || ''
    if (payload.startsWith('link_')) {
      const token = payload.slice(5)
      return handleLinkToken(chatId, token, msg.from?.username)
    }
    return sendWelcome(chatId)
  }

  if (text.startsWith('/link')) {
    const arg = text.slice(5).trim()
    if (!arg) {
      return sendMessage(
        chatId,
        'Укажите ваш <b>личный ID</b> с сайта Academy (формат <code>AIA-XXXXXX</code>):\n\n<code>/link AIA-ABC123</code>\n\nID виден в личном кабинете → Telegram.'
      )
    }
    if (arg.startsWith('link_')) {
      return handleLinkToken(chatId, arg.slice(5), msg.from?.username)
    }
    if (/^[a-f0-9]{16,64}$/i.test(arg)) {
      return handleLinkToken(chatId, arg, msg.from?.username)
    }
    if (PERSONAL_ID_RE.test(arg)) {
      return handleLinkPersonalId(chatId, arg.toUpperCase(), msg.from?.username)
    }
    return sendMessage(chatId, '❌ Неверный формат. Используйте ID из кабинета: <code>AIA-XXXXXX</code>')
  }

  if (PERSONAL_ID_RE.test(text)) {
    return handleLinkPersonalId(chatId, text.toUpperCase(), msg.from?.username)
  }

  if (text === '/stop' || text === '/unlink') {
    await unlinkChat(chatId)
    return sendMessage(
      chatId,
      '🔕 Уведомления отключены. Чтобы снова подключить — зайдите в личный кабинет Academy → Telegram.'
    )
  }

  if (text === '/help') {
    return sendMessage(
      chatId,
      '<b>Команды</b>\n/start — начало\n/link AIA-XXXXXX — привязать аккаунт по личному ID\n/help — справка\n/stop — отключить уведомления\n\nИли нажмите «Открыть бота» в кабинете Academy — привязка в один клик.'
    )
  }

  return sendMessage(
    chatId,
    'Откройте бота из личного кабинета Academy или отправьте:\n<code>/link AIA-XXXXXX</code>\n\n(личный ID указан в кабинете → Telegram)'
  )
}

async function handleLinkPersonalId(chatId, personalId, username) {
  try {
    const result = await linkByPersonalId({ personalId, chatId, username })
    await sendMessage(
      chatId,
      `✅ <b>Telegram подключён</b>\n\nАккаунт: ${result.email || personalId}\n\nУведомления: ДЗ, промокоды, новости.\n\nОтключить: /stop`
    )
  } catch (err) {
    await sendMessage(
      chatId,
      `❌ Не удалось привязать.\n\n${err.message}\n\nПроверьте ID в личном кабинете Academy (формат AIA-XXXXXX).`
    )
  }
}

async function handleLinkToken(chatId, token, username) {
  try {
    const result = await confirmLink({ token, chatId, username })
    await sendMessage(
      chatId,
      `✅ <b>Telegram подключён</b>\n\nАккаунт: ${result.email || 'Academy'}\n\nВы будете получать:\n• принятые ДЗ и оценки\n• новые промокоды\n• новости курсов и Academy\n\nОтключить: /stop`
    )
  } catch (err) {
    await sendMessage(
      chatId,
      `❌ Не удалось привязать аккаунт.\n\n${err.message}\n\nОткройте ссылку из личного кабинета ещё раз (ссылка действует 15 минут).`
    )
  }
}

async function sendWelcome(chatId) {
  const botUser = config.botUsername ? `@${config.botUsername}` : 'бота'
  await sendMessage(
    chatId,
    `👋 <b>AI Insider Academy</b>\n\nУведомления: ДЗ, промокоды, новости курсов.\n\n<b>Подключение</b>\n1. Личный кабинет на Academy → Telegram\n2. Нажмите «Открыть бота» <i>или</i> отправьте:\n<code>/link AIA-XXXXXX</code>\n\n(личный ID — в кабинете, формат AIA-XXXXXX)\n\n${botUser}`
  )
}
