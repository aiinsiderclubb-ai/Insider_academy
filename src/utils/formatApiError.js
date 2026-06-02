export function formatApiError(err, lang = 'ru') {
  if (!err) return ''
  if (err.network) {
    return lang === 'ru'
      ? 'Нет связи с API. Проверьте интернет или подождите минуту (сервер мог «заснуть»).'
      : 'Cannot reach the API. Check your connection or wait a moment (server may be waking up).'
  }
  const raw = err.message || ''
  if (/load failed|failed to fetch/i.test(raw)) {
    return lang === 'ru'
      ? 'Нет связи с API. Проверьте интернет или подождите минуту.'
      : 'Cannot reach the API. Check your connection or wait a moment.'
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
  if (msg === 'Invalid or expired code') {
    return lang === 'ru' ? 'Неверный или просроченный код' : msg
  }
  if (msg === 'Invalid email or password') {
    return lang === 'ru' ? (data.errorRu || 'Неверный email или пароль') : msg
  }
  if (msg === 'Email not verified') {
    return lang === 'ru'
      ? 'Email не подтверждён — введите 6‑значный код из письма или запросите код повторно.'
      : 'Email is not verified — enter the 6-digit code from the email or request a new code.'
  }
  if (msg === 'Password must be at least 6 characters' || msg === 'Password too short') {
    return lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : msg
  }
  return msg
}
