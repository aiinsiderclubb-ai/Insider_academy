import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { signUserToken } from '../middleware/auth.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js'
import { seedTestAccount } from '../seed.js'
import { TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_PASSWORD } from '../../src/data/testAccount.js'
import { ensurePersonalId } from '../services/personalId.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function createToken() {
  return crypto.randomBytes(32).toString('hex')
}

function isUniqueViolation(err) {
  return err?.code === '23505' || /UNIQUE constraint failed/i.test(String(err?.message || ''))
}

async function insertUser(db, email, hash, name) {
  if (db.driver === 'postgres') {
    const inserted = await db.get(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?) RETURNING id',
      [email, hash, name]
    )
    return inserted?.id
  }
  const result = await db.run(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, hash, name]
  )
  return result?.lastInsertRowid || null
}

router.post('/register', asyncHandler(async (req, res) => {
  const db = getDb()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')
  const name = String(req.body.name || email).trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const exists = await db.get('SELECT id FROM users WHERE email = ?', [email])
  if (exists) return res.status(409).json({ error: 'User already exists' })

  const hash = bcrypt.hashSync(password, 10)
  let userId
  try {
    userId = await insertUser(db, email, hash, name)
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'User already exists' })
    }
    throw err
  }

  if (!userId) {
    const row = await db.get('SELECT id FROM users WHERE email = ?', [email])
    userId = row?.id
  }
  if (!userId) {
    return res.status(500).json({ error: 'Registration failed' })
  }

  const personalId = await ensurePersonalId(db, userId)
  const user = { id: userId, email, name, emailVerified: false, personalId }

  await db.run('INSERT INTO registrations (id, email, name, personal_id, date) VALUES (?, ?, ?, ?, ?)', [
    `reg-${Date.now()}`, email, name, personalId, new Date().toISOString(),
  ]).catch((err) => {
    console.warn('[auth/register] registrations insert:', err.message)
  })

  const token = createToken()
  const expires = new Date(Date.now() + 86400000).toISOString()
  await db.run('INSERT INTO email_tokens (id, email, token, type, expires_at) VALUES (?, ?, ?, ?, ?)', [
    `et-${Date.now()}`, email, token, 'verify', expires,
  ]).catch((err) => {
    console.warn('[auth/register] email_tokens insert:', err.message)
  })
  sendVerificationEmail(email, token).catch(() => {})

  const jwt = signUserToken(user)
  res.status(201).json({ token: jwt, user })
}))

router.post('/login', asyncHandler(async (req, res) => {
  const db = getDb()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '').trim()
  let row = await db.get('SELECT id, email, password_hash, name, email_verified, personal_id FROM users WHERE email = ?', [email])

  const isTestLogin = email === TEST_ACCOUNT_EMAIL && password === TEST_ACCOUNT_PASSWORD
  if (isTestLogin && (!row || !bcrypt.compareSync(password, row.password_hash))) {
    await seedTestAccount(db)
    row = await db.get('SELECT id, email, password_hash, name, email_verified, personal_id FROM users WHERE email = ?', [email])
  }

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  const personalId = row.personal_id || await ensurePersonalId(db, row.id)
  const user = { id: row.id, email: row.email, name: row.name, emailVerified: Boolean(row.email_verified), personalId }
  res.json({ token: signUserToken(user), user })
}))

router.post('/verify-email', asyncHandler(async (req, res) => {
  const db = getDb()
  const { token } = req.body
  const row = await db.get(
    'SELECT * FROM email_tokens WHERE token = ? AND type = ? AND used = 0',
    [token, 'verify']
  )
  if (!row || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' })
  }
  await db.run('UPDATE users SET email_verified = 1 WHERE email = ?', [row.email])
  await db.run('UPDATE email_tokens SET used = 1 WHERE id = ?', [row.id])
  res.json({ ok: true })
}))

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const db = getDb()
  const email = normalizeEmail(req.body.email)
  const user = await db.get('SELECT id FROM users WHERE email = ?', [email])
  if (!user) return res.json({ ok: true })
  const token = createToken()
  await db.run('INSERT INTO email_tokens (id, email, token, type, expires_at) VALUES (?, ?, ?, ?, ?)', [
    `et-${Date.now()}`, email, token, 'reset', new Date(Date.now() + 3600000).toISOString(),
  ])
  sendPasswordResetEmail(email, token).catch(() => {})
  res.json({ ok: true })
}))

router.post('/reset-password', asyncHandler(async (req, res) => {
  const db = getDb()
  const { token, password } = req.body
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password too short' })
  const row = await db.get(
    'SELECT * FROM email_tokens WHERE token = ? AND type = ? AND used = 0',
    [token, 'reset']
  )
  if (!row || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' })
  }
  const hash = bcrypt.hashSync(password, 10)
  await db.run('UPDATE users SET password_hash = ?, password_changed_at = ? WHERE email = ?', [hash, new Date().toISOString(), row.email])
  await db.run('UPDATE email_tokens SET used = 1 WHERE id = ?', [row.id])
  res.json({ ok: true })
}))

export default router
