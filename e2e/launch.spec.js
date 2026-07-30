import { test, expect } from '@playwright/test'
import { apiRegisterAndVerify } from './helpers.js'

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

  test('register → verify → login → courses stay locked in prelaunch', async ({ request }) => {
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
    for (const course of list) {
      expect(course.contentLocked).toBe(true)
      for (const lesson of course.lessons || []) expect(lesson.videoUrl).toBeNull()
    }
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

  test('purchases and tribute webhook are blocked in prelaunch', async ({ request }) => {
    const email = `tribute-${Date.now()}@example.com`
    const password = 'TributeTest2026!'
    const { token, base } = await apiRegisterAndVerify(request, { email, password })

    const wh = await request.post(`${base}/webhooks/tribute`, {
      data: { name: 'new_digital_product', payload: { email } },
    })
    expect(wh.status()).toBe(423)
    const whBody = await wh.json()
    expect(whBody.code).toBe('PRELAUNCH_MODE')

    const purchase = await request.post(`${base}/me/purchases`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { courseId: 'ai-start' },
    })
    expect(purchase.status()).toBe(404)
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

  test('giveaway registration returns after email verification', async ({ page }) => {
    const email = `giveaway-return-${Date.now()}@example.com`
    const password = 'GiveawayReturn2026!'

    await page.goto('/giveaway/claude-pro')
    const registerLink = page.locator('a[href^="/register?returnTo="]').last()
    await expect(registerLink).toBeVisible({ timeout: 15000 })
    await registerLink.click()
    await expect(page).toHaveURL(/\/register\?returnTo=/)

    await page.locator('input[name="name"]').fill('Giveaway Return')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('input[name="confirmPassword"]').fill(password)
    await page.locator('form button[type="submit"]').click()

    await expect(page).toHaveURL(/\/verify-email\?/, { timeout: 15000 })
    const verificationUrl = new URL(page.url())
    expect(verificationUrl.searchParams.get('returnTo')).toBe('/ru/giveaway/claude-pro')
    const code = verificationUrl.searchParams.get('devCode')
    expect(code).toMatch(/^\d{6}$/)

    for (const [index, digit] of [...code].entries()) {
      await page.getByLabel(`Digit ${index + 1}`).fill(digit)
    }
    await page.locator('form button[type="submit"]').click()
    await expect(page).toHaveURL(/\/giveaway\/claude-pro$/, { timeout: 10000 })
  })
})
