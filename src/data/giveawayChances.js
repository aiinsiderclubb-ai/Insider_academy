/** Shared display constants. Bonus state itself is authoritative on the server. */

export const CHANCE_BASE = 1
export const CHANCE_TELEGRAM = 1
export const CHANCE_SHARE = 2
export const CHANCE_REFERRAL = 3

export function maxPossibleChances(referralCount = 0) {
  return CHANCE_BASE + CHANCE_TELEGRAM + CHANCE_SHARE + Math.max(0, referralCount) * CHANCE_REFERRAL
}

/** Deterministic avatar initials for participant stack */
const AVATAR_POOL = [
  'МК', 'АС', 'ДП', 'ИВ', 'ОН', 'СК', 'ЕЛ', 'РН', 'ЮБ', 'ТК',
  'AB', 'CM', 'DK', 'FL', 'GH', 'JP', 'LR', 'NS', 'QT', 'VW',
]

export function buildParticipantAvatars(count, userInitial) {
  const n = Math.min(Math.max(0, count || 0), 12)
  const list = []
  for (let i = 0; i < Math.min(n, 5); i += 1) {
    list.push(AVATAR_POOL[i % AVATAR_POOL.length])
  }
  if (userInitial && n > 0) {
    list[0] = userInitial
  }
  return list
}

export function userInitials(user) {
  if (!user) return ''
  const name = String(user.name || '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  const email = String(user.email || '')
  return email.slice(0, 2).toUpperCase()
}

export function getReferralCode(user) {
  return user?.personalId || (user?.id != null ? `U${user.id}` : '')
}

export function buildReferralLink(slug, code) {
  if (typeof window === 'undefined' || !code) return ''
  const url = new URL(`/giveaway/${slug}`, window.location.origin)
  url.searchParams.set('ref', code)
  return url.toString()
}

const PENDING_REFERRAL_KEY = 'lms_giveaway_pending_ref'

export function captureReferralFromUrl(slug) {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      sessionStorage.setItem(PENDING_REFERRAL_KEY, JSON.stringify({ slug, ref }))
      return ref
    }
    return getPendingReferral(slug)
  } catch {
    return null
  }
}

export function getPendingReferral(slug) {
  try {
    const raw = sessionStorage.getItem(PENDING_REFERRAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.slug === slug ? parsed.ref : null
  } catch {
    return null
  }
}

export function consumePendingReferral(slug) {
  const ref = getPendingReferral(slug)
  if (!ref) return null
  try { sessionStorage.removeItem(PENDING_REFERRAL_KEY) } catch (_) {}
  return ref
}
