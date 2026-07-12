const KEY = 'lms_challenge_submissions'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (_) {}
}

export function getChallengeSubmission(weekKey, email) {
  if (!weekKey || !email) return null
  const all = readAll()
  return all[`${email}:${weekKey}`] || null
}

export function submitChallenge({ weekKey, challengeId, email, text, priority = false }) {
  const all = readAll()
  const key = `${email}:${weekKey}`
  const entry = {
    weekKey,
    challengeId,
    email,
    text: String(text || '').trim(),
    priority: Boolean(priority),
    submittedAt: new Date().toISOString(),
  }
  all[key] = entry
  writeAll(all)
  return entry
}

export function listUserChallengeBadges(email) {
  if (!email) return []
  const all = readAll()
  const badges = []
  Object.values(all).forEach((entry) => {
    if (entry.email === email && entry.challengeId) {
      badges.push(entry.challengeId)
    }
  })
  return [...new Set(badges)]
}
