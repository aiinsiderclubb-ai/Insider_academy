export function formatApiError(err, lang = 'ru') {
  if (!err) return ''
  if (err.network) {
    return lang === 'ru' ? 'Нет связи с сервером. Проверьте интернет и API.' : 'Cannot reach the server. Check your connection.'
  }
  const data = err.data || {}
  if (data.errorRu) return data.errorRu
  if (lang === 'ru' && data.messageRu) return data.messageRu
  const msg = err.message || data.error || ''
  if (msg === 'Current password is incorrect') {
    return lang === 'ru' ? 'Неверный текущий пароль' : msg
  }
  if (msg === 'Invalid or expired token') {
    return lang === 'ru' ? 'Ссылка устарела или уже использована' : msg
  }
  if (msg === 'Password must be at least 6 characters' || msg === 'Password too short') {
    return lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : msg
  }
  return msg
}
