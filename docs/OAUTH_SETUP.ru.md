# Вход через Google и Apple

Кнопки на `/login` и `/register` появляются только когда заданы Client ID.

## Google (обязательно для кнопки Google)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create Credentials → **OAuth client ID** → Application type: **Web application**
3. Authorized JavaScript origins:
   - `https://myinsideracademy.com`
   - `http://localhost:5173`
4. Authorized redirect URIs (можно оставить пустым для GIS One Tap / button)
5. Скопируйте **Client ID** (`….apps.googleusercontent.com`)

**Vercel (frontend):**
```
VITE_GOOGLE_CLIENT_ID=<Client ID>
```

**Render (API):**
```
GOOGLE_OAUTH_CLIENT_ID=<тот же Client ID>
```

После добавления env — redeploy Vercel и Render.

## Apple (опционально, нужен Apple Developer Program)

1. [Apple Developer](https://developer.apple.com/account) → Certificates, Identifiers & Profiles
2. Identifiers → **App IDs** — включите Sign In with Apple
3. Identifiers → **Services IDs** — создайте ID, например `com.aiinsider.academy.web`
4. Configure → Domains: `myinsideracademy.com`  
   Return URLs: `https://myinsideracademy.com/login`
5. Client ID = Services ID

**Vercel:**
```
VITE_APPLE_CLIENT_ID=com.aiinsider.academy.web
```

**Render:**
```
APPLE_OAUTH_CLIENT_ID=com.aiinsider.academy.web
```

## Проверка

- `GET https://insider-academy.onrender.com/api/auth/oauth/config` → `{ google: true, apple: true, … }`
- `GET /api/health` → `features.googleOAuth` / `features.appleOAuth`
