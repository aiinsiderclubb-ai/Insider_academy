const buckets = new Map()

export function rateLimit({ key, windowMs = 60_000, max = 10 }) {
  const now = Date.now()
  let entry = buckets.get(key)
  if (!entry || now - entry.start > windowMs) {
    entry = { start: now, count: 0 }
    buckets.set(key, entry)
  }
  entry.count += 1
  if (entry.count > max) {
    const err = new Error('Too many requests')
    err.status = 429
    throw err
  }
}
