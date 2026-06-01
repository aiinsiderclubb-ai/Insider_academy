# Telegram-бот @InsiderAcademyNotifyBot — простая настройка

Бот молчит, потому что на **сервере Academy (Render)** не прописан токен бота.  
Код уже готов — нужно **один раз** вставить 4 строки в Render.

---

## Шаг 1. Откройте Render

1. Зайдите на https://dashboard.render.com  
2. Откройте сервис **`insider-academy-api`** (не фронт, не базу — именно **api**)

---

## Шаг 2. Вставьте переменные

Слева **Environment** → **Add Environment Variable** — добавьте **по одной**:

| Имя | Значение |
|-----|----------|
| `TELEGRAM_BOT_TOKEN` | токен из @BotFather (длинная строка) |
| `TELEGRAM_BOT_USERNAME` | `InsiderAcademyNotifyBot` |
| `TELEGRAM_BOT_SERVICE_SECRET` | `0e4a1374271a72377b84dfc5191df55d62bd6b118e5eb569` |
| `BOT_SERVICE_SECRET` | то же самое |

Нажмите **Save Changes**.

Render перезапустит сервер (1–3 минуты).

---

## Шаг 3. Проверка в Telegram

1. Откройте https://t.me/InsiderAcademyNotifyBot  
2. Напишите **`/start`**  
3. Бот должен ответить и попросить **личный ID** (`AIA-XXXXXX`)  
4. ID скопируйте на сайте: **Личный кабинет → Telegram**  
5. Отправьте боту, например: `AIA-X5MUH7`  
6. Ответ: **«Готово! Telegram подключён»**

---

## Если снова тишина

Откройте в браузере:

https://insider-academy.onrender.com/api/health

Должно быть: `"telegram": true`  

Если `"telegram": false` — токен на Render ещё не сохранён или деплой не закончился.

---

## Безопасность

Токен бота лучше **перевыпустить** в @BotFather: `/revoke` → новый токен → вставить в Render вместо старого.
