import { isPrelaunchMode } from '../config.js'

export const PRELAUNCH_ERROR = {
  error: 'Feature unavailable during prelaunch',
  errorRu: 'Функция временно недоступна до запуска платформы',
  code: 'PRELAUNCH_MODE',
}

export function prelaunchBlocked(_req, res, next) {
  if (!isPrelaunchMode()) return next()
  return res.status(423).json(PRELAUNCH_ERROR)
}

export function prelaunchServiceGuard() {
  if (!isPrelaunchMode()) return null
  return { ok: false, ...PRELAUNCH_ERROR }
}
