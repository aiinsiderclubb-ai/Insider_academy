# Launch checklist — Insider Academy

## Automated in CI (GitHub Actions)

- `npm run build` — Vite production bundle
- `npm run test:e2e` — auth, password reset, Tribute webhook, health

## 1. Vercel production build

- Project: `insider-academy-vsxg` (or domain-linked project)
- Env: `VITE_API_URL=/api`, `VITE_ACADEMY_URL=https://myinsideracademy.com`
- `vercel.json` rewrites `/api/*` → Render API
- After push to `main`, confirm deployment state **Ready** in Vercel Dashboard

## 2. Render API + Postgres

| Service | URL | Health |
|---------|-----|--------|
| API | https://insider-academy.onrender.com | `/api/health`, `/api/health/ready` |
| Notify bot | https://insider-academy-notify-bot.onrender.com | `/health` |
| Postgres | `insider-academy-db` | Connected when `db: postgres` in health |

### Postgres backups

Render **Basic** Postgres includes automatic daily backups (7-day retention).  
Dashboard → `insider-academy-db` → **Backups** → verify snapshots enabled before launch.

## 3. Secrets (rotate after any git leak)

Run locally:

```bash
./scripts/rotate-production-secrets.sh
```

Set generated values in Render (both API + notify-bot for `BOT_SERVICE_SECRET`).

| Variable | Service |
|----------|---------|
| `JWT_SECRET`, `ADMIN_JWT_SECRET` | API |
| `ADMIN_PASSWORD`, `EDITOR_PASSWORD`, `MODERATOR_PASSWORD` | API (12+ chars each) |
| `TRIBUTE_API_KEY` | API |
| `TELEGRAM_BOT_TOKEN` | API + bot |
| `TELEGRAM_WEBHOOK_SECRET` | API |
| `BOT_SERVICE_SECRET` | API + notify-bot (same value) |
| `SMTP_PASS`, `GOOGLE_SERVICE_ACCOUNT_JSON` | API |

Never commit secrets. `render.yaml` uses `sync: false` only.

## 4. SMTP + SPF/DKIM (info@myinsideracademy.com)

See [DNS_EMAIL.md](./DNS_EMAIL.md).  
Verify in admin: `POST /api/admin/test-email` after deploy.

## 5. Monitoring

| Check | URL / action |
|-------|----------------|
| API liveness | `GET https://insider-academy.onrender.com/api/health` |
| API readiness (DB) | `GET https://insider-academy.onrender.com/api/health/ready` |
| Frontend | `GET https://myinsideracademy.com/` |
| Webhook log | Admin → dashboard (last 20 events) |
| UptimeRobot / Better Stack | Monitor `/api/health/ready` every 5 min |
| Vercel | Enable deployment failure email alerts |
| Render | Enable service failure notifications |

## 6. Manual smoke test (production)

1. Register → email code → login  
2. Open paid course → Tribute checkout  
3. After payment → course unlocked in cabinet  
4. Forgot password → email link → `myinsideracademy.com/reset-password`  
5. Admin login with strong password  
6. Telegram bot `/start` + link `AIA-XXXXXX`

## 7. Test account on production

Disabled by default. To enable QA only: `ALLOW_TEST_ACCOUNT=1` on Render (not recommended for public launch).
