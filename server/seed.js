import { getDb, parseJson } from './db.js'
import bcrypt from 'bcryptjs'
import { courses as defaultCourses } from '../src/data/courses.js'
import { blogPosts as defaultBlog } from '../src/data/blog.js'
import {
  TEST_ACCOUNT_EMAIL,
  TEST_ACCOUNT_PASSWORD,
  TEST_ACCOUNT_NAME,
  TEST_ACCOUNT_PURCHASE_IDS,
} from '../src/data/testAccount.js'
import { ensurePersonalId } from './services/personalId.js'

/** Keep in sync with src/data/catalogVersion.js */
const CATALOG_VERSION = 18

async function getCatalogVersion(db) {
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', ['catalog_version'])
  return Number(parseJson(row?.value, 0) || 0)
}

async function setCatalogVersion(db, version) {
  await db.run(
    `INSERT INTO analytics (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ['catalog_version', JSON.stringify(version)]
  )
}

export async function seedCourses(db = getDb()) {
  const storedVersion = await getCatalogVersion(db)
  const countRow = await db.get('SELECT COUNT(*) AS n FROM courses')
  const count = Number(countRow?.n || 0)

  if (count > 0 && storedVersion >= CATALOG_VERSION) {
    return false
  }

  await db.run('DELETE FROM courses')
  for (const c of defaultCourses) {
    await db.run('INSERT INTO courses (id, data) VALUES (?, ?)', [c.id, JSON.stringify(c)])
  }
  await setCatalogVersion(db, CATALOG_VERSION)
  console.log(`[seed] ${defaultCourses.length} courses loaded (catalog v${CATALOG_VERSION})`)
  return true
}

export async function seedIfEmpty() {
  const db = getDb()
  await seedCourses(db)

  const blogRow = await db.get('SELECT COUNT(*) AS n FROM blog_posts')
  if (Number(blogRow?.n || 0) === 0 && defaultBlog?.length) {
    for (const p of defaultBlog) {
      await db.run('INSERT INTO blog_posts (id, data) VALUES (?, ?)', [p.id, JSON.stringify(p)])
    }
    console.log(`[seed] ${defaultBlog.length} blog posts loaded`)
  }

  const analytics = await db.get('SELECT value FROM analytics WHERE key = ?', ['main'])
  if (!analytics) {
    await db.run('INSERT INTO analytics (key, value) VALUES (?, ?)', [
      'main',
      JSON.stringify({ visits: 0, courseClicks: {} }),
    ])
  }

  await seedTestAccount(db)
}

export async function seedTestAccount(db = getDb()) {
  const email = TEST_ACCOUNT_EMAIL
  const hash = bcrypt.hashSync(TEST_ACCOUNT_PASSWORD, 10)
  let row = await db.get('SELECT id FROM users WHERE email = ?', [email])
  if (!row) {
    try {
      const inserted = await db.get(
        'INSERT INTO users (email, password_hash, name, email_verified) VALUES (?, ?, ?, 1) RETURNING id',
        [email, hash, TEST_ACCOUNT_NAME]
      )
      row = { id: inserted.id }
    } catch {
      await db.run(
        'INSERT INTO users (email, password_hash, name, email_verified) VALUES (?, ?, ?, 1)',
        [email, hash, TEST_ACCOUNT_NAME]
      )
      row = await db.get('SELECT id FROM users WHERE email = ?', [email])
    }
    console.log(`[seed] test account created: ${email}`)
  } else {
    await db.run(
      'UPDATE users SET password_hash = ?, name = ?, email_verified = 1 WHERE id = ?',
      [hash, TEST_ACCOUNT_NAME, row.id]
    )
  }

  if (!row?.id) return

  const personalId = await ensurePersonalId(db, row.id)
  const regExists = await db.get('SELECT id FROM registrations WHERE email = ?', [email])
  if (!regExists) {
    await db.run(
      'INSERT INTO registrations (id, email, name, personal_id, date) VALUES (?, ?, ?, ?, ?)',
      [`reg-test-${row.id}`, email, TEST_ACCOUNT_NAME, personalId, new Date().toISOString()]
    )
  } else {
    await db.run('UPDATE registrations SET name = ?, personal_id = ? WHERE email = ?', [TEST_ACCOUNT_NAME, personalId, email]).catch(() => {})
  }

  for (const courseId of TEST_ACCOUNT_PURCHASE_IDS) {
    const exists = await db.get(
      'SELECT id FROM purchases WHERE user_id = ? AND course_id = ?',
      [row.id, courseId]
    )
    if (!exists) {
      await db.run('INSERT INTO purchases (user_id, course_id) VALUES (?, ?)', [row.id, courseId])
    }
  }
}
