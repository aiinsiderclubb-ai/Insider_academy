#!/usr/bin/env node
/**
 * Import migration-export.json into Postgres (run on Render or anywhere with DATABASE_URL).
 * Usage: DATABASE_URL=... PGSSL=true node scripts/import-json-to-postgres.js [path]
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import pg from 'pg'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_INPUT = path.join(__dirname, '..', 'data', 'migration-export.json')

const TABLE_ORDER = [
  'analytics', 'courses', 'blog_posts', 'calendar_events', 'users', 'teams', 'team_members',
  'purchases', 'progress', 'registrations', 'purchase_log', 'certificates', 'homework',
  'notifications', 'referrals', 'referral_discounts', 'webhook_events', 'admin_seen',
  'email_tokens', 'payments', 'reviews', 'user_achievements', 'lesson_reminders',
]

const SERIAL_TABLES = ['users', 'teams', 'referrals']

export async function runImport(inputPath = DEFAULT_INPUT) {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL required')
  if (!fs.existsSync(inputPath)) throw new Error(`Missing file: ${inputPath}`)

  const { tables } = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSL === 'true' || /render\.com|sslmode=require/i.test(databaseUrl)
      ? { rejectUnauthorized: false }
      : undefined,
  })

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

    for (const table of TABLE_ORDER) {
      const rows = tables[table] || []
      if (!rows.length) continue
      const cols = Object.keys(rows[0])
      const colList = cols.map((c) => `"${c}"`).join(', ')
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
      for (const row of rows) {
        await client.query(
          `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`,
          cols.map((c) => row[c])
        )
      }
      console.log(`[import] ${table}: ${rows.length}`)
    }

    for (const table of SERIAL_TABLES) {
      await client.query(`
        SELECT setval(pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${table}), 1), true)
      `).catch(() => {})
    }

    await client.query('COMMIT')
    console.log('[import] done')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

const isMain = process.argv[1]?.endsWith('import-json-to-postgres.js')
if (isMain) {
  const input = process.argv[2] || DEFAULT_INPUT
  runImport(input).catch((e) => {
    console.error('[import] failed:', e.message)
    process.exit(1)
  })
}
