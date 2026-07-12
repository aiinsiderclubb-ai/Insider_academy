/** Еженедельные async-челленджи. Ротация по ISO-неделе. */

function getIsoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export const WEEKLY_CHALLENGES = [
  {
    id: 'agent-weekend',
    icon: 'bot',
    titleRu: 'Собери агента за выходные',
    titleEn: 'Build an agent this weekend',
    descRu: 'Соберите простого агента (поддержка / лиды / запись) и опишите сценарий в 5–8 предложениях.',
    descEn: 'Build a simple agent (support / leads / booking) and describe the flow in 5–8 sentences.',
    badgeId: 'challenge_agent',
    linkRu: '/courses/ai-agent-engineer',
    linkEn: '/courses/ai-agent-engineer',
    productSlug: 'multi-agent-ops-team',
  },
  {
    id: 'n8n-evening',
    icon: 'settings',
    titleRu: 'Запусти n8n за вечер',
    titleEn: 'Ship an n8n flow tonight',
    descRu: 'Соберите workflow: форма → CRM / Slack. Пришлите скрин или короткое описание узлов.',
    descEn: 'Build a workflow: form → CRM / Slack. Submit a screenshot or short node description.',
    badgeId: 'challenge_n8n',
    linkRu: '/courses/first-automation-n8n',
    linkEn: '/courses/first-automation-n8n',
    productSlug: 'lead-generation-workflow',
  },
  {
    id: 'prompt-pack',
    icon: 'sparkles',
    titleRu: 'Пакет из 10 промптов',
    titleEn: 'Pack of 10 prompts',
    descRu: 'Соберите 10 промптов под свою нишу и опишите, какой результат даёт каждый.',
    descEn: 'Create 10 niche prompts and describe the outcome of each.',
    badgeId: 'challenge_prompts',
    linkRu: '/marketplace/chatgpt-prompt-vault',
    linkEn: '/marketplace/chatgpt-prompt-vault',
    productSlug: 'chatgpt-prompt-vault',
  },
  {
    id: 'voice-script',
    icon: 'mic',
    titleRu: 'Скрипт голосового агента',
    titleEn: 'Voice agent script',
    descRu: 'Напишите диалог записи (приветствие → квалификация → слот → подтверждение).',
    descEn: 'Write a booking dialog (greeting → qualify → slot → confirm).',
    badgeId: 'challenge_voice',
    linkRu: '/marketplace/voice-agent-kit-beauty-salon',
    linkEn: '/marketplace/voice-agent-kit-beauty-salon',
    productSlug: 'voice-agent-kit-beauty-salon',
  },
]

export function getCurrentChallenge(date = new Date()) {
  const weekKey = getIsoWeekKey(date)
  const idx = Math.abs(hash(weekKey)) % WEEKLY_CHALLENGES.length
  const base = WEEKLY_CHALLENGES[idx]
  return {
    ...base,
    weekKey,
    endsAt: endOfIsoWeek(date).toISOString(),
  }
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0
  return h
}

function endOfIsoWeek(date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() + (7 - day))
  d.setHours(23, 59, 59, 999)
  return d
}

export const CHALLENGE_BADGES = {
  challenge_agent: { icon: 'bot', titleRu: 'Агент выходных', titleEn: 'Weekend agent' },
  challenge_n8n: { icon: 'settings', titleRu: 'n8n за вечер', titleEn: 'n8n night' },
  challenge_prompts: { icon: 'sparkles', titleRu: 'Промпт-мастер', titleEn: 'Prompt master' },
  challenge_voice: { icon: 'mic', titleRu: 'Голосовой сценарист', titleEn: 'Voice scriptwriter' },
}
