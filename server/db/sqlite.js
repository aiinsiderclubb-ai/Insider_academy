import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT,
  email_verified INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  streak_count INTEGER DEFAULT 0,
  last_activity_date TEXT,
  telegram_chat_id TEXT,
  avatar_url TEXT,
  profile_updated_at TEXT,
  password_changed_at TEXT,
  personal_id TEXT UNIQUE,
  team_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id TEXT NOT NULL,
  purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
  payment_provider TEXT,
  payment_id TEXT,
  UNIQUE(user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
  user_id INTEGER NOT NULL,
  course_id TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  personal_id TEXT,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_log (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  course_id TEXT,
  course_title TEXT,
  amount REAL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  course_id TEXT,
  course_title TEXT,
  file_name TEXT,
  file_type TEXT,
  file_path TEXT,
  file_storage TEXT DEFAULT 'local',
  score REAL,
  date TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS homework (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  course_id TEXT,
  course_title TEXT,
  lesson_index INTEGER,
  lesson_title TEXT,
  content TEXT,
  file_name TEXT,
  file_type TEXT,
  file_path TEXT,
  file_storage TEXT DEFAULT 'local',
  status TEXT DEFAULT 'pending',
  score REAL,
  admin_comment TEXT,
  date TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT,
  status TEXT,
  course_id TEXT,
  course_slug TEXT,
  course_title TEXT,
  lesson_title TEXT,
  lesson_index INTEGER,
  target_path TEXT,
  message TEXT,
  read INTEGER DEFAULT 0,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_code TEXT,
  referrer_email TEXT,
  referred_email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  referred_purchased INTEGER DEFAULT 0,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_discounts (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  percent INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_name TEXT,
  status TEXT,
  payload TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_seen (
  type TEXT NOT NULL,
  item_key TEXT NOT NULL,
  PRIMARY KEY (type, item_key)
);

CREATE TABLE IF NOT EXISTS email_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  email TEXT,
  course_id TEXT NOT NULL,
  course_title TEXT,
  amount REAL,
  currency TEXT DEFAULT 'EUR',
  provider TEXT NOT NULL,
  external_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  user_id INTEGER,
  email TEXT NOT NULL,
  contact_email TEXT,
  user_name TEXT,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  max_seats INTEGER DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS lesson_reminders (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  course_id TEXT NOT NULL,
  lesson_index INTEGER,
  remind_at TEXT NOT NULL,
  sent INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accelerator_applications (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER,
  country TEXT,
  telegram TEXT,
  email TEXT NOT NULL,
  current_activity TEXT,
  ai_experience TEXT,
  interests TEXT,
  source TEXT,
  motivation TEXT,
  future_goal TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_note TEXT,
  date TEXT NOT NULL,
  updated_at TEXT
);
`

export function createSqliteDb() {
  const dbPath = process.env.LMS_TEST_DB || path.join(dataDir, 'lms.sqlite')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  migrateColumns(db)
  return {
    driver: 'sqlite',
    raw: db,
    async query(sql, params = []) {
      const stmt = db.prepare(sql)
      if (/^\s*SELECT/i.test(sql)) {
        if (sql.includes('LIMIT 1') || /=\s*\?\s*$/.test(sql.trim())) {
          return stmt.get(...params)
        }
        return stmt.all(...params)
      }
      return stmt.run(...params)
    },
    async get(sql, params = []) { return db.prepare(sql).get(...params) },
    async all(sql, params = []) { return db.prepare(sql).all(...params) },
    async run(sql, params = []) { return db.prepare(sql).run(...params) },
    async exec(sql) { db.exec(sql) },
  }
}

function migrateColumns(db) {
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name)
  const add = (sql) => { try { db.exec(sql) } catch (_) {} }
  if (!cols.includes('email_verified')) add('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0')
  if (!cols.includes('streak_count')) add('ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0')
  if (!cols.includes('last_activity_date')) add('ALTER TABLE users ADD COLUMN last_activity_date TEXT')
  if (!cols.includes('telegram_chat_id')) add('ALTER TABLE users ADD COLUMN telegram_chat_id TEXT')
  if (!cols.includes('team_id')) add('ALTER TABLE users ADD COLUMN team_id INTEGER')
  if (!cols.includes('stripe_customer_id')) add('ALTER TABLE users ADD COLUMN stripe_customer_id TEXT')
  if (!cols.includes('avatar_url')) add('ALTER TABLE users ADD COLUMN avatar_url TEXT')
  if (!cols.includes('profile_updated_at')) add('ALTER TABLE users ADD COLUMN profile_updated_at TEXT')
  if (!cols.includes('password_changed_at')) add('ALTER TABLE users ADD COLUMN password_changed_at TEXT')
  if (!cols.includes('last_login_at')) add('ALTER TABLE users ADD COLUMN last_login_at TEXT')
  if (!cols.includes('personal_id')) add('ALTER TABLE users ADD COLUMN personal_id TEXT')
  if (!cols.includes('telegram_username')) add('ALTER TABLE users ADD COLUMN telegram_username TEXT')

  const regCols = db.prepare('PRAGMA table_info(registrations)').all().map((c) => c.name)
  if (!regCols.includes('personal_id')) add('ALTER TABLE registrations ADD COLUMN personal_id TEXT')

  try {
    db.exec(`
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  email TEXT NOT NULL,
  name TEXT,
  message TEXT NOT NULL,
  reply TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  date TEXT NOT NULL
)`)
  } catch (_) {}

  const reviewCols = db.prepare('PRAGMA table_info(reviews)').all().map((c) => c.name)
  if (!reviewCols.includes('status')) add("ALTER TABLE reviews ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'")
  if (!reviewCols.includes('contact_email')) add('ALTER TABLE reviews ADD COLUMN contact_email TEXT')

  try {
    db.exec(`
CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY COLLATE NOCASE,
  discount_percent INTEGER,
  discount_eur REAL,
  course_ids TEXT,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TEXT,
  valid_until TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS email_queue (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  template TEXT NOT NULL,
  payload TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  send_after TEXT NOT NULL,
  sent_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS creator_payouts (
  id TEXT PRIMARY KEY,
  creator_email TEXT NOT NULL,
  product_id TEXT,
  amount_eur REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS peer_reviews (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  lesson_index INTEGER NOT NULL,
  reviewer_user_id INTEGER NOT NULL,
  homework_id TEXT,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);`)
  } catch (_) {}
}

export function parseJson(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
