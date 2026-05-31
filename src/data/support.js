import { TELEGRAM_MANAGER } from './siteLinks'

/** Менеджер курсов — @vladyslavarcher (переопределяется через VITE_SUPPORT_TELEGRAM_URL) */
export const SUPPORT_TELEGRAM_URL = import.meta.env.VITE_SUPPORT_TELEGRAM_URL || TELEGRAM_MANAGER
