import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { trustWebProxyClientIp } from '../middleware/clientIp.js'

const SECRET = 'web-proxy-secret-for-tests-only-0123456789'

/** A request whose `ip` is a prototype getter, the way Express defines it. */
function fakeRequest(headers) {
  const req = Object.create({ get ip() { return '10.0.0.1' } })
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
  req.get = (name) => lower[name.toLowerCase()]
  return req
}

function run(headers) {
  const req = fakeRequest(headers)
  let called = false
  trustWebProxyClientIp(req, {}, () => { called = true })
  assert.ok(called, 'the middleware always passes the request on')
  return req.ip
}

test('client IP: trusted only with the shared secret', async (t) => {
  const previous = process.env.WEB_PROXY_SECRET
  t.after(() => {
    if (previous === undefined) delete process.env.WEB_PROXY_SECRET
    else process.env.WEB_PROXY_SECRET = previous
  })

  delete process.env.WEB_PROXY_SECRET
  assert.equal(
    run({ 'x-client-ip': '203.0.113.7', 'x-web-proxy-secret': SECRET }),
    '10.0.0.1',
    'with no secret configured nothing changes — safe to deploy before either side has it'
  )

  process.env.WEB_PROXY_SECRET = SECRET
  assert.equal(run({ 'x-client-ip': '203.0.113.7', 'x-web-proxy-secret': SECRET }), '203.0.113.7')
  assert.equal(run({ 'x-client-ip': '2001:db8::1', 'x-web-proxy-secret': SECRET }), '2001:db8::1', 'IPv6 is accepted')

  assert.equal(run({ 'x-client-ip': '203.0.113.7', 'x-web-proxy-secret': 'guess' }), '10.0.0.1', 'a wrong secret is ignored')
  assert.equal(run({ 'x-client-ip': '203.0.113.7' }), '10.0.0.1', 'a missing secret is ignored')
  assert.equal(run({ 'x-web-proxy-secret': SECRET }), '10.0.0.1', 'a missing address is ignored')
  assert.equal(
    run({ 'x-client-ip': '203.0.113.7, 10.0.0.9', 'x-web-proxy-secret': SECRET }),
    '10.0.0.1',
    'a list is not an address'
  )
  assert.equal(run({ 'x-client-ip': 'not-an-ip', 'x-web-proxy-secret': SECRET }), '10.0.0.1')
})

test('client IP: the Studio login limit is per visitor, not per front end', async (t) => {
  const tmpDb = path.join(os.tmpdir(), `lms-clientip-${Date.now()}.sqlite`)
  process.env.DATABASE_URL = ''
  process.env.LMS_TEST_DB = tmpDb
  process.env.UPLOADS_DIR = path.join(os.tmpdir(), 'lms-test-uploads')
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt'
  process.env.ADMIN_PASSWORD = 'AdminTest-2026-Only!'
  process.env.EDITOR_PASSWORD = 'EditorTest-2026-Only!'
  process.env.MODERATOR_PASSWORD = 'ModeratorTest-2026!'
  process.env.CORS_ORIGIN = 'http://localhost:5173'
  process.env.WEB_PROXY_SECRET = SECRET

  const { resetDatabase } = await import('../db/index.js')
  resetDatabase()
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
    instance.once('error', reject)
  })
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(() => new Promise((resolve) => {
    delete process.env.WEB_PROXY_SECRET
    server.close(resolve)
    fs.unlinkSync(tmpDb)
  }))

  const attempt = (ip) => fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-client-ip': ip, 'x-web-proxy-secret': SECRET },
    body: JSON.stringify({ password: 'definitely-wrong-password' }),
  }).then((r) => r.status)

  // The limit is five a quarter hour. Burn it for one visitor…
  for (let i = 0; i < 5; i++) assert.equal(await attempt('198.51.100.1'), 401)
  assert.equal(await attempt('198.51.100.1'), 429, 'the sixth try from the same visitor is refused')

  // …and a different visitor, arriving through the same front end, is unaffected.
  assert.equal(await attempt('198.51.100.2'), 401, 'another visitor still gets a normal answer, not a lockout')
})
