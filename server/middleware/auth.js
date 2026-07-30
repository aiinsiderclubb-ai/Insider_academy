import jwt from 'jsonwebtoken'
import { getDb } from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret'

export const ADMIN_ROLES = ['admin', 'editor', 'moderator']

export function signUserToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, tv: Number(user.token_version ?? user.tokenVersion ?? 0) },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export function signAdminToken(role = 'admin') {
  return jwt.sign({ role }, ADMIN_JWT_SECRET, { expiresIn: '8h' })
}

export async function requireUser(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await getDb().get('SELECT token_version, email_verified FROM users WHERE id = ?', [payload.sub])
    if (!user || Number(payload.tv || 0) !== Number(user.token_version || 0)) {
      return res.status(401).json({ error: 'Session expired' })
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Email not verified', requiresVerification: true })
    }
    req.userId = payload.sub
    req.userEmail = payload.email
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export async function optionalUser(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      const user = await getDb().get('SELECT token_version, email_verified FROM users WHERE id = ?', [payload.sub])
      if (user?.email_verified && Number(payload.tv || 0) === Number(user.token_version || 0)) {
        req.userId = payload.sub
        req.userEmail = payload.email
      }
    } catch (_) {}
  }
  next()
}

export function verifyAdminToken(token) {
  const payload = jwt.verify(token, ADMIN_JWT_SECRET)
  if (!ADMIN_ROLES.includes(payload.role)) throw new Error('invalid role')
  return payload
}

export function requireAdmin(...allowedRoles) {
  const roles = allowedRoles.length ? allowedRoles : ['admin']
  return (req, res, next) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Admin unauthorized' })
    try {
      const payload = verifyAdminToken(token)
      if (!roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }
      req.adminRole = payload.role
      next()
    } catch {
      return res.status(401).json({ error: 'Invalid admin token' })
    }
  }
}

/** @deprecated use requireAdmin('admin') */
export function requireAdminLegacy(req, res, next) {
  return requireAdmin('admin', 'editor', 'moderator')(req, res, next)
}

export { JWT_SECRET, ADMIN_JWT_SECRET }
