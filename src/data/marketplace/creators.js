/** Marketplace creators */

export const MARKETPLACE_CREATORS = [
  {
    id: 'creator-insider',
    slug: 'ai-insider',
    name: 'AI Insider',
    bioRu: 'Официальная команда AI Insider Academy — курсы, Vault и Marketplace.',
    bioEn: 'Official AI Insider Academy team — courses, Vault and Marketplace.',
    avatarGradient: 'linear-gradient(135deg, #a855f7, #f97316)',
    verified: true,
    salesCount: 12400,
    productCount: 24,
    joinedAt: '2024-01',
  },
  {
    id: 'creator-n8n-lab',
    slug: 'n8n-automation-lab',
    name: 'n8n Automation Lab',
    bioRu: 'Специализация: n8n, CRM и мессенджеры для агентств.',
    bioEn: 'Specializing in n8n, CRM and messenger automations for agencies.',
    avatarGradient: 'linear-gradient(135deg, #16a34a, #06b6d4)',
    verified: true,
    salesCount: 3200,
    productCount: 8,
    joinedAt: '2024-06',
  },
  {
    id: 'creator-agent-studio',
    slug: 'agent-studio',
    name: 'Agent Studio',
    bioRu: 'RAG, voice agents и multi-agent системы.',
    bioEn: 'RAG, voice agents and multi-agent systems.',
    avatarGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    verified: true,
    salesCount: 2100,
    productCount: 6,
    joinedAt: '2024-09',
  },
]

export const CREATOR_REVENUE_SHARE = { creator: 0.7, platform: 0.3 }

export function getMarketplaceCreator(idOrSlug) {
  return MARKETPLACE_CREATORS.find((c) => c.id === idOrSlug || c.slug === idOrSlug) || null
}
