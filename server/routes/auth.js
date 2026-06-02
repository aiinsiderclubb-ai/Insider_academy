import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { signUserToken } from '../middleware/auth.js'
import { sendPasswordResetEmail } from '../services/email.js'
import { issueEmailVerificationCode, verifyEmailCode } from '../services/emailVerification.js'
import { config, isEmailEnabled } from '../config.js'
import { createUserNotification } from '../services/notifications.js'
import { nowIso } from '../db/time.js'
import * as sheetsTrack from '../services/sheetsTrack.js'
import { seedTestAccount } from '../seed.js'
import { TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_PASSWORD } from '../../src/data/testAccount.js'
import { ensurePersonalId } from '../services/personalId.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.js'

const router = Router()

const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60_000,
  max: 30,
  keyFn: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
})

router.use(authRateLimit)

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

  let verification = {}
  try {
    verification = await issueEmailVerificationCode(email, name)
  } catch (err) {
    console.warn('[auth/register] verification email:', err.message)
    if (!isEmailEnabled()) {
      return res.status(503).json({
        error: 'Could not send verification email',
        errorRu: 'Не удалось отправить код на почту. Проверьте SMTP на сервере.',
      })
    }
    throw err
  }

  sheetsTrack.trackUserRegistered({ personalId, userId, email, name }).catch(() => {})

  res.status(201).json({
    requiresVerification: true,
    email,
    personalId,
    message: 'Verification code sent to your email',
    messageRu: 'Код подтверждения отправлен на вашу почту',
    expiresAt: verification.expiresAt,
    ...(verification.devCode ? { devCode: verification.devCode } : {}),
  })
}))

router.post('/login', asyncHandler(async (req, res) => {
  const db = getDb()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '').trim()
  let row = await db.get('SELECT id, email, password_hash, name, email_verified, personal_id FROM users WHERE email = ?', [email])

  const allowTestAccount = process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_ACCOUNT === '1'
  const isTestLogin = allowTestAccount
    && email === TEST_ACCOUNT_EMAIL
    && password === TEST_ACCOUNT_PASSWORD
  if (isTestLogin && (!row || !bcrypt.compareSync(password, row.password_hash))) {
    await seedTestAccount(db)
    row = await db.get('SELECT id, email, password_hash, name, email_verified, personal_id FROM users WHERE email = ?', [email])
  }

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({
      error: 'Invalid email or password',
      errorRu: row
        ? 'Неверный пароль. Проверьте раскладку или восстановите пароль.'
        : 'Аккаунт с таким email не найден. Зарегистрируйтесь или проверьте опечатку.',
    })
  }

  if (!isTestLogin && !row.email_verified) {
    return res.status(403).json({
      error: 'Email not verified',
      errorRu: 'Email не подтверждён. Введите 6‑значный код из письма (код отправляется при регистрации) или нажмите «Отправить код повторно».',
      requiresVerification: true,
      email,
    })
  }

  const personalId = row.personal_id || await ensurePersonalId(db, row.id)
  const loginAt = new Date().toISOString()
  await db.run('UPDATE users SET last_login_at = ? WHERE id = ?', [loginAt, row.id]).catch(() => {})
  const user = { id: row.id, email: row.email, name: row.name, emailVerified: Boolean(row.email_verified), personalId }
  sheetsTrack.trackLogin({ email, personalId, userId: row.id }).catch(() => {})
  res.json({ token: signUserToken(user), user, lastLoginAt: loginAt })
}))

router.post('/verify-email', asyncHandler(async (req, res) => {
  const db = getDb()
  const { token } = req.body
  const row = await db.get(
    'SELECT * FROM email_tokens WHERE token = ? AND type = ? AND used = 0',
    [token, 'verify']
  )
  if (!row || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token', errorRu: 'Ссылка недействительна или устарела' })
  }
  await db.run('UPDATE users SET email_verified = 1 WHERE email = ?', [row.email])
  await db.run('UPDATE email_tokens SET used = 1 WHERE id = ?', [row.id])
  const userRow = await db.get(
    'SELECT id, email, name, email_verified, personal_id FROM users WHERE email = ?',
    [row.email]
  )
  const personalId = userRow?.personal_id || await ensurePersonalId(db, userRow.id)
  const user = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    emailVerified: true,
    personalId,
  }
  res.json({ ok: true, token: signUserToken(user), user })
}))

router.post('/verify-email-code', asyncHandler(async (req, res) => {
  const db = getDb()
  const email = normalizeEmail(req.body.email)
  const code = String(req.body.code || '').trim()
  const result = await verifyEmailCode(email, code)
  if (!result.ok) {
    return res.status(400).json({ error: result.error, errorRu: result.errorRu })
  }
  const userRow = await db.get(
    'SELECT id, email, name, email_verified, personal_id FROM users WHERE email = ?',
    [email]
  )
  if (!userRow) return res.status(404).json({ error: 'User not found', errorRu: 'Пользователь не найден' })
  const personalId = userRow.personal_id || await ensurePersonalId(db, userRow.id)
  const user = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    emailVerified: true,
    personalId,
  }
  const { scheduleWelcomeSeries } = await import('../services/emailQueue.js')
  scheduleWelcomeSeries(email, userRow.name).catch(() => {})
  res.json({ ok: true, token: signUserToken(user), user })
}))

router.post('/resend-verification-code', asyncHandler(async (req, res) => {
  const db = getDb()
  const email = normalizeEmail(req.body.email)
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required', errorRu: 'Введите корректный email' })
  }
  const user = await db.get('SELECT id, name, email_verified FROM users WHERE email = ?', [email])
  if (!user) {
    return res.json({ ok: true, message: 'If the account exists, a code was sent.' })
  }
  if (user.email_verified) {
    return res.json({ ok: true, alreadyVerified: true, messageRu: 'Email уже подтверждён' })
  }
  try {
    const verification = await issueEmailVerificationCode(email, user.name)
    res.json({
      ok: true,
      messageRu: 'Новый код отправлен на почту',
      expiresAt: verification.expiresAt,
      ...(verification.devCode ? { devCode: verification.devCode } : {}),
    })
  } catch (err) {
    console.warn('[auth/resend-verification]', err.message)
    return res.status(503).json({
      error: 'Could not send email',
      errorRu: 'Не удалось отправить письмо. Попробуйте позже.',
    })
  }
}))

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const db = getDb()
  const email = normalizeEmail(req.body.email)
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required', errorRu: 'Введите корректный email' })
  }
  const user = await db.get('SELECT id FROM users WHERE email = ?', [email])
  if (!user) return res.json({ ok: true, message: 'If the account exists, reset instructions were sent.' })
  const token = createToken()
  const expiresAt = new Date(Date.now() + 3600000).toISOString()
  await db.run(
    'UPDATE email_tokens SET used = 1 WHERE email = ? AND type = ? AND used = 0',
    [email, 'reset']
  )
  await db.run('INSERT INTO email_tokens (id, email, token, type, expires_at) VALUES (?, ?, ?, ?, ?)', [
    `et-${Date.now()}`, email, token, 'reset', expiresAt,
  ])
  const resetLink = `${config.appUrl.replace(/\/$/, '')}/reset-password?token=${token}`
  const payload = { ok: true, message: 'If the account exists, reset instructions were sent.' }

  if (!isEmailEnabled()) {
    payload.resetLink = resetLink
    payload.emailDelivery = 'disabled'
    return res.json(payload)
  }

  try {
    await sendPasswordResetEmail(email, token)
    payload.emailDelivery = 'sent'
  } catch (err) {
    console.warn('[auth/forgot-password] email failed:', err.message)
    payload.emailDelivery = 'failed'
    payload.resetLink = resetLink
    payload.errorRu = 'Письмо не удалось отправить (SMTP). Скопируйте ссылку ниже или включите SMTP AUTH в Microsoft 365.'
  }

  res.json(payload)
}))

router.post('/reset-password', asyncHandler(async (req, res) => {
  const db = getDb()
  const token = String(req.body.token || '').trim()
  const password = String(req.body.password || '')
  if (!token) {
    return res.status(400).json({ error: 'Token required', errorRu: 'Ссылка для сброса недействительна' })
  }
  if (!password || password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters',
      errorRu: 'Пароль должен быть не менее 6 символов',
    })
  }
  const row = await db.get(
    'SELECT * FROM email_tokens WHERE token = ? AND type = ? AND used = 0',
    [token, 'reset']
  )
  if (!row || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({
      error: 'Invalid or expired token',
      errorRu: 'Ссылка устарела или уже использована. Запросите сброс пароля снова.',
    })
  }
  const now = nowIso()
  const hash = bcrypt.hashSync(password, 10)
  await db.run('UPDATE users SET password_hash = ?, password_changed_at = ? WHERE email = ?', [hash, now, row.email])
  // Password reset token proves email ownership; mark as verified.
  await db.run('UPDATE users SET email_verified = 1 WHERE email = ?', [row.email]).catch(() => {})
  await db.run('UPDATE email_tokens SET used = 1 WHERE id = ?', [row.id])
  await createUserNotification(db, {
    email: row.email,
    type: 'password_changed',
    targetPath: '/account',
    message: 'Пароль успешно сброшен. Если это были не вы — срочно смените пароль и напишите в поддержку.',
  })
  const u = await db.get('SELECT personal_id FROM users WHERE email = ?', [row.email])
  sheetsTrack.trackPasswordChange({ email: row.email, personalId: u?.personal_id, action: 'сброс пароля' }).catch(() => {})
  res.json({ ok: true, passwordChangedAt: now })
}))

export default router
