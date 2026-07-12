/** Client-side giveaway chance bonuses (share / referral). Base + Telegram come from API. */

const STORAGE_PREFIX = 'lms_giveaway_chances_v1'

export const CHANCE_BASE = 1
export const CHANCE_TELEGRAM = 1
export const CHANCE_SHARE = 2
export const CHANCE_REFERRAL = 3

function storageKey(slug, userKey) {
  return `${STORAGE_PREFIX}:${slug}:${userKey || 'anon'}`
}

function readStore(slug, userKey) {
  try {
    const raw = localStorage.getItem(storageKey(slug, userKey))
    if (!raw) return { shared: false, referralCount: 0 }
    const parsed = JSON.parse(raw)
    return {
      shared: Boolean(parsed.shared),
      referralCount: Math.max(0, Number(parsed.referralCount) || 0),
    }
  } catch {
    return { shared: false, referralCount: 0 }
  }
}

function writeStore(slug, userKey, data) {
  try {
    localStorage.setItem(storageKey(slug, userKey), JSON.stringify(data))
  } catch (_) {}
}

export function getChanceState(slug, userKey) {
  return readStore(slug, userKey)
}

export function markShared(slug, userKey) {
  const cur = readStore(slug, userKey)
  if (cur.shared) return cur
  const next = { ...cur, shared: true }
  writeStore(slug, userKey, next)
  return next
}

export function bumpReferral(slug, referrerKey) {
  if (!referrerKey) return null
  const cur = readStore(slug, referrerKey)
  const next = { ...cur, referralCount: cur.referralCount + 1 }
  writeStore(slug, referrerKey, next)
  return next
}

export function computeChances({ entered, channelSubscribed, shared, referralCount }) {
  let total = 0
  if (entered) total += CHANCE_BASE
  if (entered && channelSubscribed) total += CHANCE_TELEGRAM
  if (entered && shared) total += CHANCE_SHARE
  if (entered) total += Math.max(0, referralCount) * CHANCE_REFERRAL
  return total
}

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

export function captureReferralFromUrl() {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      sessionStorage.setItem('lms_giveaway_pending_ref', ref)
      return ref
    }
    return sessionStorage.getItem('lms_giveaway_pending_ref')
  } catch {
    return null
  }
}

export function consumePendingReferral() {
  try {
    const ref = sessionStorage.getItem('lms_giveaway_pending_ref')
    sessionStorage.removeItem('lms_giveaway_pending_ref')
    return ref
  } catch {
    return null
  }
}
