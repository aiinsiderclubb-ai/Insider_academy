import { config } from '../config.js'
import { createSqliteDb } from './sqlite.js'

let db = null

export function resetDatabase() {
  db = null
}

export async function initDatabase() {
  if (config.databaseUrl) {
    const { createPostgresDb } = await import('./postgres.js')
    db = await createPostgresDb(config.databaseUrl)
    console.log('[db] PostgreSQL connected')
  } else {
    db = createSqliteDb()
    console.log('[db] SQLite connected')
  }
  return db
}

export function getDb() {
  if (!db) throw new Error('Database not initialized')
  return db
}

export { parseJson } from './sqlite.js'
