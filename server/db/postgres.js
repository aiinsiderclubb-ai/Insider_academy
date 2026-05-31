import pg from 'pg'
import { SCHEMA } from './sqlite.js'

const { Pool } = pg

function normalizeForPostgres(sql) {
  let s = sql.replace(/datetime\s*\(\s*'now'\s*\)/gi, 'NOW()')
  if (/INSERT OR IGNORE INTO user_achievements/i.test(s)) {
    s = s.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO')
    if (!/ON CONFLICT/i.test(s)) s += ' ON CONFLICT (user_id, achievement_id) DO NOTHING'
  }
  if (/INSERT OR IGNORE INTO team_members/i.test(s)) {
    s = s.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO')
    if (!/ON CONFLICT/i.test(s)) s += ' ON CONFLICT (team_id, user_id) DO NOTHING'
  }
  return s
}

function toPgSql(sql) {
  const normalized = normalizeForPostgres(sql)
  let i = 0
  return normalized.replace(/\?/g, () => `$${++i}`)
}

function pgSchema() {
  return SCHEMA
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
    .replace(/AUTOINCREMENT/g, '')
    .replace(/COLLATE NOCASE/g, '')
    .replace(/datetime\('now'\)/g, 'NOW()')
    .replace(/INTEGER DEFAULT 0/g, 'INTEGER DEFAULT 0')
}

export async function createPostgresDb(connectionString) {
  const useSsl =
    process.env.PGSSL === 'true' ||
    /render\.com|sslmode=require/i.test(connectionString)
  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  })
  await pool.query(pgSchema())
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT').catch(() => {})
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_updated_at TEXT').catch(() => {})
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TEXT').catch(() => {})
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_id TEXT').catch(() => {})
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_personal_id_idx ON users (personal_id) WHERE personal_id IS NOT NULL').catch(() => {})
  await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS personal_id TEXT').catch(() => {})
  await pool.query(`
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  email TEXT NOT NULL,
  name TEXT,
  message TEXT NOT NULL,
  reply TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  date TEXT NOT NULL
)`).catch(() => {})
  return {
    driver: 'postgres',
    raw: pool,
    async query(sql, params = []) {
      const pgSql = toPgSql(sql)
      const res = await pool.query(pgSql, params)
      if (/^\s*SELECT/i.test(sql)) {
        if (res.rows.length === 1 && (/LIMIT 1/i.test(sql) || /=\s*\?\s*$/.test(sql.trim()))) return res.rows[0]
        return res.rows
      }
      return res
    },
    async get(sql, params = []) {
      const rows = await pool.query(toPgSql(sql), params)
      return rows.rows[0]
    },
    async all(sql, params = []) {
      const rows = await pool.query(toPgSql(sql), params)
      return rows.rows
    },
    async run(sql, params = []) {
      return pool.query(toPgSql(sql), params)
    },
    async exec(sql) {
      await pool.query(pgSchema())
    },
  }
}
