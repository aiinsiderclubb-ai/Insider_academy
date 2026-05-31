#!/usr/bin/env node
/** Export SQLite tables to JSON for remote Postgres import. */
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'lms.sqlite')
const OUT = process.env.OUT || path.join(__dirname, '..', 'data', 'migration-export.json')

const TABLE_ORDER = [
  'analytics', 'courses', 'blog_posts', 'calendar_events', 'users', 'teams', 'team_members',
  'purchases', 'progress', 'registrations', 'purchase_log', 'certificates', 'homework',
  'notifications', 'referrals', 'referral_discounts', 'webhook_events', 'admin_seen',
  'email_tokens', 'payments', 'reviews', 'user_achievements', 'lesson_reminders',
]

const sqlite = new Database(SQLITE_PATH, { readonly: true })
const payload = { exportedAt: new Date().toISOString(), tables: {} }

for (const table of TABLE_ORDER) {
  try {
    payload.tables[table] = sqlite.prepare(`SELECT * FROM ${table}`).all()
  } catch {
    payload.tables[table] = []
  }
}

sqlite.close()
fs.writeFileSync(OUT, JSON.stringify(payload))
console.log('[export] wrote', OUT)
for (const [t, rows] of Object.entries(payload.tables)) {
  if (rows.length) console.log(`  ${t}: ${rows.length}`)
}
