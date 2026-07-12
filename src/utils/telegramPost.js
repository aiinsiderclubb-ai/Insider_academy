/**
 * Парсит публичную ссылку на пост Telegram: https://t.me/channel/123
 */
export function parseTelegramPostUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && parts[0] !== 'c') {
      return { channel: parts[0], postId: parts[1] }
    }
  } catch (_) {}
  return null
}

export function getTelegramPostEmbedId(url) {
  const parsed = parseTelegramPostUrl(url)
  if (!parsed) return null
  return `${parsed.channel}/${parsed.postId}`
}
