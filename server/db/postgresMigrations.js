/**
 * Migrations for existing Render Postgres DBs created before schema updates.
 * CREATE TABLE IF NOT EXISTS does not add new columns to old tables.
 */
export async function runPostgresMigrations(pool) {
  const statements = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified INTEGER DEFAULT 0",
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id INTEGER',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_updated_at TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_id TEXT',
    'ALTER TABLE registrations ADD COLUMN IF NOT EXISTS personal_id TEXT',
    'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS contact_email TEXT',
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'",
    'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_name TEXT',
    'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id INTEGER',
    'ALTER TABLE homework ADD COLUMN IF NOT EXISTS file_storage TEXT',
    'ALTER TABLE homework ADD COLUMN IF NOT EXISTS admin_comment TEXT',
    'ALTER TABLE homework ADD COLUMN IF NOT EXISTS score REAL',
    'ALTER TABLE homework ADD COLUMN IF NOT EXISTS updated_at TEXT',
    'ALTER TABLE certificates ADD COLUMN IF NOT EXISTS updated_at TEXT',
    'ALTER TABLE accelerator_applications ADD COLUMN IF NOT EXISTS admin_note TEXT',
    'ALTER TABLE accelerator_applications ADD COLUMN IF NOT EXISTS updated_at TEXT',
  ]

  const tables = [
    `CREATE TABLE IF NOT EXISTS telegram_link_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      used_at TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS peer_reviews (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      lesson_index INTEGER NOT NULL,
      reviewer_user_id INTEGER NOT NULL,
      homework_id TEXT,
      rating INTEGER,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      meta TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS email_queue (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      template TEXT NOT NULL,
      payload TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      send_after TEXT NOT NULL,
      sent_at TEXT,
      error TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS creator_payouts (
      id TEXT PRIMARY KEY,
      creator_email TEXT NOT NULL,
      product_id TEXT,
      amount_eur REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT,
      created_at TEXT NOT NULL,
      paid_at TEXT
    )`,
  ]

  for (const sql of statements) {
    await pool.query(sql).catch((err) => {
      console.warn('[postgres migrate]', err.message)
    })
  }
  for (const sql of tables) {
    await pool.query(sql).catch((err) => {
      console.warn('[postgres migrate table]', err.message)
    })
  }

  await pool.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS users_personal_id_idx ON users (personal_id) WHERE personal_id IS NOT NULL'
  ).catch(() => {})
}
