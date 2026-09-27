import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

function setupTestEnv(dbPath) {
  process.env.DATABASE_URL = ''
  process.env.LMS_TEST_DB = dbPath
  process.env.UPLOADS_DIR = path.join(os.tmpdir(), 'lms-test-uploads')
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt'
  process.env.ADMIN_PASSWORD = 'AdminTest-2026-Only!'
  process.env.EDITOR_PASSWORD = 'EditorTest-2026-Only!'
  process.env.MODERATOR_PASSWORD = 'ModeratorTest-2026!'
  process.env.CORS_ORIGIN = 'http://localhost:5173'
  process.env.PRELAUNCH_MODE = '1'
}

const json = { 'Content-Type': 'application/json' }

async function signUp(base, email, name) {
  const reg = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ email, password: 'SecretTest12', name }),
  }).then((r) => r.json())
  await fetch(`${base}/api/auth/verify-email-code`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ email, code: reg.devCode }),
  })
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ email, password: 'SecretTest12' }),
  }).then((r) => r.json())
  assert.ok(login.token, `login failed for ${email}`)
  return { ...json, Authorization: `Bearer ${login.token}` }
}

test('SQLite schema creates the forum tables', async () => {
  const tmpDb = path.join(os.tmpdir(), `lms-forum-schema-${Date.now()}.sqlite`)
  setupTestEnv(tmpDb)
  const { createSqliteDb } = await import('../db/sqlite.js')
  createSqliteDb()

  const Database = (await import('better-sqlite3')).default
  const raw = new Database(tmpDb)
  const tables = raw.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name)
  raw.close()

  assert.ok(tables.includes('forum_topics'))
  assert.ok(tables.includes('forum_posts'))
  fs.unlinkSync(tmpDb)
})

test('forum: buyers only, questions, answers, solutions, moderation', async (t) => {
  const tmpDb = path.join(os.tmpdir(), `lms-forum-${Date.now()}.sqlite`)
  setupTestEnv(tmpDb)

  const { resetDatabase, getDb } = await import('../db/index.js')
  resetDatabase()
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
    instance.once('error', reject)
  })
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(() => new Promise((resolve) => { server.close(resolve); fs.unlinkSync(tmpDb) }))

  const stamp = Date.now()
  const askerEmail = `asker-${stamp}@example.com`
  const helperEmail = `helper-${stamp}@example.com`
  const outsiderEmail = `outsider-${stamp}@example.com`
  const asker = await signUp(base, askerEmail, 'Asker')
  const helper = await signUp(base, helperEmail, 'Helper')
  const outsider = await signUp(base, outsiderEmail, 'Outsider')

  const grant = async (email) => {
    const user = await getDb().get('SELECT id FROM users WHERE email = ?', [email])
    await getDb().run('INSERT INTO purchases (user_id, course_id) VALUES (?, ?)', [user.id, 'ai-start'])
  }

  // ---- sections are public: they describe the room, not its contents ----
  const categories = await fetch(`${base}/api/forum/categories`).then((r) => r.json())
  assert.equal(categories.categories[0].id, 'general')

  // ---- the room itself is not ----
  assert.equal((await fetch(`${base}/api/forum/topics`)).status, 401, 'guests are refused')

  const outsiderAccess = await fetch(`${base}/api/forum/access`, { headers: outsider }).then((r) => r.json())
  assert.equal(outsiderAccess.member, false)

  const refused = await fetch(`${base}/api/forum/topics`, { headers: outsider })
  assert.equal(refused.status, 403)
  assert.equal((await refused.json()).code, 'not_member', 'a signed-in non-buyer gets a distinct code')

  const refusedPost = await fetch(`${base}/api/forum/topics`, {
    method: 'POST',
    headers: outsider,
    body: JSON.stringify({ title: 'Can I get in?', body: 'Asking without a purchase.' }),
  })
  assert.equal(refusedPost.status, 403, 'non-buyers cannot write either')

  // ---- one purchase of anything opens it ----
  await grant(askerEmail)
  await grant(helperEmail)
  const askerAccess = await fetch(`${base}/api/forum/access`, { headers: asker }).then((r) => r.json())
  assert.equal(askerAccess.member, true)

  // ---- asking ----
  const tooShort = await fetch(`${base}/api/forum/topics`, {
    method: 'POST',
    headers: asker,
    body: JSON.stringify({ title: 'Hi', body: 'Too short a title.' }),
  })
  assert.equal(tooShort.status, 400)

  const badSection = await fetch(`${base}/api/forum/topics`, {
    method: 'POST',
    headers: asker,
    body: JSON.stringify({ title: 'Where does this go?', body: 'Into a section that does not exist.', category: 'nope' }),
  })
  assert.equal(badSection.status, 400)

  const created = await fetch(`${base}/api/forum/topics`, {
    method: 'POST',
    headers: asker,
    body: JSON.stringify({
      title: 'Как подключить n8n к Telegram?',
      body: 'Webhook не срабатывает после деплоя.',
      category: 'automation',
    }),
  })
  assert.equal(created.status, 201)
  const { topic } = await created.json()
  assert.ok(topic.slug.length > 6)
  assert.equal(topic.category, 'automation')
  assert.equal(topic.author.name, 'Asker')
  assert.equal(topic.replyCount, 0)

  // ---- reading ----
  const ownView = await fetch(`${base}/api/forum/topics/${encodeURIComponent(topic.slug)}`, { headers: asker })
    .then((r) => r.json())
  assert.equal(ownView.topic.views, 0, "the asker's own visits are not counted")

  const list = await fetch(`${base}/api/forum/topics`, { headers: helper }).then((r) => r.json())
  assert.equal(list.total, 1)
  assert.equal(list.topics[0].id, topic.id)

  const filtered = await fetch(`${base}/api/forum/topics?category=agents`, { headers: helper }).then((r) => r.json())
  assert.equal(filtered.total, 0, 'the section filter applies')
  assert.equal((await fetch(`${base}/api/forum/topics?category=nope`, { headers: helper })).status, 400)

  const firstView = await fetch(`${base}/api/forum/topics/${encodeURIComponent(topic.slug)}`, { headers: helper })
    .then((r) => r.json())
  assert.equal(firstView.topic.views, 1)
  const secondView = await fetch(`${base}/api/forum/topics/${encodeURIComponent(topic.slug)}`, { headers: helper })
    .then((r) => r.json())
  assert.equal(secondView.topic.views, 2)

  // ---- answering ----
  const reply = await fetch(`${base}/api/forum/topics/${topic.id}/posts`, {
    method: 'POST',
    headers: helper,
    body: JSON.stringify({ body: 'Проверьте, что URL вебхука — https и доступен снаружи.' }),
  })
  assert.equal(reply.status, 201)
  const { post } = await reply.json()
  assert.equal(post.author.name, 'Helper')

  const afterReply = await fetch(`${base}/api/forum/topics/${encodeURIComponent(topic.slug)}`, { headers: asker })
    .then((r) => r.json())
  assert.equal(afterReply.topic.replyCount, 1)
  assert.equal(afterReply.posts.length, 1)

  // ---- nothing personal leaks into a thread every buyer can read ----
  const everything = JSON.stringify([list, afterReply])
  assert.ok(!everything.includes(askerEmail) && !everything.includes(helperEmail), 'no email in forum payloads')

  // ---- solutions belong to the asker ----
  const notYours = await fetch(`${base}/api/forum/topics/${topic.id}/solution`, {
    method: 'POST',
    headers: helper,
    body: JSON.stringify({ postId: post.id }),
  })
  assert.equal(notYours.status, 403, 'only the asker marks the solution')

  const foreign = await fetch(`${base}/api/forum/topics/${topic.id}/solution`, {
    method: 'POST',
    headers: asker,
    body: JSON.stringify({ postId: 'not-a-post' }),
  })
  assert.equal(foreign.status, 400)

  const solved = await fetch(`${base}/api/forum/topics/${topic.id}/solution`, {
    method: 'POST',
    headers: asker,
    body: JSON.stringify({ postId: post.id }),
  }).then((r) => r.json())
  assert.equal(solved.topic.solvedPostId, post.id)

  const withSolution = await fetch(`${base}/api/forum/topics/${encodeURIComponent(topic.slug)}`, { headers: asker })
    .then((r) => r.json())
  assert.equal(withSolution.posts[0].isSolution, true)

  const unsolved = await fetch(`${base}/api/forum/topics/${topic.id}/solution`, {
    method: 'POST',
    headers: asker,
    body: JSON.stringify({ postId: null }),
  }).then((r) => r.json())
  assert.equal(unsolved.topic.solvedPostId, null, 'the mark can be taken back')

  // ---- moderation ----
  const moderatorLogin = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ password: 'ModeratorTest-2026!' }),
  }).then((r) => r.json())
  const moderator = { ...json, Authorization: `Bearer ${moderatorLogin.token}` }

  const learnerAsModerator = await fetch(`${base}/api/admin/forum/topics/${topic.id}`, {
    method: 'PATCH',
    headers: asker,
    body: JSON.stringify({ isLocked: true }),
  })
  assert.equal(learnerAsModerator.status, 401, 'a learner token cannot moderate')

  const locked = await fetch(`${base}/api/admin/forum/topics/${topic.id}`, {
    method: 'PATCH',
    headers: moderator,
    body: JSON.stringify({ isLocked: true }),
  }).then((r) => r.json())
  assert.equal(locked.topic.isLocked, true)

  const lockedReply = await fetch(`${base}/api/forum/topics/${topic.id}/posts`, {
    method: 'POST',
    headers: helper,
    body: JSON.stringify({ body: 'One more thing…' }),
  })
  assert.equal(lockedReply.status, 409, 'a locked topic takes no answers')

  // Hiding the accepted answer drops the mark and the count with it.
  await fetch(`${base}/api/forum/topics/${topic.id}/solution`, {
    method: 'POST',
    headers: asker,
    body: JSON.stringify({ postId: post.id }),
  })
  const hidden = await fetch(`${base}/api/admin/forum/posts/${post.id}`, {
    method: 'PATCH',
    headers: moderator,
    body: JSON.stringify({ isHidden: true }),
  })
  assert.equal(hidden.status, 200)
  const afterHide = await fetch(`${base}/api/forum/topics/${encodeURIComponent(topic.slug)}`, { headers: asker })
    .then((r) => r.json())
  assert.equal(afterHide.posts.length, 0)
  assert.equal(afterHide.topic.replyCount, 0)
  assert.equal(afterHide.topic.solvedPostId, null)

  await fetch(`${base}/api/admin/forum/topics/${topic.id}`, {
    method: 'PATCH',
    headers: moderator,
    body: JSON.stringify({ isHidden: true }),
  })
  assert.equal(
    (await fetch(`${base}/api/forum/topics/${encodeURIComponent(topic.slug)}`, { headers: asker })).status,
    404,
    'a hidden topic is gone for members'
  )
  const emptied = await fetch(`${base}/api/forum/topics`, { headers: asker }).then((r) => r.json())
  assert.equal(emptied.total, 0)

  const audit = await getDb().all("SELECT action FROM audit_log WHERE action LIKE 'forum.%'")
  assert.ok(audit.length >= 3, 'every moderation step is audited')
})
