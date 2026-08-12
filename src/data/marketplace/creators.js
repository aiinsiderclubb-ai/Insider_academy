/** Marketplace creators */

export const MARKETPLACE_CREATORS = [
  {
    id: 'creator-insider',
    slug: 'ai-insider',
    name: 'AI Insider',
    operatorName: 'Vladyslav Archer',
    roleRu: 'Основатель и lead mentor AI Insider Academy',
    roleEn: 'Founder and lead mentor at AI Insider Academy',
    bioRu: 'Внутренняя продуктовая команда Vladyslav Archer. Создаёт курсы, клиентские AI-системы, Vault и Marketplace releases.',
    bioEn: 'In-house product team led by Vladyslav Archer. Builds courses, client AI systems, Vault and Marketplace releases.',
    proofRu: ['Профиль основателя опубликован на странице команды', 'Каждый release проходит route, security и asset checks', 'Непроверенные продажи и отзывы не публикуются'],
    proofEn: ['Founder profile is published on Team page', 'Every release passes route, security and asset checks', 'Unverified sales and reviews are never displayed'],
    avatarGradient: 'linear-gradient(135deg, #a855f7, #f97316)',
    verified: true,
    salesCount: null,
    productCount: null,
    joinedAt: '2024-01',
  },
  {
    id: 'creator-n8n-lab',
    slug: 'n8n-automation-lab',
    name: 'n8n Automation Lab',
    operatorName: 'AI Insider Academy',
    roleRu: 'Внутренняя специализация',
    roleEn: 'In-house specialization',
    bioRu: 'Линейка AI Insider Academy для n8n, CRM, webhooks и мессенджеров. Не отдельная компания и не внешний анонимный автор.',
    bioEn: 'AI Insider Academy product line for n8n, CRM, webhooks and messengers. Not a separate company or anonymous external creator.',
    proofRu: ['JSON без встроенных секретов', 'Error/retry сценарии', 'Setup и rollback checklist'],
    proofEn: ['JSON ships without embedded secrets', 'Error and retry scenarios', 'Setup and rollback checklist'],
    avatarGradient: 'linear-gradient(135deg, #8da783, #8b5cf6)',
    verified: true,
    salesCount: null,
    productCount: null,
    joinedAt: '2024-06',
  },
  {
    id: 'creator-agent-studio',
    slug: 'agent-studio',
    name: 'Agent Studio',
    operatorName: 'AI Insider Academy',
    roleRu: 'Внутренняя специализация',
    roleEn: 'In-house specialization',
    bioRu: 'Линейка AI Insider Academy для RAG, voice и multi-agent систем. Архитектуру и релизы проверяет команда Academy.',
    bioEn: 'AI Insider Academy product line for RAG, voice and multi-agent systems. Architecture and releases are reviewed by Academy team.',
    proofRu: ['Guardrails и tool schemas', 'Human handoff', 'Evaluation и deployment checklist'],
    proofEn: ['Guardrails and tool schemas', 'Human handoff', 'Evaluation and deployment checklist'],
    avatarGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    verified: true,
    salesCount: null,
    productCount: null,
    joinedAt: '2024-09',
  },
]

export const CREATOR_REVENUE_SHARE = { creator: 0.7, platform: 0.3 }

export function getMarketplaceCreator(idOrSlug) {
  return MARKETPLACE_CREATORS.find((c) => c.id === idOrSlug || c.slug === idOrSlug) || null
}
