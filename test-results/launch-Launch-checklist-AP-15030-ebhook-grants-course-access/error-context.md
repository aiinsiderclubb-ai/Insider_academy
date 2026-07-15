# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: launch.spec.js >> Launch checklist (API) >> tribute webhook grants course access
- Location: e2e/launch.spec.js:69:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { tributeSignature, apiRegisterAndVerify } from './helpers.js'
  3   | 
  4   | const apiBase = () => process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api'
  5   | 
  6   | test.describe('Launch checklist (API)', () => {
  7   |   test('health + readiness', async ({ request }) => {
  8   |     const health = await request.get(`${apiBase()}/health`)
  9   |     expect(health.ok()).toBeTruthy()
  10  |     const body = await health.json()
  11  |     expect(body.ok).toBe(true)
  12  |     expect(body.db).toBeTruthy()
  13  | 
  14  |     const ready = await request.get(`${apiBase()}/health/ready`)
  15  |     expect(ready.ok()).toBeTruthy()
  16  |     const readyBody = await ready.json()
  17  |     expect(readyBody.ok).toBe(true)
  18  |   })
  19  | 
  20  |   test('register → verify → login → course access', async ({ request }) => {
  21  |     const email = `launch-${Date.now()}@example.com`
  22  |     const password = 'LaunchTest2026!'
  23  | 
  24  |     const { token, user, base } = await apiRegisterAndVerify(request, { email, password })
  25  |     expect(user.email).toBe(email)
  26  | 
  27  |     const login = await request.post(`${base}/auth/login`, { data: { email, password } })
  28  |     expect(login.ok()).toBeTruthy()
  29  | 
  30  |     const courses = await request.get(`${base}/courses`, {
  31  |       headers: { Authorization: `Bearer ${token}` },
  32  |     })
  33  |     expect(courses.ok()).toBeTruthy()
  34  |     const list = await courses.json()
  35  |     expect(Array.isArray(list)).toBeTruthy()
  36  |   })
  37  | 
  38  |   test('forgot-password → reset-password flow', async ({ request }) => {
  39  |     const email = `reset-${Date.now()}@example.com`
  40  |     const password = 'OldPass2026!'
  41  |     const newPassword = 'NewPass2026!'
  42  | 
  43  |     await apiRegisterAndVerify(request, { email, password })
  44  | 
  45  |     const forgot = await request.post(`${apiBase()}/auth/forgot-password`, { data: { email } })
  46  |     expect(forgot.ok()).toBeTruthy()
  47  |     const forgotBody = await forgot.json()
  48  |     expect(forgotBody.ok).toBe(true)
  49  | 
  50  |     let token = forgotBody.resetLink?.match(/token=([^&]+)/)?.[1]
  51  |     if (!token) {
  52  |       const dbTokenRes = await request.post(`${apiBase()}/auth/forgot-password`, { data: { email } })
  53  |       const body = await dbTokenRes.json()
  54  |       token = body.resetLink?.match(/token=([^&]+)/)?.[1]
  55  |     }
  56  |     expect(token).toBeTruthy()
  57  | 
  58  |     const reset = await request.post(`${apiBase()}/auth/reset-password`, {
  59  |       data: { token, password: newPassword },
  60  |     })
  61  |     expect(reset.ok()).toBeTruthy()
  62  | 
  63  |     const login = await request.post(`${apiBase()}/auth/login`, {
  64  |       data: { email, password: newPassword },
  65  |     })
  66  |     expect(login.ok()).toBeTruthy()
  67  |   })
  68  | 
  69  |   test('tribute webhook grants course access', async ({ request }) => {
  70  |     const tributeKey = process.env.TRIBUTE_API_KEY || 'ci-tribute-test-key-for-hmac-signing'
  71  |     const email = `tribute-${Date.now()}@example.com`
  72  |     const password = 'TributeTest2026!'
  73  |     const courseId = 'ai-start'
  74  |     const productId = 65858
  75  | 
  76  |     const { token, base } = await apiRegisterAndVerify(request, { email, password })
  77  | 
  78  |     const payload = {
  79  |       name: 'new_digital_product',
  80  |       payload: {
  81  |         product_id: productId,
  82  |         email,
  83  |         product_name: 'AI Start',
  84  |         amount: 2900,
  85  |       },
  86  |     }
  87  |     const raw = JSON.stringify(payload)
  88  |     const sig = tributeSignature(raw, tributeKey)
  89  | 
  90  |     const wh = await request.post(`${base}/webhooks/tribute`, {
  91  |       headers: {
  92  |         'Content-Type': 'application/json',
  93  |         'trbt-signature': sig,
  94  |       },
  95  |       data: raw,
  96  |     })
> 97  |     expect(wh.ok()).toBeTruthy()
      |                     ^ Error: expect(received).toBeTruthy()
  98  |     const whBody = await wh.json()
  99  |     expect(whBody.ok).toBe(true)
  100 | 
  101 |     const me = await request.get(`${base}/me`, {
  102 |       headers: { Authorization: `Bearer ${token}` },
  103 |     })
  104 |     expect(me.ok()).toBeTruthy()
  105 |     const profile = await me.json()
  106 |     const purchased = (profile.purchases || []).some((p) => p.id === courseId || p.courseId === courseId)
  107 |     expect(purchased || whBody.granted).toBeTruthy()
  108 |   })
  109 | 
  110 |   test('admin login rejects weak password', async ({ request }) => {
  111 |     const res = await request.post(`${apiBase()}/admin/login`, {
  112 |       data: { password: 'admin123' },
  113 |     })
  114 |     expect([401, 403]).toContain(res.status())
  115 |   })
  116 | 
  117 |   test('admin login with CI password', async ({ request }) => {
  118 |     const adminPass = process.env.ADMIN_PASSWORD
  119 |     test.skip(!adminPass || adminPass === 'admin123', 'ADMIN_PASSWORD not set for CI')
  120 |     const res = await request.post(`${apiBase()}/admin/login`, {
  121 |       data: { password: adminPass },
  122 |     })
  123 |     expect(res.ok()).toBeTruthy()
  124 |     const body = await res.json()
  125 |     expect(body.token).toBeTruthy()
  126 |   })
  127 | })
  128 | 
  129 | test.describe('Launch checklist (UI)', () => {
  130 |   test('home page loads', async ({ page }) => {
  131 |     await page.goto('/')
  132 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
  133 |   })
  134 | 
  135 |   test('login page', async ({ page }) => {
  136 |     await page.goto('/login')
  137 |     await expect(page.locator('input[name="email"]')).toBeVisible()
  138 |     await expect(page.locator('input[name="password"]')).toBeVisible()
  139 |   })
  140 | })
  141 | 
```