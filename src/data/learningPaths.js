import { TELEGRAM_COMMUNITY } from './siteLinks'

/** Учебные пути для онбординга после регистрации */
export const LEARNING_PATHS = [
  {
    id: 'agent',
    icon: '🤖',
    accent: '#6366f1',
    titleRu: 'AI Agents',
    titleEn: 'AI Agents',
    descRu: 'Агенты, оркестрация, голосовые сценарии',
    descEn: 'Agents, orchestration, voice flows',
    courseId: 'ai-agent-engineer',
    courseSlug: 'ai-agent-engineer',
    productSlug: 'multi-agent-ops-team',
    productId: 'mp-agent-multi-ops',
  },
  {
    id: 'automation',
    icon: '⚙️',
    accent: '#22c55e',
    titleRu: 'Automation',
    titleEn: 'Automation',
    descRu: 'n8n, воркфлоу, интеграции с CRM',
    descEn: 'n8n, workflows, CRM integrations',
    courseId: 'ai-automation-engineer',
    courseSlug: 'ai-automation-engineer',
    productSlug: 'lead-generation-workflow',
    productId: 'mp-workflow-lead-gen',
  },
  {
    id: 'content',
    icon: '✍️',
    accent: '#ec4899',
    titleRu: 'Content',
    titleEn: 'Content',
    descRu: 'Промпты, контент-системы, соцсети',
    descEn: 'Prompts, content systems, social',
    courseId: 'ai-content-creator',
    courseSlug: 'ai-content-creator',
    productSlug: 'chatgpt-prompt-vault',
    productId: 'mp-prompt-chatgpt-vault',
  },
  {
    id: 'business',
    icon: '💼',
    accent: '#f97316',
    titleRu: 'Business',
    titleEn: 'Business',
    descRu: 'Оффер, клиенты, AI-агентство',
    descEn: 'Offers, clients, AI agency',
    courseId: 'ai-business-builder',
    courseSlug: 'ai-business-builder',
    productSlug: 'agent-audit-kit',
    productId: 'mp-biz-agent-audit',
  },
]

export function getLearningPath(id) {
  return LEARNING_PATHS.find((p) => p.id === id) || null
}

export { TELEGRAM_COMMUNITY }
