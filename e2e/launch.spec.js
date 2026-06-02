import { test, expect } from '@playwright/test'
import { tributeSignature, apiRegisterAndVerify } from './helpers.js'

const apiBase = () => process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api'

test.describe('Launch checklist (API)', () => {
  test('health + readiness', async ({ request }) => {
    const health = await request.get(`${apiBase()}/health`)
    expect(health.ok()).toBeTruthy()
    const body = await health.json()
    expect(body.ok).toBe(true)
    expect(body.db).toBeTruthy()

    const ready = await request.get(`${apiBase()}/health/ready`)
    expect(ready.ok()).toBeTruthy()
    const readyBody = await ready.json()
    expect(readyBody.ok).toBe(true)
  })

  test('register → verify → login → course access', async ({ request }) => {
    const email = `launch-${Date.now()}@example.com`
    const password = 'LaunchTest2026!'

    const { token, user, base } = await apiRegisterAndVerify(request, { email, password })
    expect(user.email).toBe(email)

    const login = await request.post(`${base}/auth/login`, { data: { email, password } })
    expect(login.ok()).toBeTruthy()

    const courses = await request.get(`${base}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(courses.ok()).toBeTruthy()
    const list = await courses.json()
    expect(Array.isArray(list)).toBeTruthy()
  })

  test('forgot-password → reset-password flow', async ({ request }) => {
    const email = `reset-${Date.now()}@example.com`
    const password = 'OldPass2026!'
    const newPassword = 'NewPass2026!'

    await apiRegisterAndVerify(request, { email, password })

    const forgot = await request.post(`${apiBase()}/auth/forgot-password`, { data: { email } })
    expect(forgot.ok()).toBeTruthy()
    const forgotBody = await forgot.json()
    expect(forgotBody.ok).toBe(true)

    let token = forgotBody.resetLink?.match(/token=([^&]+)/)?.[1]
    if (!token) {
      const dbTokenRes = await request.post(`${apiBase()}/auth/forgot-password`, { data: { email } })
      const body = await dbTokenRes.json()
      token = body.resetLink?.match(/token=([^&]+)/)?.[1]
    }
    expect(token).toBeTruthy()

    const reset = await request.post(`${apiBase()}/auth/reset-password`, {
      data: { token, password: newPassword },
    })
    expect(reset.ok()).toBeTruthy()

    const login = await request.post(`${apiBase()}/auth/login`, {
      data: { email, password: newPassword },
    })
    expect(login.ok()).toBeTruthy()
  })

  test('tribute webhook grants course access', async ({ request }) => {
    const tributeKey = process.env.TRIBUTE_API_KEY || 'ci-tribute-test-key-for-hmac-signing'
    const email = `tribute-${Date.now()}@example.com`
    const password = 'TributeTest2026!'
    const courseId = 'ai-start'
    const productId = 65858

    const { token, base } = await apiRegisterAndVerify(request, { email, password })

    const payload = {
      name: 'new_digital_product',
      payload: {
        product_id: productId,
        email,
        product_name: 'AI Start',
        amount: 2900,
      },
    }
    const raw = JSON.stringify(payload)
    const sig = tributeSignature(raw, tributeKey)

    const wh = await request.post(`${base}/webhooks/tribute`, {
      headers: {
        'Content-Type': 'application/json',
        'trbt-signature': sig,
      },
      data: raw,
    })
    expect(wh.ok()).toBeTruthy()
    const whBody = await wh.json()
    expect(whBody.ok).toBe(true)

    const me = await request.get(`${base}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(me.ok()).toBeTruthy()
    const profile = await me.json()
    const purchased = (profile.purchases || []).some((p) => p.id === courseId || p.courseId === courseId)
    expect(purchased || whBody.granted).toBeTruthy()
  })

  test('admin login rejects weak password', async ({ request }) => {
    const res = await request.post(`${apiBase()}/admin/login`, {
      data: { password: 'admin123' },
    })
    expect([401, 403]).toContain(res.status())
  })

  test('admin login with CI password', async ({ request }) => {
    const adminPass = process.env.ADMIN_PASSWORD
    test.skip(!adminPass || adminPass === 'admin123', 'ADMIN_PASSWORD not set for CI')
    const res = await request.post(`${apiBase()}/admin/login`, {
      data: { password: adminPass },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.token).toBeTruthy()
  })
})

test.describe('Launch checklist (UI)', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
  })

  test('login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })
})
