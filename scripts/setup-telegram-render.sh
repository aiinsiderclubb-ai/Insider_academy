#!/usr/bin/env bash
# Одноразовая настройка Telegram-бота на Render (запуск из папки Insider_academy)
set -euo pipefail

API_URL="${API_URL:-https://insider-academy.onrender.com}"
RENDER_API_KEY="${RENDER_API_KEY:-}"

if [[ -f server/.env ]]; then
  # shellcheck disable=SC1091
  source server/.env
fi

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
USERNAME="${TELEGRAM_BOT_USERNAME:-InsiderAcademyNotifyBot}"
SECRET="${TELEGRAM_BOT_SERVICE_SECRET:-${BOT_SERVICE_SECRET:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "❌ В server/.env нет TELEGRAM_BOT_TOKEN"
  exit 1
fi

echo "→ Webhook на $API_URL/api/telegram/webhook"
curl -fsS "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"${API_URL}/api/telegram/webhook\",\"allowed_updates\":[\"message\"],\"drop_pending_updates\":true}" \
  | head -c 200
echo ""

if [[ -n "$RENDER_API_KEY" ]]; then
  echo "→ Ищем сервис API на Render..."
  SVC=$(curl -fsS -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services?limit=50" | node -e "
    let d=''; process.stdin.on('data',c=>d+=c);
    process.stdin.on('end',()=>{
      const j=JSON.parse(d);
      const list=j||[];
      const hit=list.find(x=>(x.service?.name||'').includes('insider-academy-api')||(x.service?.name||'').includes('api'));
      if(hit) console.log(hit.service.id);
    });
  ")
  if [[ -n "$SVC" ]]; then
    echo "→ Обновляем env на сервисе $SVC"
    for pair in \
      "TELEGRAM_BOT_TOKEN:$TOKEN" \
      "TELEGRAM_BOT_USERNAME:$USERNAME" \
      "TELEGRAM_BOT_SERVICE_SECRET:$SECRET" \
      "BOT_SERVICE_SECRET:$SECRET" \
      "TELEGRAM_WEBHOOK_URL:${API_URL}/api/telegram/webhook"; do
      KEY="${pair%%:*}"
      VAL="${pair#*:}"
      curl -fsS -X PUT -H "Authorization: Bearer $RENDER_API_KEY" \
        -H 'Content-Type: application/json' \
        "https://api.render.com/v1/services/${SVC}/env-vars/${KEY}" \
        -d "{\"value\":$(node -e "console.log(JSON.stringify(process.argv[1]))" "$VAL")}" >/dev/null || true
    done
    echo "→ Триггер деплоя..."
    curl -fsS -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
      "https://api.render.com/v1/services/${SVC}/deploys" -d '{}' >/dev/null || true
    echo "✅ Env обновлены, деплой запущен"
  fi
else
  echo ""
  echo "⚠️  RENDER_API_KEY не задан — переменные на Render нужно вписать вручную (см. TELEGRAM_SETUP.md)"
fi

echo ""
echo "Проверка health (подождите 2–3 мин после деплоя):"
echo "  curl -s $API_URL/api/health | grep telegram"
