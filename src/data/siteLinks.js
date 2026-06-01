/** Связь маркeting-сайта AI Insider и LMS-платформы Academy */
export const ACADEMY_URL = import.meta.env.VITE_ACADEMY_URL || 'https://myinsideracademy.com'
export const ACADEMY_LOGIN = `${ACADEMY_URL}/login`
export const ACADEMY_REGISTER = `${ACADEMY_URL}/register`
export const ACADEMY_COURSES = `${ACADEMY_URL}/courses`
export const MAIN_SITE_URL = import.meta.env.VITE_MAIN_SITE_URL || 'https://insiderai.it.com'
export const MAIN_SITE_COURSES = `${MAIN_SITE_URL}/courses`
export const MAIN_SITE_COMMUNITY = `${MAIN_SITE_URL}/community`
export const TELEGRAM_COMMUNITY = import.meta.env.VITE_TELEGRAM_COMMUNITY_URL || 'https://t.me/aiinsiderclub'
export const TELEGRAM_MANAGER = import.meta.env.VITE_TELEGRAM_MANAGER_URL || 'https://t.me/vladyslavarcher'

/** Бот уведомлений Academy (ДЗ, промо, новости) — username или полная ссылка */
const notifyBotUsername = (
  import.meta.env.VITE_TELEGRAM_NOTIFY_BOT_USERNAME || 'InsiderAcademyNotifyBot'
).replace(/^@/, '')
export const TELEGRAM_NOTIFY_BOT = import.meta.env.VITE_TELEGRAM_NOTIFY_BOT_URL
  || (notifyBotUsername ? `https://t.me/${notifyBotUsername}` : '')
export const CONTACT_EMAIL = 'hello@aiinsider.com'

export const PLATFORM_BRIDGE = {
  ru: {
    title: 'AI Insider — одна экосистема',
    text: 'На сайте insiderai.it.com — программы Chat-Bot, Voice Agent и VIP-менторство. На Academy — видеоуроки, домашние задания, сертификаты и личный кабинет. Оплата на любом ресурсе открывает доступ к обучению здесь.',
    siteLabel: 'Сайт AI Insider',
    coursesLabel: 'Курсы на сайте',
    academyLabel: 'Каталог Academy',
    managerLabel: 'Менеджер @vladyslavarcher',
  },
  en: {
    title: 'AI Insider — one ecosystem',
    text: 'insiderai.it.com showcases Chat-Bot, Voice Agent and VIP mentorship tracks. Academy is where you watch lessons, submit homework, earn certificates and track progress. Purchase on either site unlocks learning here.',
    siteLabel: 'AI Insider website',
    coursesLabel: 'Courses on website',
    academyLabel: 'Academy catalog',
    managerLabel: 'Manager @vladyslavarcher',
  },
}
