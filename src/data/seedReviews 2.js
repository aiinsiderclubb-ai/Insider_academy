/**
 * Curated approved reviews for homepage and course pages.
 * Inserted into SQLite on server start (idempotent) and merged in local/API reads.
 */
export const SEED_REVIEWS = [
  {
    id: 'rev-seed-productivity-1',
    courseId: 'ai-for-productivity',
    email: 'seed@insiderai.local',
    contactEmail: 'seed@insiderai.local',
    userName: 'Марина К.',
    rating: 5,
    text: 'За неделю собрала три рабочих сценария для почты и планирования. Объясняют без воды, сразу применяю в Notion.',
    status: 'approved',
    date: '2026-05-27T14:20:00.000Z',
  },
  {
    id: 'rev-seed-content-1',
    courseId: 'ai-content-creator',
    email: 'seed@insiderai.local',
    contactEmail: 'seed@insiderai.local',
    userName: 'Дмитрий П.',
    rating: 4,
    text: 'Сильный блок про контент-план и визуал. Хотелось бы чуть больше примеров для B2B, но в целом очень практично.',
    status: 'approved',
    date: '2026-05-25T09:10:00.000Z',
  },
  {
    id: 'rev-seed-automation-1',
    courseId: 'ai-automation-engineer',
    email: 'seed@insiderai.local',
    contactEmail: 'seed@insiderai.local',
    userName: 'Anna S.',
    rating: 5,
    text: 'Finally connected n8n to our CRM — the step-by-step automations saved me days of trial and error.',
    status: 'approved',
    date: '2026-05-22T16:45:00.000Z',
  },
  {
    id: 'rev-seed-n8n-1',
    courseId: 'first-automation-n8n',
    email: 'seed@insiderai.local',
    contactEmail: 'seed@insiderai.local',
    userName: 'Олег В.',
    rating: 4,
    text: 'Понятный вход в n8n: первый workflow за вечер. Минус — хотелось дольше разобрать ошибки в нодах.',
    status: 'approved',
    date: '2026-05-20T11:30:00.000Z',
  },
  {
    id: 'rev-seed-agent-1',
    courseId: 'ai-agent-engineer',
    email: 'seed@insiderai.local',
    contactEmail: 'seed@insiderai.local',
    userName: 'Yuki T.',
    rating: 5,
    text: 'Agent team design module is gold. Built a small research + writer stack for client reports.',
    status: 'approved',
    date: '2026-05-18T08:00:00.000Z',
  },
  {
    id: 'rev-seed-business-1',
    courseId: 'ai-business-builder',
    email: 'seed@insiderai.local',
    contactEmail: 'seed@insiderai.local',
    userName: 'Ірина М.',
    rating: 4,
    text: 'Добре структурований шлях від ідеї до оферу. Деякі уроки варто переглянути двічі — багато матеріалу.',
    status: 'approved',
    date: '2026-05-15T19:15:00.000Z',
  },
  {
    id: 'rev-seed-master-1',
    courseId: 'ai-productivity-master',
    email: 'seed@insiderai.local',
    contactEmail: 'seed@insiderai.local',
    userName: 'James R.',
    rating: 5,
    text: 'Went from random ChatGPT prompts to a repeatable weekly system. Worth it for freelancers.',
    status: 'approved',
    date: '2026-05-12T13:40:00.000Z',
  },
]

export function isApprovedSeedReview(r) {
  return r?.status === 'approved' && String(r?.text || '').trim().length > 0
}
