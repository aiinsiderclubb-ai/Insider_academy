const SVG_ONLY_COVERS = new Set([
  'agent-audit-kit',
  'claude-skills-library',
  'mcp-starter-pack-business',
  'multi-agent-ops-team',
  'voice-agent-kit-beauty-salon',
  'voice-agent-kit-clinic-services',
])

/**
 * Every Marketplace surface uses the shipped product artwork. Products may
 * override the convention with coverImage; the rest resolve by slug.
 */
export function getMarketplaceCoverImage(productOrSlug) {
  if (productOrSlug && typeof productOrSlug === 'object') {
    if (productOrSlug.coverImage) return productOrSlug.coverImage
    return getMarketplaceCoverImage(productOrSlug.slug || productOrSlug.id)
  }

  const slug = String(productOrSlug || 'chatgpt-prompt-vault')
  const extension = SVG_ONLY_COVERS.has(slug) ? 'svg' : 'png'
  return `/marketplace/${slug}.${extension}`
}
