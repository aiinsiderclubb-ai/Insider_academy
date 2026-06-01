/** Шаблоны отказа и Telegram для вкладки «Набор». */

export const REJECT_TEMPLATES = [
  {
    id: 'experience',
    label: 'Не подходит опыт',
    note: 'Спасибо за заявку! Сейчас мы набираем участников с другим уровнем подготовки. Рекомендуем бесплатный курс AI Start на платформе.',
  },
  {
    id: 'full',
    label: 'Набор закрыт',
    note: 'Спасибо за интерес к AI Insider Accelerator! К сожалению, на текущий поток мест уже нет. Мы сообщим о следующем наборе в Telegram-канале.',
  },
  {
    id: 'incomplete',
    label: 'Неполная анкета',
    note: 'Заявка не принята: не хватает информации в мотивационном письме. Вы можете подать заявку повторно с более развёрнутым ответом.',
  },
  {
    id: 'age',
    label: 'Возраст',
    note: 'Спасибо за заявку. Для участия в Accelerator требуется возраст от 18 лет. Будем рады видеть вас позже на платформе.',
  },
]

export const TELEGRAM_TEMPLATES = [
  {
    id: 'connect_bot',
    label: '🤖 Подключить бота',
    text: 'Здравствуйте! Это AI Insider Academy.\n\nПодключите Telegram-бот @InsiderAcademyNotifyBot — отправьте /start и ваш ID из личного кабинета (формат AIA-XXXXXX).\n\nТак вы будете получать статус заявки и уведомления о курсе.',
  },
  {
    id: 'invite_call',
    label: '📞 Пригласить на созвон',
    text: 'Здравствуйте! Ваша заявка на AI Insider Accelerator на рассмотрении.\n\nПриглашаем на короткий созвон-знакомство. Напишите, пожалуйста, удобное время (UTC+2) в ближайшие 2–3 дня.',
  },
  {
    id: 'waitlist',
    label: '⏳ Лист ожидания',
    text: 'Спасибо за заявку на AI Insider Accelerator!\n\nВы в листе ожидания. Мы свяжемся с вами, как только появится место в потоке. Следите за обновлениями на myinsideracademy.com',
  },
]

export function buildPromoCode(prefix = 'AIA') {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${part}`
}
