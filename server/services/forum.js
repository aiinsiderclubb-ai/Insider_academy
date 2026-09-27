import crypto from 'crypto'
import { nowIso } from '../db/time.js'

/**
 * Sections of the community forum. Fixed in code rather than in the database:
 * a new section is a product decision, and it ships with the copy that
 * explains it. `general` comes first because the new-topic form defaults to
 * the first entry.
 */
export const FORUM_CATEGORIES = [
  { id: 'general', ru: 'Общее', en: 'General' },
  { id: 'courses', ru: 'Вопросы по курсам', en: 'Course questions' },
  { id: 'automation', ru: 'Автоматизация и n8n', en: 'Automation & n8n' },
  { id: 'agents', ru: 'AI-агенты', en: 'AI agents' },
  { id: 'prompts', ru: 'Промпты и инструменты', en: 'Prompts & tools' },
  { id: 'showcase', ru: 'Мои проекты', en: 'Show your work' },
  { id: 'clients', ru: 'Клиенты и заработок', en: 'Clients & income' },
]

const CATEGORY_IDS = new Set(FORUM_CATEGORIES.map((category) => category.id))

export function isForumCategory(id) {
  return CATEGORY_IDS.has(id)
}

export const LIMITS = {
  titleMin: 5,
  titleMax: 160,
  bodyMin: 10,
  bodyMax: 10_000,
  replyMin: 2,
  replyMax: 10_000,
  pageSize: 30,
}

/**
 * The forum is for people who have bought something — a course, a bundle, a
 * store product, a subscription. Every purchase path the platform records
 * lands in one of these three tables, so any active row is enough.
 *
 * Each source is asked separately and a failing query only removes that
 * source: `asset_entitlements` belongs to the marketplace schema, and an
 * install without it must not lock every course buyer out of the forum.
 */
export async function isCommunityMember(db, userId) {
  if (!userId) return false
  const now = nowIso()
  const sources = [
    ['SELECT 1 AS ok FROM purchases WHERE user_id = ? LIMIT 1', [userId]],
    [
      `SELECT 1 AS ok FROM entitlements
       WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > ?) LIMIT 1`,
      [userId, now],
    ],
    [
      `SELECT 1 AS ok FROM asset_entitlements
       WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > ?) LIMIT 1`,
      [userId, now],
    ],
  ]
  for (const [sql, params] of sources) {
    try {
      if (await db.get(sql, params)) return true
    } catch (err) {
      console.warn('[forum] membership source unavailable:', err.message)
    }
  }
  return false
}

/**
 * A readable, unique slug. The title part is for people reading the URL; the
 * suffix is what makes it unique, so two questions with the same title never
 * collide and never need a retry loop.
 */
export function makeSlug(title) {
  const base = String(title || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^a-z0-9а-яёіїєґ]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  const suffix = crypto.randomBytes(4).toString('hex').slice(0, 6)
  return base ? `${base}-${suffix}` : suffix
}

export function newId() {
  return crypto.randomUUID()
}

/**
 * Only the name leaves the server. The forum is visible to every buyer, and
 * an email address in a public thread is a spam list waiting to be scraped.
 */
function author(row) {
  return {
    id: Number(row.user_id),
    name: String(row.author_name || '').trim() || 'Участник',
    role: null,
  }
}

export function mapTopic(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    category: row.category,
    courseId: row.course_id || null,
    isPinned: Boolean(Number(row.is_pinned)),
    isLocked: Boolean(Number(row.is_locked)),
    solvedPostId: row.solved_post_id || null,
    views: Number(row.views || 0),
    replyCount: Number(row.reply_count || 0),
    // Reactions are not built yet. The field stays so the client contract is
    // stable; the client hides the counter while it is always zero.
    reactions: 0,
    author: author(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapPost(row, solvedPostId = null) {
  return {
    id: row.id,
    topicId: row.topic_id,
    body: row.body,
    author: author(row),
    reactions: 0,
    isSolution: Boolean(solvedPostId) && row.id === solvedPostId,
    createdAt: row.created_at,
  }
}
