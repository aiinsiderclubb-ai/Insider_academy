import { config } from './config.js'
import { sendMessage } from './telegramApi.js'
import { confirmLink, linkByPersonalId, unlinkChat } from './lmsClient.js'

const PERSONAL_ID_RE = /^AIA-[A-Z0-9]{6}$/i

export async function handleTelegramUpdate(update) {
  const msg = update?.message
  if (!msg) return

  const chatId = String(msg.chat.id)
  const text = (msg.text || '').trim()
  const username = msg.from?.username || ''
  const firstName = msg.from?.first_name || ''

  if (text.startsWith('/start')) {
    const payload = (text.split(' ')[1] || '').trim()
    if (payload.startsWith('link_')) {
      return handleLinkToken(chatId, payload.slice(5), username)
    }
    return sendWelcome(chatId, firstName)
  }

  if (text.startsWith('/link')) {
    const arg = text.slice(5).trim()
    if (!arg) return askForPersonalId(chatId)
    if (arg.startsWith('link_')) return handleLinkToken(chatId, arg.slice(5), username)
    if (/^[a-f0-9]{16,64}$/i.test(arg)) return handleLinkToken(chatId, arg, username)
    if (PERSONAL_ID_RE.test(arg)) return handleLinkPersonalId(chatId, arg.toUpperCase(), username)
    return sendInvalidId(chatId)
  }

  if (PERSONAL_ID_RE.test(text)) {
    return handleLinkPersonalId(chatId, text.toUpperCase(), username)
  }

  if (text === '/stop' || text === '/unlink') {
    await unlinkChat(chatId)
    return sendMessage(chatId, '🔕 Уведомления отключены.\n\nСнова подключить: /start и ваш ID с платформы.')
  }

  if (text === '/help') {
    return sendMessage(
      chatId,
      `<b>📖 Справка по боту</b>\n\n/start — приветствие\n<code>AIA-XXXXXX</code> — привязка аккаунта\n/link AIA-XXXXXX — то же самое\n/stop — отключить уведомления\n\n<b>Что приходит в Telegram:</b>\n✅ принятое ДЗ (урок, время, оценка, комментарий)\n📝 ДЗ на доработку\n🎁 промокоды\n📚 новости курсов\n⭐ статус отзывов`
    )
  }

  return askForPersonalId(chatId)
}

async function handleLinkPersonalId(chatId, personalId, username) {
  try {
    const result = await linkByPersonalId({ personalId, chatId, username })
    await sendMessage(
      chatId,
      `✅ <b>Готово! Telegram подключён</b>\n\n👤 Аккаунт: <code>${escEmail(result.email || personalId)}</code>\n\n🔔 <b>Вы будете получать:</b>\n• проверку домашних заданий (урок, оценка, комментарий)\n• промокоды и новости Academy\n• статус отзывов и покупок\n\n⚙️ Настройки уведомлений — в личном кабинете на сайте.\n\n/stop — отключить бота`
    )
  } catch (err) {
    await sendMessage(
      chatId,
      `❌ <b>Не удалось привязать</b>\n\n${escEmail(err.message)}\n\nПроверьте ID в кабинете Academy (<code>AIA-XXXXXX</code>).`
    )
  }
}

async function handleLinkToken(chatId, token, username) {
  try {
    const result = await confirmLink({ token, chatId, username })
    await sendMessage(
      chatId,
      `✅ <b>Готово!</b> Telegram подключён.\n\nАккаунт: ${result.email || 'Academy'}\n\n/stop — отключить`
    )
  } catch (err) {
    await sendMessage(
      chatId,
      `❌ ${err.message}\n\nИли отправьте ID: <code>AIA-XXXXXX</code> из кабинета.`
    )
  }
}

async function sendWelcome(chatId, firstName) {
  const name = firstName ? `, ${firstName}` : ''
  const bot = config.botUsername ? `@${config.botUsername}` : ''
  await sendMessage(
    chatId,
    `👋 <b>Здравствуйте${name}!</b>\n\n🤖 Я бот уведомлений <b>AI Insider Academy</b>.\n\n📩 Пришлите ваш <b>личный ID</b> с платформы — одним сообщением.\n\n🔑 Формат: <code>AIA-XXXXXX</code>\n(Личный кабинет → Telegram на myinsideracademy.com)\n\n📝 Пример: <code>AIA-X5MUH7</code>\n\nИли команда: <code>/link AIA-X5MUH7</code>${bot ? `\n\n${bot}` : ''}\n\n/help — справка`
  )
}

function escEmail(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function askForPersonalId(chatId) {
  await sendMessage(
    chatId,
    '🔑 Отправьте ваш <b>личный ID</b> с платформы.\n\nФормат: <code>AIA-XXXXXX</code>\n\nСкопируйте в личном кабинете Academy → Telegram.'
  )
}

async function sendInvalidId(chatId) {
  await sendMessage(chatId, '❌ Нужен ID вида <code>AIA-XXXXXX</code> из личного кабинета Academy.')
}
