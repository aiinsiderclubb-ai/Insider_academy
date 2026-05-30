import pg from 'pg'
import { SCHEMA } from './sqlite.js'

const { Pool } = pg

function toPgSql(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
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
  const pool = new Pool({ connectionString, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined })
  await pool.query(pgSchema())
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
