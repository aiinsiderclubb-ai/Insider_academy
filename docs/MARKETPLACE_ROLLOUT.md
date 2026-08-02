# Marketplace rollout and rollback

## Required production configuration

1. Configure Postgres and S3-compatible private object storage.
2. Set 32+ character `JWT_SECRET`, `ADMIN_JWT_SECRET`, `DOWNLOAD_SIGNING_SECRET`.
3. Configure and verify at least one payment webhook.
4. Upload and publish each paid product version in Admin before enabling sales.
5. Run backend tests and `npm run build`.

## P0/P1 rollout

1. Deploy API with `FEATURE_MARKETPLACE_COMMERCE=false`.
2. Confirm `/api/health/ready` and `/api/marketplace/catalog`.
3. Verify the legacy purchase backfill and compare entitlement counts.
4. Upload one canary asset and test owner download, wrong-user denial and expired URL.
5. Set `FEATURE_MARKETPLACE_COMMERCE=true`.
6. Complete one low-value Stripe, Tribute and LiqPay transaction for every configured provider.
7. Confirm `checkout_started → paid → download` events and webhook idempotency.

Rollback: set `FEATURE_MARKETPLACE_COMMERCE=false`. Existing entitlements and downloads remain available; checkout is closed. Do not delete the new tables.

## P2 rollout

1. Set a stable `N8N_CREDENTIALS_ENCRYPTION_KEY`; back it up in the secret manager.
2. Keep `FEATURE_N8N_DEPLOY=false` while testing against a dedicated n8n instance.
3. Publish deploy manifests only for reviewed workflows.
4. Enable for canary users with `FEATURE_N8N_DEPLOY=true`.
5. Verify preview, deploy, retry, rollback, cross-user denial and credential revocation.

Rollback: set `FEATURE_N8N_DEPLOY=false`; revoke canary connections if compromise is suspected.

## P3 rollout

1. Keep `FEATURE_GOVERNANCE=false` until P2 telemetry is stable.
2. Confirm retention policy and legal requirements.
3. Enable Agency beta with `FEATURE_GOVERNANCE=true`.
4. Run baseline evals, create and resolve a test incident, and export the report.

Rollback: set `FEATURE_GOVERNANCE=false`. Retain audit records under the configured retention policy.
