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
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_id TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_sub TEXT',
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'ru'",
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
    'ALTER TABLE giveaway_results ADD COLUMN IF NOT EXISTS selection_ticket INTEGER',
    'ALTER TABLE giveaway_results ADD COLUMN IF NOT EXISTS total_chances INTEGER',
    'ALTER TABLE giveaway_results ADD COLUMN IF NOT EXISTS winner_chances INTEGER',
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
    `CREATE TABLE IF NOT EXISTS email_unsubscribes (
      email TEXT PRIMARY KEY,
      scope TEXT NOT NULL DEFAULT 'marketing',
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
    `CREATE TABLE IF NOT EXISTS giveaway_entries (
      id TEXT PRIMARY KEY,
      giveaway_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      telegram_username TEXT,
      telegram_verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(giveaway_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS giveaway_bonus_actions (
      id TEXT PRIMARY KEY,
      giveaway_id TEXT NOT NULL,
      beneficiary_user_id INTEGER NOT NULL,
      action_user_id INTEGER NOT NULL,
      action_type TEXT NOT NULL CHECK(action_type IN ('share', 'referral')),
      chances INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(giveaway_id, action_user_id, action_type)
    )`,
    `CREATE TABLE IF NOT EXISTS giveaway_results (
      giveaway_id TEXT PRIMARY KEY,
      winner_entry_id TEXT NOT NULL,
      winner_user_id INTEGER NOT NULL,
      winner_email TEXT NOT NULL,
      winner_telegram_username TEXT,
      participant_count INTEGER NOT NULL,
      selection_index INTEGER NOT NULL,
      selection_ticket INTEGER,
      total_chances INTEGER,
      winner_chances INTEGER,
      drawn_at TEXT NOT NULL,
      drawn_by TEXT NOT NULL,
      published_at TEXT,
      status TEXT NOT NULL DEFAULT 'drawn'
    )`,
    `CREATE TABLE IF NOT EXISTS marketplace_products (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, sku TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'draft', product_type TEXT NOT NULL DEFAULT 'marketplace',
      category_id TEXT, title_ru TEXT NOT NULL, title_en TEXT, short_ru TEXT, short_en TEXT,
      description_ru TEXT, description_en TEXT, price_eur REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR', is_free INTEGER NOT NULL DEFAULT 0,
      creator_email TEXT, cover_image TEXT, metadata TEXT NOT NULL DEFAULT '{}',
      published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS product_assets (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
      version INTEGER NOT NULL, label TEXT, file_name TEXT NOT NULL, file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0, storage_key TEXT NOT NULL, file_storage TEXT NOT NULL DEFAULT 'local',
      status TEXT NOT NULL DEFAULT 'active', changelog TEXT, created_by TEXT, created_at TEXT NOT NULL,
      UNIQUE(product_id, version)
    )`,
    `CREATE TABLE IF NOT EXISTS marketplace_orders (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES marketplace_products(id), sku TEXT NOT NULL,
      payment_id TEXT UNIQUE, provider TEXT NOT NULL, external_id TEXT, amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'EUR', status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL, completed_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS asset_entitlements (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES marketplace_products(id),
      order_id TEXT REFERENCES marketplace_orders(id), source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', granted_at TEXT NOT NULL, expires_at TEXT,
      UNIQUE(user_id, product_id)
    )`,
    `CREATE TABLE IF NOT EXISTS asset_downloads (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES marketplace_products(id), asset_id TEXT NOT NULL REFERENCES product_assets(id),
      order_id TEXT, created_at TEXT NOT NULL
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
  for (const sql of [
    'CREATE INDEX IF NOT EXISTS marketplace_products_status_idx ON marketplace_products(status, product_type)',
    'CREATE INDEX IF NOT EXISTS product_assets_product_idx ON product_assets(product_id, status)',
    'CREATE INDEX IF NOT EXISTS marketplace_orders_user_idx ON marketplace_orders(user_id, status)',
    'CREATE INDEX IF NOT EXISTS asset_entitlements_user_idx ON asset_entitlements(user_id, status)',
    'CREATE INDEX IF NOT EXISTS asset_downloads_product_idx ON asset_downloads(product_id)',
  ]) await pool.query(sql).catch(() => {})
}
