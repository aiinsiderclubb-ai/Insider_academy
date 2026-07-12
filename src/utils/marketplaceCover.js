/**
 * Generative marketplace covers from title hash.
 * Brand palette only: --accent → dark, varied angles.
 */

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * @param {string} seed - usually product title
 * @returns {{ background: string, '--cover-angle': string }}
 */
export function getMarketplaceCoverStyle(seed = '') {
  const h = hashString(String(seed))
  const angle = (h % 24) * 15 // 0°…345° in 15° steps
  const mid = 38 + (h % 28) // mid stop 38–65%
  const dark = h % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-elevated)'
  const tip = (h % 7) === 0
    ? `color-mix(in srgb, var(--accent-hot) 55%, var(--accent))`
    : `var(--accent)`
  const midColor = `color-mix(in srgb, var(--accent) ${28 + (h % 24)}%, ${dark})`

  return {
    background: `linear-gradient(${angle}deg, ${tip} 0%, ${midColor} ${mid}%, ${dark} 100%)`,
    '--cover-angle': `${angle}deg`,
  }
}
