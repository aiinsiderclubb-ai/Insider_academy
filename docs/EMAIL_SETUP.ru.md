# Настройка почты AI Insider Academy

Письма отправляет **бекенд на Render** (`insider-academy.onrender.com`), не Vercel.  
На сайте [myinsideracademy.com](https://myinsideracademy.com) **ничего настраивать не нужно** — только переменные окружения на Render.

## Что уходит автоматически

| Событие | Письмо |
|--------|--------|
| Регистрация | 6-значный код подтверждения |
| Сброс пароля | Ссылка на `/reset-password?token=…` (1 час) |
| Проверка ДЗ | Статус и комментарий ментора |
| После регистрации | Приветствие (очередь, ~2 мин) |
| 3 дня без входа | Напоминание продолжить обучение |
| Админ (опционально) | Дайджест раз в день, если задан `ADMIN_EMAIL` |

Пока SMTP не настроен, на экране сброса пароля показывается **ссылка вручную** (как на вашем скриншоте).

---

## Шаг 1 — почтовый ящик

Создайте ящик **`info@myinsideracademy.com`** (или используйте существующий) у регистратора домена (GoDaddy и т.п.).

Рекомендуемый отправитель в письмах:

```text
AI Insider Academy <info@myinsideracademy.com>
```

---

## Шаг 2 — SMTP (выберите один вариант)

### Вариант A — GoDaddy (если почта на домене)

В [Render Dashboard](https://dashboard.render.com) → сервис **Insider_academy** (API) → **Environment**:

| Переменная | Значение |
|------------|----------|
| `SMTP_HOST` | `smtpout.secureserver.net` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `info@myinsideracademy.com` |
| `SMTP_PASS` | пароль от почтового ящика |
| `EMAIL_FROM` | `AI Insider Academy <info@myinsideracademy.com>` |
| `ADMIN_EMAIL` | ваш email для дайджеста и тестов |

Если 465 не работает, попробуйте: `SMTP_PORT=587`, `SMTP_SECURE=false`.

### Вариант B — Brevo (быстро, бесплатный тариф)

1. [brevo.com](https://www.brevo.com) → SMTP & API → SMTP.
2. Подтвердите домен `myinsideracademy.com` (DNS: SPF, DKIM).
3. На Render:

| Переменная | Значение |
|------------|----------|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | ваш login из Brevo |
| `SMTP_PASS` | SMTP-ключ из Brevo |
| `EMAIL_FROM` | `AI Insider Academy <info@myinsideracademy.com>` |

### Вариант C — Google Workspace

| Переменная | Значение |
|------------|----------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `info@myinsideracademy.com` |
| `SMTP_PASS` | [пароль приложения](https://myaccount.google.com/apppasswords) |
| `EMAIL_FROM` | `AI Insider Academy <info@myinsideracademy.com>` |

---

## Шаг 3 — перезапуск API

После сохранения переменных: **Manual Deploy** или дождитесь автодеплоя.

Проверка: `https://insider-academy.onrender.com/api/health` → в `features` должно быть `"email": true`.

---

## Шаг 4 — проверка на сайте

1. Откройте [myinsideracademy.com/admin](https://myinsideracademy.com/admin).
2. Вкладка **Настройки** → блок **Почта платформы (SMTP)**.
3. Нажмите **Отправить тестовое письмо**.
4. Проверьте «Сброс пароля» — ссылка должна прийти на почту, без жёлтого блока «почта не настроена».

---

### Если письма не приходят (Microsoft 365 / GoDaddy)

Ошибка `535 5.7.139 SmtpClientAuthentication is disabled` — у ящика **отключён SMTP**.

**Включить в GoDaddy / Microsoft 365:**
1. [admin.microsoft.com](https://admin.microsoft.com) (вход через GoDaddy → Email → Admin).
2. **Users** → `info@myinsideracademy.com` → **Mail** → **Manage email apps**.
3. Включите **Authenticated SMTP** (SMTP AUTH).
4. Сохраните, подождите 15–30 мин, снова тест на Render.

Если нет доступа к admin — позвоните в **GoDaddy Support** и попросите включить **SMTP AUTH** для `info@myinsideracademy.com`.

**Быстрая альтернатива:** [Brevo](https://www.brevo.com) — transactional SMTP без Microsoft (см. вариант B выше).


У домена `myinsideracademy.com` добавьте записи от вашего SMTP-провайдера (SPF, DKIM, при необходимости DMARC). Без этого письма часто попадают в спам.

---

## На Vercel ничего не добавлять

`VITE_*` для почты не нужны. Только Render API.
