import { api, checkApiOnline } from './client'

const KEY = 'lms_calendar_events'
let cache = null

const defaultEvents = [
  { id: 'e1', date: new Date(new Date().getFullYear(), 2, 20, 14, 0).toISOString(), title: 'Вебинар: AI ChatBot и автоматизация', titleEn: 'Webinar: AI ChatBot and automation', description: 'Разбор кейсов и ответы на вопросы', descriptionEn: 'Case studies and Q&A', type: 'webinar' },
  { id: 'e2', date: new Date(new Date().getFullYear(), 3, 14, 15, 0).toISOString(), title: 'Вебинар: Голосовые AI-агенты', titleEn: 'Webinar: Voice AI agents', description: 'Внедрение в бизнес', descriptionEn: 'Business implementation', type: 'webinar' },
  { id: 'e3', date: new Date(new Date().getFullYear(), 3, 17, 14, 0).toISOString(), title: 'Вебинар: AI Content Factory', titleEn: 'Webinar: AI Content Factory', description: 'Фабрика контента без рутины', descriptionEn: 'Content factory without routine', type: 'webinar' },
  { id: 'e4', date: new Date(new Date().getFullYear(), 4, 3, 16, 0).toISOString(), title: 'Вебинар: AI-агенты и автоматизация', titleEn: 'Webinar: AI agents and automation', description: 'Multi-agent системы', descriptionEn: 'Multi-agent systems', type: 'webinar' },
]

function getLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultEvents
    }
  } catch (_) {}
  return defaultEvents
}

export function getCalendarEvents() {
  return cache || getLocal()
}

export async function fetchCalendarEvents() {
  try {
    if (await checkApiOnline()) {
      const events = await api.getCalendarEvents()
      cache = events.length ? events : defaultEvents
      return cache
    }
  } catch (_) {}
  cache = getLocal()
  return cache
}

export function setCalendarEvents(list) {
  cache = list
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('lms-calendar-updated'))
  } catch (_) {}
}
