const STORAGE_KEY = 'lms_admin_roadmap'

export const ROADMAP_STATUS = {
  planned: { label: 'Запланировано', order: 0 },
  in_progress: { label: 'В работе', order: 1 },
  done: { label: 'Готово', order: 2 },
}

export const defaultRoadmap = [
  {
    id: 'phase-mvp',
    title: 'MVP платформы',
    quarter: 'Q1 2026',
    status: 'done',
    tasks: [
      { id: 'mvp-courses', title: 'Каталог курсов и уроки с видео', status: 'done' },
      { id: 'mvp-auth', title: 'Регистрация и личный кабинет', status: 'done' },
      { id: 'mvp-hw', title: 'Домашние задания и проверка', status: 'done' },
      { id: 'mvp-cert', title: 'Сертификаты после прохождения', status: 'done' },
    ],
  },
  {
    id: 'phase-payments',
    title: 'Монетизация',
    quarter: 'Q2 2026',
    status: 'in_progress',
    tasks: [
      { id: 'pay-tribute', title: 'Оплата через Tribute', status: 'done' },
      { id: 'pay-webhook', title: 'Webhook и автовыдача доступа', status: 'in_progress' },
      { id: 'pay-promo', title: 'Промокоды и реферальные скидки', status: 'done' },
      { id: 'pay-subscription', title: 'Подписка AI Insider Club', status: 'planned' },
    ],
  },
  {
    id: 'phase-growth',
    title: 'Рост и маркетинг',
    quarter: 'Q2–Q3 2026',
    status: 'in_progress',
    tasks: [
      { id: 'gr-landing', title: 'Лендинги курсов и social proof', status: 'done' },
      { id: 'gr-seo', title: 'SEO, блог, Open Graph', status: 'in_progress' },
      { id: 'gr-email', title: 'Email-рассылки и онбординг', status: 'planned' },
      { id: 'gr-telegram', title: 'Telegram-виджет и комьюнити', status: 'done' },
    ],
  },
  {
    id: 'phase-admin',
    title: 'Админ-панель 2.0',
    quarter: 'Q2 2026',
    status: 'in_progress',
    tasks: [
      { id: 'adm-dashboard', title: 'Дашборд с KPI и графиками', status: 'done' },
      { id: 'adm-roadmap', title: 'Интерактивный роадмап', status: 'in_progress' },
      { id: 'adm-export', title: 'Экспорт CSV (регистрации, покупки)', status: 'planned' },
      { id: 'adm-roles', title: 'Роли: редактор, модератор ДЗ', status: 'planned' },
    ],
  },
  {
    id: 'phase-scale',
    title: 'Масштабирование',
    quarter: 'Q3–Q4 2026',
    status: 'planned',
    tasks: [
      { id: 'sc-postgres', title: 'PostgreSQL в production', status: 'planned' },
      { id: 'sc-s3', title: 'S3 для файлов ДЗ и сертификатов', status: 'planned' },
      { id: 'sc-teams', title: 'Командные доступы B2B', status: 'planned' },
      { id: 'sc-analytics', title: 'Расширенная аналитика (воронка)', status: 'planned' },
    ],
  },
]

export const adminRecommendations = [
  {
    id: 'rec-hw',
    priority: 'high',
    title: 'Проверить домашние задания',
    desc: 'Новые ДЗ ждут оценки — откройте вкладку «ДЗ» и отметьте как увиденные.',
    tab: 'homework',
    icon: '📝',
  },
  {
    id: 'rec-cert',
    priority: 'medium',
    title: 'Выдать сертификаты',
    desc: 'Загрузите PDF/Image для пользователей, завершивших курсы.',
    tab: 'certificates',
    icon: '🎓',
  },
  {
    id: 'rec-courses',
    priority: 'medium',
    title: 'Обновить цены и описания',
    desc: 'Синхронизируйте цены с Tribute и добавьте актуальные обложки.',
    tab: 'courses',
    icon: '📚',
  },
  {
    id: 'rec-calendar',
    priority: 'low',
    title: 'Запланировать вебинары',
    desc: 'Добавьте события в календарь — они видны всем студентам.',
    tab: 'calendar',
    icon: '📅',
  },
  {
    id: 'rec-webhook',
    priority: 'high',
    title: 'Настроить Tribute webhook',
    desc: 'URL: /api/webhooks/tribute — без него доступ после оплаты не выдаётся автоматически.',
    tab: 'roadmap',
    icon: '🔗',
  },
]

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getRoadmap() {
  const stored = readStored()
  if (!stored?.phases?.length) return defaultRoadmap.map((p) => ({ ...p, tasks: p.tasks.map((t) => ({ ...t })) }))
  return stored.phases
}

export function saveRoadmap(phases) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phases, updatedAt: new Date().toISOString() }))
    window.dispatchEvent(new Event('lms-admin-roadmap-updated'))
  } catch (_) {}
}

export function cycleTaskStatus(current) {
  const order = ['planned', 'in_progress', 'done']
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]
}

export function calcPhaseProgress(phase) {
  if (!phase?.tasks?.length) return 0
  const done = phase.tasks.filter((t) => t.status === 'done').length
  return Math.round((done / phase.tasks.length) * 100)
}

export function calcOverallProgress(phases) {
  const all = phases.flatMap((p) => p.tasks || [])
  if (!all.length) return 0
  const done = all.filter((t) => t.status === 'done').length
  return Math.round((done / all.length) * 100)
}

export function resetRoadmap() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('lms-admin-roadmap-updated'))
}
