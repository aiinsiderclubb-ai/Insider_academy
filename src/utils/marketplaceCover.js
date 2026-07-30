const SVG_ONLY_COVERS = new Set([
  'claude-skills-library',
  'mcp-starter-pack-business',
  'multi-agent-ops-team',
  'voice-agent-kit-beauty-salon',
  'voice-agent-kit-clinic-services',
])

const LAUNCH_PRODUCT_COVERS = {
  'agent-brief-canvas': '/marketplace/launch/ai-agent-brief-canvas.png',
  'n8n-production-checklist': '/marketplace/launch/n8n-production-checklist.png',
  'prompt-evaluation-starter': '/marketplace/launch/prompt-evaluation-starter.png',
  'telegram-notify-bot-kit': '/marketplace/launch/telegram-notify-bot-kit.png',
  'salon-reminder-system': '/marketplace/launch/salon-reminder-system.png',
  'agent-audit-kit': '/marketplace/launch/ai-agent-audit-kit.png',
}

/**
 * Every Marketplace surface uses the shipped product artwork. Products may
 * override the convention with coverImage; the rest resolve by slug.
 */
export function getMarketplaceCoverImage(productOrSlug) {
  if (productOrSlug && typeof productOrSlug === 'object') {
    const slug = productOrSlug.slug || productOrSlug.id
    if (LAUNCH_PRODUCT_COVERS[slug]) return LAUNCH_PRODUCT_COVERS[slug]
    if (productOrSlug.coverImage) return productOrSlug.coverImage
    return getMarketplaceCoverImage(slug)
  }

  const slug = String(productOrSlug || 'chatgpt-prompt-vault')
  if (LAUNCH_PRODUCT_COVERS[slug]) return LAUNCH_PRODUCT_COVERS[slug]
  const extension = SVG_ONLY_COVERS.has(slug) ? 'svg' : 'png'
  return `/marketplace/${slug}.${extension}`
}
