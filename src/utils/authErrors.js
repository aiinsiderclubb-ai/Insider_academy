const API_ERROR_MAP = {
  ru: {
    'Invalid email': 'Введите корректный email.',
    'Password must be at least 10 characters': 'Пароль должен содержать минимум 10 символов, букву и цифру.',
    'Password must include a letter and a number': 'Пароль должен содержать минимум 10 символов, букву и цифру.',
    'User already exists': 'Этот email уже зарегистрирован. Войдите или восстановите пароль.',
    'Registration failed': 'Не удалось создать аккаунт. Попробуйте снова.',
    'Invalid email or password': 'Неверный email или пароль.',
    'Email not verified': 'Подтвердите email — код отправлен на почту.',
  },
  en: {
    'Invalid email': 'Please enter a valid email.',
    'Password must be at least 10 characters': 'Use at least 10 characters with a letter and a number.',
    'Password must include a letter and a number': 'Use at least 10 characters with a letter and a number.',
    'User already exists': 'This email is already registered. Log in or reset your password.',
    'Registration failed': 'Could not create account. Please try again.',
    'Invalid email or password': 'Invalid email or password.',
    'Email not verified': 'Please verify your email — we sent a new code.',
  },
}

export function mapAuthApiError(err, lang = 'ru', fallbackKey = 'register.errorGeneric') {
  if (err?.status === 409) {
    return lang === 'en'
      ? 'This email is already registered. Log in or reset your password.'
      : 'Этот email уже зарегистрирован. Войдите или восстановите пароль.'
  }
  if (err?.network) {
    return lang === 'en'
      ? 'Could not reach the server. Check your connection and try again.'
      : 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.'
  }
  if (err?.status >= 500) {
    return lang === 'en'
      ? 'Server is temporarily unavailable. Please try again in a minute.'
      : 'Сервер временно недоступен. Попробуйте через минуту.'
  }
  const mapped = API_ERROR_MAP[lang]?.[err?.message]
  if (mapped) return mapped
  if (err?.status === 400 && err?.message) return err.message
  return null
}
