const MARKETPLACE_SCHEMA = `
CREATE TABLE IF NOT EXISTS commerce_products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT,
  creator_id TEXT,
  base_price_eur REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_versions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  version TEXT NOT NULL,
  changelog TEXT,
  deploy_manifest TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  UNIQUE(product_id, version)
);
CREATE TABLE IF NOT EXISTS commerce_assets (
  id TEXT PRIMARY KEY,
  product_version_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  storage_driver TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  checksum TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  license_tier TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  legal_snapshot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  granted_at TEXT NOT NULL,
  expires_at TEXT,
  UNIQUE(user_id, product_id, source_type, source_id)
);
CREATE TABLE IF NOT EXISTS download_events (
  id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  downloaded_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS marketplace_events (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  product_id TEXT,
  event_name TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checkout_contexts (
  payment_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  license_tier TEXT NOT NULL,
  quoted_amount_eur REAL NOT NULL,
  legal_snapshot TEXT NOT NULL,
  provider_reference TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS marketplace_bundles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  base_price_eur REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  metadata TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bundle_items (
  bundle_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  PRIMARY KEY (bundle_id, product_id)
);
CREATE TABLE IF NOT EXISTS n8n_connections (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  instance_url TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  key_iv TEXT NOT NULL,
  key_tag TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS agent_deployments (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  product_version_id TEXT,
  connection_id TEXT,
  status TEXT NOT NULL,
  remote_workflow_id TEXT,
  error_code TEXT,
  error_message TEXT,
  latency_ms INTEGER,
  cost_eur REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS deployment_events (
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS eval_suites (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  dataset TEXT NOT NULL,
  pass_threshold REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS eval_runs (
  id TEXT PRIMARY KEY,
  suite_id TEXT NOT NULL,
  deployment_id TEXT,
  user_id INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  score REAL NOT NULL,
  report TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  deployment_id TEXT,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resolution TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`

export async function ensureMarketplaceSchema(db) {
  await db.exec(MARKETPLACE_SCHEMA)
  try {
    await db.exec('ALTER TABLE checkout_contexts ADD COLUMN provider_reference TEXT')
  } catch (err) {
    if (!/duplicate column|already exists/i.test(String(err.message))) throw err
  }
}

export { MARKETPLACE_SCHEMA }
