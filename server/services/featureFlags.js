import { getDb, parseJson } from '../db.js'

const KEY = 'feature_flags'

const DEFAULTS = {
  marketplace: true,
  vault: true,
  peerReview: false,
  emailSequences: true,
}

export async function getFeatureFlags() {
  const db = getDb()
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', [KEY])
  return { ...DEFAULTS, ...parseJson(row?.value, {}) }
}

export async function setFeatureFlags(partial) {
  const db = getDb()
  const current = await getFeatureFlags()
  const next = { ...current, ...partial }
  await db.run(
    `INSERT INTO analytics (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [KEY, JSON.stringify(next)]
  )
  return next
}
