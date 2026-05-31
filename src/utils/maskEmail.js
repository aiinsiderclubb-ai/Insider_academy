/** Частично скрывает email для публикации на сайте */
export function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return ''
  const [local, domain] = email.split('@')
  if (!local || !domain) return ''
  if (local.length <= 1) return `*@${domain}`
  if (local.length === 2) return `${local[0]}*@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}
