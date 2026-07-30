import crypto from 'node:crypto'

export function hashSecurityToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex')
}

export function validateUserPassword(password) {
  const value = String(password || '')
  if (value.length < 10) {
    return {
      ok: false,
      error: 'Password must be at least 10 characters',
      errorRu: 'Пароль должен содержать не менее 10 символов',
    }
  }
  if (!/[A-Za-zА-Яа-яІіЇїЄє]/.test(value) || !/\d/.test(value)) {
    return {
      ok: false,
      error: 'Password must include a letter and a number',
      errorRu: 'Пароль должен содержать букву и цифру',
    }
  }
  return { ok: true }
}

export function safeSecretEqual(candidate, expected) {
  const left = Buffer.from(String(candidate || ''))
  const right = Buffer.from(String(expected || ''))
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right)
}
