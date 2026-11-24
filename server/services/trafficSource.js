/*
 * Where a visitor came from, as one short label: the utm_source of the link
 * they followed, or else the site that referred them. Known platforms collapse
 * to one name each (m.facebook.com, l.facebook.com and lm.facebook.com are all
 * "facebook"), so reports group them instead of listing every subdomain.
 */

const KNOWN = [
  [/(^|\.)google\./, 'google'],
  [/(^|\.)(t\.me|telegram\.(org|me))$|^telegram$|^tg$/, 'telegram'],
  [/tiktok/, 'tiktok'],
  [/instagram|^ig$/, 'instagram'],
  [/youtube|youtu\.be|^yt$/, 'youtube'],
  [/facebook|^fb$|(^|\.)fb\.com$/, 'facebook'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$|^twitter$|^x$/, 'x'],
  [/threads\.net|^threads$/, 'threads'],
  [/linkedin|lnkd\.in/, 'linkedin'],
  [/(^|\.)bing\.com$|^bing$/, 'bing'],
  [/yandex|^ya\.ru$/, 'yandex'],
  [/duckduckgo/, 'duckduckgo'],
  [/chatgpt|openai/, 'chatgpt'],
  [/perplexity/, 'perplexity'],
  [/gumroad/, 'gumroad'],
  [/reddit/, 'reddit'],
  [/(^|\.)vk\.(com|ru)$|^vk$/, 'vk'],
]

const OWN_HOSTS = ['myinsideracademy.com', 'localhost', '127.0.0.1']

function hostOf(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isOwnHost(host, extra = []) {
  return [...OWN_HOSTS, ...extra].some((own) => own && (host === own || host.endsWith(`.${own}`)))
}

/** A label for a utm_source value or a referring host; '' when there is none. */
export function normalizeSource(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  const label = raw.includes('.') || raw.includes('/') ? hostOf(raw) : raw
  if (!label) return ''
  for (const [pattern, name] of KNOWN) if (pattern.test(label)) return name
  return label.replace(/[^a-z0-9._-]/g, '').slice(0, 40)
}

/**
 * The source of a landing: utm_source wins, then an outside referrer. Our own
 * domain as a referrer is navigation inside the site, not a source.
 */
export function sourceOfVisit({ utmSource, referrer, ownHost } = {}) {
  const fromUtm = normalizeSource(utmSource)
  if (fromUtm) return fromUtm
  const host = hostOf(referrer)
  if (!host || isOwnHost(host, [hostOf(ownHost)])) return ''
  return normalizeSource(host)
}
