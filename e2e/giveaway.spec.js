import { test, expect } from '@playwright/test'
import { apiRegisterAndVerify, linkTelegramForE2E, authHeaders } from './helpers.js'

const apiBase = () => process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api'
const SLUG = 'claude-pro'

test.describe('Giveaway enter / share / referral (API)', () => {
  test('enter → share → referral bonuses', async ({ request }) => {
    const stamp = Date.now()
    const password = 'GiveawayFlow2026!'

    const referrer = await apiRegisterAndVerify(request, {
      email: `giveaway-ref-${stamp}@example.com`,
      password,
      name: 'Giveaway Referrer',
    })
    await linkTelegramForE2E(request, referrer.token, `9${String(stamp).slice(-9)}`)

    const enter = await request.post(`${apiBase()}/giveaways/${SLUG}/enter`, {
      headers: authHeaders(referrer.token),
      data: {},
    })
    expect(enter.status(), await enter.text()).toBe(201)
    const enteredBody = await enter.json()
    expect(enteredBody.entered).toBe(true)
    expect(enteredBody.telegramConnected).toBe(true)
    expect(enteredBody.channelSubscribed).toBe(true)
    expect(enteredBody.chances).toBeGreaterThanOrEqual(2)

    const share = await request.post(`${apiBase()}/giveaways/${SLUG}/share`, {
      headers: authHeaders(referrer.token),
      data: {},
    })
    expect([200, 201]).toContain(share.status())
    const shareBody = await share.json()
    expect(shareBody.shared).toBe(true)
    expect(shareBody.chances).toBeGreaterThanOrEqual(enteredBody.chances + 2)

    const shareAgain = await request.post(`${apiBase()}/giveaways/${SLUG}/share`, {
      headers: authHeaders(referrer.token),
      data: {},
    })
    expect(shareAgain.ok()).toBeTruthy()
    const shareAgainBody = await shareAgain.json()
    expect(shareAgainBody.alreadyRecorded).toBe(true)
    expect(shareAgainBody.chances).toBe(shareBody.chances)

    const referralCode = referrer.user.personalId || `U${referrer.user.id}`
    expect(referralCode).toBeTruthy()

    const friend = await apiRegisterAndVerify(request, {
      email: `giveaway-friend-${stamp}@example.com`,
      password,
      name: 'Giveaway Friend',
    })
    await linkTelegramForE2E(request, friend.token, `8${String(stamp).slice(-9)}`)

    const friendEnter = await request.post(`${apiBase()}/giveaways/${SLUG}/enter`, {
      headers: authHeaders(friend.token),
      data: { referralCode },
    })
    expect(friendEnter.status(), await friendEnter.text()).toBe(201)
    const friendBody = await friendEnter.json()
    expect(friendBody.entered).toBe(true)
    expect(friendBody.referralApplied).toBe(true)

    const referrerState = await request.get(`${apiBase()}/giveaways/${SLUG}`, {
      headers: authHeaders(referrer.token),
    })
    expect(referrerState.ok()).toBeTruthy()
    const refState = await referrerState.json()
    expect(refState.referralCount).toBeGreaterThanOrEqual(1)
    expect(refState.chances).toBeGreaterThanOrEqual(shareBody.chances + 3)

    const reenter = await request.post(`${apiBase()}/giveaways/${SLUG}/enter`, {
      headers: authHeaders(referrer.token),
      data: {},
    })
    expect(reenter.ok()).toBeTruthy()
    const reenterBody = await reenter.json()
    expect(reenterBody.alreadyEntered).toBe(true)
  })

  test('enter blocked without telegram link', async ({ request }) => {
    const { token } = await apiRegisterAndVerify(request, {
      email: `giveaway-nolink-${Date.now()}@example.com`,
      password: 'GiveawayNoLink2026!',
    })
    const enter = await request.post(`${apiBase()}/giveaways/${SLUG}/enter`, {
      headers: authHeaders(token),
      data: {},
    })
    expect(enter.status()).toBe(400)
    const body = await enter.json()
    expect(String(body.errorRu || body.error)).toMatch(/Telegram/i)
  })
})

test.describe('Giveaway UI guest → return', () => {
  test('guest CTA returns to giveaway after verify', async ({ page }) => {
    const email = `giveaway-ui-${Date.now()}@example.com`
    const password = 'GiveawayUi2026!'

    await page.goto(`/giveaway/${SLUG}`)
    const registerLink = page.locator('a[href^="/register?returnTo="]').last()
    await expect(registerLink).toBeVisible({ timeout: 15000 })
    await registerLink.click()
    await expect(page).toHaveURL(/\/register\?returnTo=/)

    await page.locator('input[name="name"]').fill('Giveaway UI')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('input[name="confirmPassword"]').fill(password)
    await page.locator('form button[type="submit"]').click()

    await expect(page).toHaveURL(/\/verify-email\?/, { timeout: 15000 })
    const verificationUrl = new URL(page.url())
    expect(verificationUrl.searchParams.get('returnTo')).toBe(`/giveaway/${SLUG}`)
    const code = verificationUrl.searchParams.get('devCode')
    expect(code).toMatch(/^\d{6}$/)

    for (const [index, digit] of [...code].entries()) {
      await page.getByLabel(`Digit ${index + 1}`).fill(digit)
    }
    await page.locator('form button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/giveaway/${SLUG}$`), { timeout: 10000 })

    await expect(page.getByRole('link', { name: /подключ|connect telegram/i }).or(
      page.getByText(/подключ.*telegram|connect telegram/i),
    ).first()).toBeVisible({ timeout: 15000 })
  })
})
