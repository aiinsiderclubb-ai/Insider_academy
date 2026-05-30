import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret'

export function signUserToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
}

export function signAdminToken() {
  return jwt.sign({ role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '8h' })
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

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Admin unauthorized' })
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET)
    if (payload.role !== 'admin') throw new Error('not admin')
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid admin token' })
  }
}

export { JWT_SECRET, ADMIN_JWT_SECRET }
