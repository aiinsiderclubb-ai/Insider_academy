#!/usr/bin/env bash
# Generate new secrets after rotation. Paste into Render Dashboard (never commit output).
set -euo pipefail

gen() { openssl rand -hex 32; }

echo "=== Render API (insider-academy) ==="
echo "JWT_SECRET=$(gen)"
echo "ADMIN_JWT_SECRET=$(gen)"
echo "TELEGRAM_WEBHOOK_SECRET=$(gen)"
BOT_SECRET="$(gen)"
echo "TELEGRAM_BOT_SERVICE_SECRET=$BOT_SECRET"
echo "BOT_SERVICE_SECRET=$BOT_SECRET"
echo ""
echo "=== Render notify-bot (same BOT value) ==="
echo "BOT_SERVICE_SECRET=$BOT_SECRET"
echo ""
echo "Also set manually: ADMIN_PASSWORD, EDITOR_PASSWORD, MODERATOR_PASSWORD,"
echo "TRIBUTE_API_KEY, TELEGRAM_BOT_TOKEN, SMTP_PASS, GOOGLE_SERVICE_ACCOUNT_JSON"
echo ""
echo "Redeploy both services after updating env vars."
