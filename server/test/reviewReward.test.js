import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const dbPath = path.join(os.tmpdir(), `lms-reward-${Date.now()}.sqlite`)
process.env.DATABASE_URL = ''
process.env.LMS_TEST_DB = dbPath
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.ADMIN_JWT_SECRET = 'test-admin-jwt'

const { initDatabase } = await import('../db/index.js')
const { validatePromoCode } = await import('../services/promoCodes.js')
const {
  issueReviewReward, reviewRewardCode, rememberPromoForPayment, consumePromoForPayment,
  REVIEW_REWARD_PERCENT, REVIEW_REWARD_DAYS,
} = await import('../services/reviewReward.js')
const { renderTemplate: renderEmail } = await import('../services/emailPurchase.js')

const db = await initDatabase()
test.after(() => fs.rmSync(dbPath, { force: true }))

test('a review is rewarded once per buyer and purchase', async () => {
  const first = await issueReviewReward(db, { userId: 7, itemId: 'first-automation-n8n' })
  assert.equal(first.created, true)
  assert.match(first.code, /^THANKS-[0-9A-F]{8}$/)

  // A second review of the same purchase lands on the same code, not a new discount.
  const again = await issueReviewReward(db, { userId: 7, itemId: 'first-automation-n8n' })
  assert.equal(again.created, false)
  assert.equal(again.code, first.code)

  // Another purchase, or another buyer, is a different reward.
  assert.notEqual(reviewRewardCode(7, 'ai-agent-engineer'), first.code)
  assert.notEqual(reviewRewardCode(8, 'first-automation-n8n'), first.code)
})

test('the reward is ten percent off anything, for thirty days', async () => {
  const { code, validUntil } = await issueReviewReward(db, { userId: 9, itemId: 'ai-content-creator' })
  const days = (new Date(validUntil).getTime() - Date.now()) / 86_400_000
  assert.ok(days > REVIEW_REWARD_DAYS - 0.01 && days <= REVIEW_REWARD_DAYS)

  // Not tied to the item that was reviewed: a course and a store product both take it.
  const onCourse = await validatePromoCode({ code, courseId: 'ai-agent-engineer', amountEur: 79 })
  assert.equal(onCourse.valid, true)
  assert.equal(onCourse.discountPercent, REVIEW_REWARD_PERCENT)
  assert.equal(onCourse.finalEur, 71)
  const onProduct = await validatePromoCode({ code: code.toLowerCase(), courseId: 'mp-prompt-chatgpt-vault', amountEur: 29 })
  assert.equal(onProduct.valid, true)
  assert.equal(onProduct.finalEur, 26)
})

test('the code is spent when the payment settles, not when checkout opens', async () => {
  const { code } = await issueReviewReward(db, { userId: 11, itemId: 'ai-start' })
  await rememberPromoForPayment(db, 'trib-1', code)

  // An abandoned pay page leaves the single-use code intact.
  assert.equal((await validatePromoCode({ code, courseId: 'x', amountEur: 50 })).valid, true)

  assert.equal(await consumePromoForPayment('trib-1', db), code)
  assert.equal((await validatePromoCode({ code, courseId: 'x', amountEur: 50 })).valid, false)

  // A webhook delivered twice does not spend anything a second time.
  assert.equal(await consumePromoForPayment('trib-1', db), null)
  assert.equal(await consumePromoForPayment('trib-without-promo', db), null)
})

test('the thank-you email carries the purchase and the review offer in each language', () => {
  for (const locale of ['ru', 'ukr', 'en']) {
    const mail = renderEmail('purchase_thanks', {
      to: 'buyer@example.com', locale, name: 'Vlad', prelaunch: false,
      itemId: 'mp-prompt-chatgpt-vault', itemTitle: 'ChatGPT Prompt Vault', itemSlug: 'chatgpt-prompt-vault', itemKind: 'product',
    })
    assert.ok(mail.subject.includes('ChatGPT Prompt Vault'), locale)
    assert.ok(mail.html.includes(`/${locale}/store/chatgpt-prompt-vault`), `${locale}: link to the purchase`)
    assert.ok(mail.html.includes(`/${locale}/review?item=mp-prompt-chatgpt-vault`), `${locale}: link to the review form`)
    assert.ok(mail.text.includes('10%'), `${locale}: the offer is in the plain-text part too`)
    assert.equal(mail.marketing, false)
  }
  const course = renderEmail('purchase_thanks', { to: 'b@example.com', locale: 'ru', itemId: 'ai-agent-engineer', itemTitle: 'AI Agent Engineer', itemSlug: 'ai-agent-engineer', itemKind: 'course' })
  assert.ok(course.html.includes('/ru/learn/ai-agent-engineer'))
})

test('the reward email shows the code and when it runs out', () => {
  const mail = renderEmail('review_reward', { to: 'b@example.com', locale: 'ru', code: 'THANKS-4F2A9C1E', validUntil: '2026-11-07T10:00:00.000Z' })
  assert.ok(mail.html.includes('THANKS-4F2A9C1E'))
  assert.ok(mail.text.includes('THANKS-4F2A9C1E'))
  assert.ok(mail.text.includes('7 ноября 2026'))
})
