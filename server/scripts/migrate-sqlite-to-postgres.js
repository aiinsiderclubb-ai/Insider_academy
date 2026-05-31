#!/usr/bin/env node
/**
 * Sync local SQLite (server/data/lms.sqlite) → Render Postgres.
 * Usage: DATABASE_URL=postgresql://... PGSSL=true node scripts/migrate-sqlite-to-postgres.js
 */
import 'dotenv/config'
import Database from 'better-sqlite3'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'lms.sqlite')

const TABLE_ORDER = [
  'analytics',
  'courses',
  'blog_posts',
  'calendar_events',
  'users',
  'teams',
  'team_members',
  'purchases',
  'progress',
  'registrations',
  'purchase_log',
  'certificates',
  'homework',
  'notifications',
  'referrals',
  'referral_discounts',
  'webhook_events',
  'admin_seen',
  'email_tokens',
  'payments',
  'reviews',
  'user_achievements',
  'lesson_reminders',
]

const SERIAL_TABLES = ['users', 'teams', 'referrals']

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Set DATABASE_URL to the target Postgres connection string.')
    process.exit(1)
  }

  const sqlite = new Database(SQLITE_PATH, { readonly: true })
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSL === 'true' || /render\.com|sslmode=require/i.test(databaseUrl)
      ? { rejectUnauthorized: false }
      : undefined,
  })

  console.log('[migrate] source:', SQLITE_PATH)
  console.log('[migrate] target: Postgres')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`
      TRUNCATE TABLE
        lesson_reminders, user_achievements, reviews, payments, email_tokens,
        admin_seen, webhook_events, notifications, homework, certificates,
        purchase_log, registrations, referral_discounts, referrals, progress,
        purchases, team_members, teams, users,
        calendar_events, blog_posts, courses, analytics
      RESTART IDENTITY CASCADE
    `)

    const summary = {}

    for (const table of TABLE_ORDER) {
      const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
      if (!cols.length) {
        console.log(`[migrate] skip ${table} (not in sqlite)`)
        continue
      }

      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all()
      if (!rows.length) {
        summary[table] = 0
        continue
      }

      const colList = cols.map((c) => `"${c}"`).join(', ')
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')

      for (const row of rows) {
        const values = cols.map((c) => row[c])
        await client.query(`INSERT INTO ${table} (${colList}) VALUES (${placeholders})`, values)
      }

      summary[table] = rows.length
      console.log(`[migrate] ${table}: ${rows.length} rows`)
    }

    for (const table of SERIAL_TABLES) {
      await client.query(`
        SELECT setval(pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${table}), 1), true)
      `).catch(() => {})
    }

    await client.query('COMMIT')
    console.log('[migrate] done:', JSON.stringify(summary))
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
    sqlite.close()
  }
}

main().catch((err) => {
  console.error('[migrate] failed:', err.message)
  process.exit(1)
})
