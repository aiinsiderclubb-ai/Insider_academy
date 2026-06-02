# Telegram Notify Bot — AI Insider Academy

Отдельный сервис бота для push-уведомлений: ДЗ, промокоды, новости, отзывы, напоминания об уроках.

## Как это работает

1. Пользователь в **личном кабинете** → **Telegram** → «Подключить Telegram».
2. Открывается `t.me/YourBot?start=link_<токен>`.
3. Бот вызывает LMS API и сохраняет `chat_id` в профиле.
4. При событиях на сайте LMS шлёт `POST /notify` в этот сервис → сообщение в Telegram.

## Быстрый старт (локально)

```bash
# 1. Создайте бота в @BotFather, скопируйте токен

cd telegram-notify-bot
cp .env.example .env
# заполните TELEGRAM_BOT_TOKEN, BOT_SERVICE_SECRET, LMS_API_URL

npm install
npm run dev
```

В `Insider_academy/server/.env` добавьте (тот же секрет):

```env
TELEGRAM_BOT_TOKEN=...          # можно тот же токен
TELEGRAM_BOT_USERNAME=YourBot   # без @
TELEGRAM_BOT_SERVICE_URL=http://localhost:3080
TELEGRAM_BOT_SERVICE_SECRET=change-me-long-random-secret
BOT_SERVICE_SECRET=change-me-long-random-secret
```

Запустите LMS: `npm run dev:all` из корня `Insider_academy`.

### Webhook (продакшен)

```bash
BOT_PUBLIC_URL=https://your-bot.onrender.com npm run set-webhook
```

Или long polling: можно добавить позже; сейчас LMS шлёт исходящие через `/notify`.

## API бота

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/health` | Проверка |
| POST | `/telegram/webhook` | Webhook Telegram |
| POST | `/notify` | Одно уведомление (`x-bot-secret`) |
| POST | `/notify/bulk` | До 100 сообщений |

Тело `/notify`:

```json
{
  "chatId": "123456789",
  "type": "homework_accepted",
  "data": {
    "courseTitle": "AI Content Creator",
    "lessonTitle": "Урок 3",
    "score": 9,
    "targetPath": "/courses/ai-content-creator?lesson=2"
  }
}
```

Типы: `homework_accepted`, `homework_resubmit`, `promo_new`, `course_news`, `review_approved`, `review_rejected`, `purchase`, `lesson_reminder`, `custom`.

## Команды бота

- `/start` — приветствие
- `/start link_<token>` — привязка аккаунта (из кабинета)
- `/stop` — отключить уведомления
- `/help` — справка

## Админ: рассылка новостей

`POST /api/admin/telegram/broadcast` (admin JWT)

```json
{
  "title": "Новый курс",
  "text": "Открылся AI Agent Engineer",
  "url": "/courses"
}
```

## Деплой на Render

Создайте **Web Service** из папки `telegram-notify-bot`:

- Build: `npm install`
- Start: `npm start`
- Env: как в `.env.example`
- Health check: `/health`

В LMS API задайте `TELEGRAM_BOT_SERVICE_URL=https://your-bot.onrender.com`.
