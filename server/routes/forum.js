import { Router } from 'express'
import { getDb } from '../db.js'
import { nowIso } from '../db/time.js'
import { requireAdmin, requireUser } from '../middleware/auth.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { logAudit } from '../services/auditLog.js'
import {
  FORUM_CATEGORIES,
  LIMITS,
  isCommunityMember,
  isForumCategory,
  makeSlug,
  mapPost,
  mapTopic,
  newId,
} from '../services/forum.js'

/* ================================= members ================================= */

const router = Router()

const TOPIC_SELECT = `
  SELECT t.*, u.name AS author_name
  FROM forum_topics t
  JOIN users u ON u.id = t.user_id`

const POST_SELECT = `
  SELECT p.*, u.name AS author_name
  FROM forum_posts p
  JOIN users u ON u.id = p.user_id`

/** NUL bytes break Postgres TEXT and have no business in a forum post. */
function clean(value) {
  return String(value ?? '').replace(/\u0000/g, '').trim()
}

/**
 * The forum is the buyers' room. A signed-in visitor who has not bought
 * anything gets a distinct code, so the client can offer the catalogue
 * instead of a login form they have already filled in.
 */
const requireMember = asyncHandler(async (req, res, next) => {
  if (await isCommunityMember(getDb(), req.userId)) return next()
  return res.status(403).json({
    error: 'The community is open to Academy students',
    errorRu: 'Сообщество доступно студентам Academy',
    code: 'not_member',
  })
})

/*
 * Limits are keyed by account, not by address. The web front end calls this
 * API from its own server, so every visitor arrives from the same few IPs —
 * an IP-keyed limit here would let one busy thread silence the whole forum.
 */
const topicLimit = rateLimitMiddleware({
  windowMs: 10 * 60_000,
  max: 5,
  keyFn: (req) => `forum-topic:${req.userId}`,
})
const replyLimit = rateLimitMiddleware({
  windowMs: 10 * 60_000,
  max: 30,
  keyFn: (req) => `forum-reply:${req.userId}`,
})

async function findTopic(db, id) {
  return db.get(`${TOPIC_SELECT} WHERE t.id = ?`, [id])
}

router.get('/categories', (_req, res) => {
  res.json({ categories: FORUM_CATEGORIES })
})

/** Lets the client tell "sign in" apart from "buy something first". */
router.get('/access', requireUser, asyncHandler(async (req, res) => {
  res.json({ member: await isCommunityMember(getDb(), req.userId) })
}))

router.get('/topics', requireUser, requireMember, asyncHandler(async (req, res) => {
  const db = getDb()
  const category = clean(req.query.category)
  const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0)

  const where = ['t.is_hidden = 0']
  const params = []
  if (category && category !== 'all') {
    if (!isForumCategory(category)) return res.status(400).json({ error: 'Unknown category' })
    where.push('t.category = ?')
    params.push(category)
  }
  const clause = where.join(' AND ')

  const rows = await db.all(
    `${TOPIC_SELECT} WHERE ${clause}
     ORDER BY t.is_pinned DESC, t.last_activity_at DESC
     LIMIT ? OFFSET ?`,
    [...params, LIMITS.pageSize, offset]
  )
  const count = await db.get(`SELECT COUNT(*) AS n FROM forum_topics t WHERE ${clause}`, params)

  res.json({ topics: rows.map(mapTopic), total: Number(count?.n || 0) })
}))

router.get('/topics/:slug', requireUser, requireMember, asyncHandler(async (req, res) => {
  const db = getDb()
  const topic = await db.get(`${TOPIC_SELECT} WHERE t.slug = ? AND t.is_hidden = 0`, [req.params.slug])
  if (!topic) return res.status(404).json({ error: 'Topic not found' })

  // The asker is not an audience: their own reloads after answering or
  // marking a solution would otherwise inflate the count they are watching.
  if (Number(topic.user_id) !== Number(req.userId)) {
    await db.run('UPDATE forum_topics SET views = views + 1 WHERE id = ?', [topic.id])
    topic.views = Number(topic.views || 0) + 1
  }

  const posts = await db.all(
    `${POST_SELECT} WHERE p.topic_id = ? AND p.is_hidden = 0 ORDER BY p.created_at ASC`,
    [topic.id]
  )

  res.json({
    topic: mapTopic(topic),
    posts: posts.map((row) => mapPost(row, topic.solved_post_id)),
  })
}))

router.post('/topics', requireUser, requireMember, topicLimit, asyncHandler(async (req, res) => {
  const db = getDb()
  const title = clean(req.body?.title)
  const body = clean(req.body?.body)
  const category = clean(req.body?.category) || 'general'
  const courseId = clean(req.body?.courseId) || null

  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax) {
    return res.status(400).json({
      error: `Title must be ${LIMITS.titleMin}–${LIMITS.titleMax} characters`,
      errorRu: `Заголовок — от ${LIMITS.titleMin} до ${LIMITS.titleMax} символов`,
    })
  }
  if (body.length < LIMITS.bodyMin || body.length > LIMITS.bodyMax) {
    return res.status(400).json({
      error: `Question must be ${LIMITS.bodyMin}–${LIMITS.bodyMax} characters`,
      errorRu: `Текст вопроса — от ${LIMITS.bodyMin} до ${LIMITS.bodyMax} символов`,
    })
  }
  if (!isForumCategory(category)) {
    return res.status(400).json({ error: 'Unknown category', errorRu: 'Такого раздела нет' })
  }

  const id = newId()
  const now = nowIso()
  await db.run(
    `INSERT INTO forum_topics
       (id, slug, user_id, category, course_id, title, body, last_activity_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, makeSlug(title), req.userId, category, courseId, title, body, now, now, now]
  )

  res.status(201).json({ topic: mapTopic(await findTopic(db, id)) })
}))

router.post('/topics/:id/posts', requireUser, requireMember, replyLimit, asyncHandler(async (req, res) => {
  const db = getDb()
  const topic = await db.get('SELECT id, is_locked, is_hidden FROM forum_topics WHERE id = ?', [req.params.id])
  if (!topic || Number(topic.is_hidden)) return res.status(404).json({ error: 'Topic not found' })
  if (Number(topic.is_locked)) {
    return res.status(409).json({ error: 'Topic is locked', errorRu: 'Тема закрыта для ответов' })
  }

  const body = clean(req.body?.body)
  if (body.length < LIMITS.replyMin || body.length > LIMITS.replyMax) {
    return res.status(400).json({
      error: `Reply must be ${LIMITS.replyMin}–${LIMITS.replyMax} characters`,
      errorRu: `Ответ — от ${LIMITS.replyMin} до ${LIMITS.replyMax} символов`,
    })
  }

  const id = newId()
  const now = nowIso()
  await db.run(
    'INSERT INTO forum_posts (id, topic_id, user_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, topic.id, req.userId, body, now, now]
  )
  await db.run(
    `UPDATE forum_topics
     SET reply_count = reply_count + 1, last_activity_at = ?, updated_at = ?
     WHERE id = ?`,
    [now, now, topic.id]
  )

  const post = await db.get(`${POST_SELECT} WHERE p.id = ?`, [id])
  res.status(201).json({ post: mapPost(post) })
}))

/**
 * Only the person who asked decides which answer solved it. `postId: null`
 * takes the mark back off, for the day a better answer arrives.
 */
router.post('/topics/:id/solution', requireUser, requireMember, asyncHandler(async (req, res) => {
  const db = getDb()
  const topic = await db.get('SELECT id, user_id, is_hidden FROM forum_topics WHERE id = ?', [req.params.id])
  if (!topic || Number(topic.is_hidden)) return res.status(404).json({ error: 'Topic not found' })
  if (Number(topic.user_id) !== Number(req.userId)) {
    return res.status(403).json({
      error: 'Only the author can mark a solution',
      errorRu: 'Отметить решение может только автор вопроса',
    })
  }

  const postId = req.body?.postId == null ? null : clean(req.body.postId)
  if (postId) {
    const post = await db.get(
      'SELECT id FROM forum_posts WHERE id = ? AND topic_id = ? AND is_hidden = 0',
      [postId, topic.id]
    )
    if (!post) return res.status(400).json({ error: 'Answer not found in this topic' })
  }

  await db.run('UPDATE forum_topics SET solved_post_id = ?, updated_at = ? WHERE id = ?', [
    postId,
    nowIso(),
    topic.id,
  ])
  res.json({ topic: mapTopic(await findTopic(db, topic.id)) })
}))

export default router

/* ================================ moderation ================================ */

/*
 * Mounted under /api/admin/forum rather than /api/forum: the web proxy sends
 * the admin bearer only to /admin/* paths, and moderation must never be
 * reachable with a learner's token.
 */
export const forumAdminRouter = Router()
const moderator = requireAdmin('admin', 'moderator')

/** Recount instead of increment, so hiding and unhiding can never drift. */
async function recountReplies(db, topicId) {
  await db.run(
    `UPDATE forum_topics
     SET reply_count = (SELECT COUNT(*) FROM forum_posts WHERE topic_id = ? AND is_hidden = 0)
     WHERE id = ?`,
    [topicId, topicId]
  )
}

forumAdminRouter.patch('/topics/:id', moderator, asyncHandler(async (req, res) => {
  const db = getDb()
  const topic = await db.get('SELECT id FROM forum_topics WHERE id = ?', [req.params.id])
  if (!topic) return res.status(404).json({ error: 'Topic not found' })

  const changes = {}
  for (const [field, column] of [['isPinned', 'is_pinned'], ['isLocked', 'is_locked'], ['isHidden', 'is_hidden']]) {
    if (typeof req.body?.[field] === 'boolean') changes[column] = req.body[field] ? 1 : 0
  }
  const columns = Object.keys(changes)
  if (!columns.length) return res.status(400).json({ error: 'Nothing to change' })

  await db.run(
    `UPDATE forum_topics SET ${columns.map((column) => `${column} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
    [...columns.map((column) => changes[column]), nowIso(), topic.id]
  )
  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'forum.topic.moderate',
    targetType: 'forum_topic',
    targetId: topic.id,
    meta: req.body,
  })

  res.json({ topic: mapTopic(await findTopic(db, topic.id)) })
}))

forumAdminRouter.patch('/posts/:id', moderator, asyncHandler(async (req, res) => {
  const db = getDb()
  if (typeof req.body?.isHidden !== 'boolean') return res.status(400).json({ error: 'isHidden is required' })

  const post = await db.get('SELECT id, topic_id FROM forum_posts WHERE id = ?', [req.params.id])
  if (!post) return res.status(404).json({ error: 'Post not found' })

  await db.run('UPDATE forum_posts SET is_hidden = ?, updated_at = ? WHERE id = ?', [
    req.body.isHidden ? 1 : 0,
    nowIso(),
    post.id,
  ])
  if (req.body.isHidden) {
    // A hidden answer cannot stay the accepted one.
    await db.run('UPDATE forum_topics SET solved_post_id = NULL WHERE id = ? AND solved_post_id = ?', [
      post.topic_id,
      post.id,
    ])
  }
  await recountReplies(db, post.topic_id)
  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: req.body.isHidden ? 'forum.post.hide' : 'forum.post.unhide',
    targetType: 'forum_post',
    targetId: post.id,
    meta: { topicId: post.topic_id },
  })

  res.json({ ok: true })
}))
