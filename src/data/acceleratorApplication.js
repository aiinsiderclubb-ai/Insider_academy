/** AI Insider Accelerator — анкета заявки */

export const ACCELERATOR_COURSE_TITLE = 'AI Insider Accelerator'
export const ACCELERATOR_ADMIN_TAB = 'accelerator-selection'
export const ACCELERATOR_APPLY_PATH = '/courses/ai-insider-accelerator/apply'

export const ACTIVITY_OPTIONS = [
  { id: 'studying', ru: 'Учусь', en: 'Studying' },
  { id: 'working', ru: 'Работаю', en: 'Working' },
  { id: 'freelance', ru: 'Фриланс', en: 'Freelancing' },
  { id: 'entrepreneur', ru: 'Предприниматель', en: 'Entrepreneur' },
  { id: 'job_seeking', ru: 'Ищу работу', en: 'Looking for work' },
  { id: 'other', ru: 'Другое', en: 'Other' },
]

export const AI_EXPERIENCE_OPTIONS = [
  { id: 'newbie', ru: 'Нет, я новичок', en: 'No, I am a beginner' },
  { id: 'chatgpt_simple', ru: 'Использую ChatGPT для простых задач', en: 'I use ChatGPT for simple tasks' },
  { id: 'regular', ru: 'Использую AI регулярно', en: 'I use AI regularly' },
  { id: 'automations', ru: 'Создаю автоматизации / ботов', en: 'I build automations / bots' },
  { id: 'professional', ru: 'Работаю с AI профессионально', en: 'I work with AI professionally' },
]

export const INTEREST_OPTIONS = [
  { id: 'content', ru: 'AI Content Creator', en: 'AI Content Creator' },
  { id: 'automation', ru: 'No-Code Automation', en: 'No-Code Automation' },
  { id: 'chatbots', ru: 'AI Chatbots', en: 'AI Chatbots' },
  { id: 'voice', ru: 'Voice Agents', en: 'Voice Agents' },
  { id: 'agents', ru: 'AI Agents', en: 'AI Agents' },
  { id: 'agency', ru: 'AI Agency', en: 'AI Agency' },
  { id: 'undecided', ru: 'Пока не определился', en: 'Not sure yet' },
]

export const SOURCE_OPTIONS = [
  { id: 'telegram', ru: 'Telegram', en: 'Telegram' },
  { id: 'tiktok', ru: 'TikTok', en: 'TikTok' },
  { id: 'instagram', ru: 'Instagram', en: 'Instagram' },
  { id: 'youtube', ru: 'YouTube', en: 'YouTube' },
  { id: 'google', ru: 'Google', en: 'Google' },
  { id: 'referral', ru: 'Рекомендация', en: 'Referral' },
  { id: 'other', ru: 'Другое', en: 'Other' },
]

export const APPLICATION_STATUS_LABELS = {
  new: { ru: 'Новая', en: 'New' },
  reviewed: { ru: 'На рассмотрении', en: 'Under review' },
  accepted: { ru: 'Принята', en: 'Accepted' },
  rejected: { ru: 'Отклонена', en: 'Rejected' },
}

export function labelForOption(options, id, lang) {
  const item = options.find((o) => o.id === id)
  if (!item) return id || '—'
  return lang === 'en' ? item.en : item.ru
}

export function labelInterests(ids = [], lang) {
  return ids.map((id) => labelForOption(INTEREST_OPTIONS, id, lang)).join(', ')
}
