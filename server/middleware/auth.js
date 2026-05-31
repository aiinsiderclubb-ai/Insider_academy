import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret'

export const ADMIN_ROLES = ['admin', 'editor', 'moderator']

export function signUserToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
}

export function signAdminToken(role = 'admin') {
  return jwt.sign({ role }, ADMIN_JWT_SECRET, { expiresIn: '8h' })
}

export function requireUser(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.sub
    req.userEmail = payload.email
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function optionalUser(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      req.userId = payload.sub
      req.userEmail = payload.email
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
