import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(__dirname, '..')
const sourceDb = path.join(serverRoot, 'data', 'lms.sqlite')

function setupTestEnv(dbPath) {
  process.env.DATABASE_URL = ''
  process.env.LMS_TEST_DB = dbPath
  process.env.UPLOADS_DIR = path.join(os.tmpdir(), 'lms-test-uploads')
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt'
  process.env.ADMIN_PASSWORD = 'admin123'
  process.env.EDITOR_PASSWORD = 'editor123'
  process.env.MODERATOR_PASSWORD = 'moderator123'
  process.env.CORS_ORIGIN = 'http://localhost:5173'
}

test('SQLite schema creates all required tables', async () => {
  const tmpDb = path.join(os.tmpdir(), `lms-schema-${Date.now()}.sqlite`)
  setupTestEnv(tmpDb)

  const { createSqliteDb } = await import('../db/sqlite.js')
  createSqliteDb()

  const Database = (await import('better-sqlite3')).default
  const raw = new Database(tmpDb)
  const tables = raw.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all().map((r) => r.name)
  raw.close()

  const required = [
    'users', 'purchases', 'progress', 'courses', 'blog_posts', 'calendar_events',
    'registrations', 'purchase_log', 'certificates', 'homework', 'notifications',
    'referrals', 'referral_discounts', 'analytics', 'webhook_events', 'admin_seen',
    'email_tokens', 'payments', 'reviews', 'teams', 'team_members',
    'user_achievements', 'lesson_reminders', 'accelerator_applications',
  ]

  for (const t of required) assert.ok(tables.includes(t), `missing table ${t}`)
  fs.unlinkSync(tmpDb)
})

test('API: health, courses, blog, auth, admin', async (t) => {
  assert.ok(fs.existsSync(sourceDb), 'local lms.sqlite required for API test')
  const tmpDb = path.join(os.tmpdir(), `lms-api-${Date.now()}.sqlite`)
  fs.copyFileSync(sourceDb, tmpDb)
  setupTestEnv(tmpDb)

  const { resetDatabase } = await import('../db/index.js')
  resetDatabase()

  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = app.listen(0)
  const port = server.address().port
  const base = `http://127.0.0.1:${port}`

  t.after(() => new Promise((resolve) => { server.close(resolve); fs.unlinkSync(tmpDb) }))

  const health = await fetch(`${base}/api/health`).then((r) => r.json())
  assert.equal(health.ok, true)
  assert.equal(health.db, 'sqlite')

  const courses = await fetch(`${base}/api/courses`).then((r) => r.json())
  assert.ok(Array.isArray(courses) && courses.length >= 1, 'courses should be non-empty')

  const blogRes = await fetch(`${base}/api/blog`)
  assert.equal(blogRes.status, 200)
  const blog = await blogRes.json()
  assert.ok(Array.isArray(blog))

  const email = `test-${Date.now()}@example.com`
  const reg = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret12', name: 'Test User' }),
  })
  assert.equal(reg.status, 201)
  const regData = await reg.json()
  assert.ok(regData.requiresVerification)
  assert.equal(regData.email, email)
  assert.ok(regData.devCode, 'dev mode should return verification code')

  const verify = await fetch(`${base}/api/auth/verify-email-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: regData.devCode }),
  })
  assert.equal(verify.status, 200)

  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret12' }),
  })
  assert.equal(login.status, 200)

  const adminLogin = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' }),
  })
  assert.equal(adminLogin.status, 200)
  assert.equal((await adminLogin.json()).role, 'admin')
})

test('nowIso returns valid ISO string', async () => {
  const { nowIso } = await import('../db/time.js')
  assert.ok(!Number.isNaN(Date.parse(nowIso())))
})

test('Postgres connection and table count', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL not set')
    return
  }
  const { createPostgresDb } = await import('../db/postgres.js')
  const db = await createPostgresDb(process.env.DATABASE_URL)
  t.after(() => db.raw.end())

  const courses = await db.all('SELECT data FROM courses ORDER BY id')
  assert.ok(Array.isArray(courses))

  const tables = await db.all(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  )
  assert.ok(tables.length >= 20, 'expected at least 20 tables')
})
