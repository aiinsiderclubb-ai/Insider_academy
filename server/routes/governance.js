import crypto from 'crypto'
import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireUser } from '../middleware/auth.js'

const router = Router()
router.use(requireUser)

router.use(async (req, res, next) => {
  if (process.env.FEATURE_GOVERNANCE !== 'true') return res.status(404).json({ error: 'Not found' })
  const agency = await getDb().get(
    `SELECT id FROM entitlements WHERE user_id = ? AND license_tier = 'agency'
     AND status = 'active' AND (expires_at IS NULL OR expires_at > ?) LIMIT 1`,
    [req.userId, new Date().toISOString()]
  )
  if (!agency) return res.status(403).json({ error: 'Governance beta requires an Agency license' })
  next()
})

router.get('/dashboard', async (req, res) => {
  const db = getDb()
  const [deployments, evalRuns, incidents] = await Promise.all([
    db.all(
      `SELECT id, product_id AS productId, status, latency_ms AS latencyMs,
       cost_eur AS costEur, error_code AS errorCode, created_at AS createdAt,
       updated_at AS updatedAt FROM agent_deployments
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.userId]
    ),
    db.all(
      `SELECT r.id, r.suite_id AS suiteId, r.deployment_id AS deploymentId,
       r.passed, r.score, r.created_at AS createdAt, s.name
       FROM eval_runs r JOIN eval_suites s ON s.id = r.suite_id
       WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 50`,
      [req.userId]
    ),
    db.all(
      `SELECT id, deployment_id AS deploymentId, severity, status, title,
       created_at AS createdAt, updated_at AS updatedAt FROM incidents
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.userId]
    ),
  ])
  res.json({
    deployments,
    evalRuns: evalRuns.map((run) => ({ ...run, passed: Boolean(run.passed) })),
    incidents,
    summary: {
      healthy: deployments.filter((item) => item.status === 'succeeded').length,
      failed: deployments.filter((item) => item.status === 'failed').length,
      openIncidents: incidents.filter((item) => item.status !== 'resolved').length,
      evalPassRate: evalRuns.length
        ? Math.round((evalRuns.filter((item) => item.passed).length / evalRuns.length) * 100)
        : null,
    },
  })
})

router.get('/eval-suites', async (req, res) => {
  const rows = await getDb().all(
    `SELECT DISTINCT s.id, s.product_id AS productId, s.version, s.name,
     s.pass_threshold AS passThreshold
     FROM eval_suites s JOIN entitlements e ON e.product_id = s.product_id
     WHERE e.user_id = ? AND e.status = 'active' AND s.active = 1`,
    [req.userId]
  )
  res.json(rows)
})

function evaluateCase(testCase, deployment) {
  const value = {
    deployment_status: deployment.status,
    latency_ms: deployment.latency_ms,
    error_code: deployment.error_code,
  }[testCase.metric]
  if (testCase.operator === 'equals') return value === testCase.expected
  if (testCase.operator === 'less_than') return Number(value) < Number(testCase.expected)
  if (testCase.operator === 'empty') return value == null || value === ''
  return false
}

router.post('/eval-runs', async (req, res) => {
  const db = getDb()
  const suite = await db.get(
    `SELECT s.* FROM eval_suites s JOIN entitlements e ON e.product_id = s.product_id
     WHERE s.id = ? AND e.user_id = ? AND e.status = 'active' AND s.active = 1 LIMIT 1`,
    [req.body.suiteId, req.userId]
  )
  const deployment = await db.get(
    'SELECT * FROM agent_deployments WHERE id = ? AND user_id = ?',
    [req.body.deploymentId, req.userId]
  )
  if (!suite || !deployment) return res.status(404).json({ error: 'Suite or deployment not found' })
  const cases = parseJson(suite.dataset, {}).cases || []
  const results = cases.map((testCase) => ({
    id: testCase.id,
    passed: evaluateCase(testCase, deployment),
    weight: Number(testCase.weight || 0),
  }))
  const totalWeight = results.reduce((sum, item) => sum + item.weight, 0) || 1
  const score = results.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0) / totalWeight
  const passed = score >= Number(suite.pass_threshold)
  const id = `eval-${crypto.randomUUID()}`
  const report = {
    suiteVersion: suite.version,
    deploymentId: deployment.id,
    threshold: Number(suite.pass_threshold),
    score,
    results,
  }
  await db.run(
    `INSERT INTO eval_runs
     (id, suite_id, deployment_id, user_id, passed, score, report, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, suite.id, deployment.id, req.userId, passed ? 1 : 0, score, JSON.stringify(report), new Date().toISOString()]
  )
  res.status(201).json({ id, passed, score, report })
})

router.get('/eval-runs/:id/report', async (req, res) => {
  const row = await getDb().get(
    'SELECT report FROM eval_runs WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  )
  if (!row) return res.status(404).json({ error: 'Evaluation report not found' })
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.json"`)
  res.type('application/json').send(JSON.stringify(parseJson(row.report, {}), null, 2))
})

router.post('/incidents', async (req, res) => {
  const severity = String(req.body.severity || '')
  const title = String(req.body.title || '').trim()
  if (!['low', 'medium', 'high', 'critical'].includes(severity) || !title) {
    return res.status(400).json({ error: 'Valid severity and title are required' })
  }
  if (req.body.deploymentId) {
    const owned = await getDb().get(
      'SELECT id FROM agent_deployments WHERE id = ? AND user_id = ?',
      [req.body.deploymentId, req.userId]
    )
    if (!owned) return res.status(403).json({ error: 'Deployment does not belong to this account' })
  }
  const id = `inc-${crypto.randomUUID()}`
  const now = new Date().toISOString()
  await getDb().run(
    `INSERT INTO incidents
     (id, user_id, deployment_id, severity, status, title, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?)`,
    [
      id, req.userId, req.body.deploymentId || null, severity, title,
      String(req.body.description || '').slice(0, 5000), now, now,
    ]
  )
  await getDb().run(
    `INSERT INTO audit_log (id, actor_email, action, target_type, target_id, meta, created_at)
     VALUES (?, ?, 'incident.create', 'incident', ?, ?, ?)`,
    [
      `audit-${crypto.randomUUID()}`, `user:${req.userId}`, id,
      JSON.stringify({ severity, deploymentId: req.body.deploymentId || null }), now,
    ]
  )
  res.status(201).json({ id, status: 'open' })
})

router.patch('/incidents/:id', async (req, res) => {
  const status = String(req.body.status || '')
  if (!['open', 'investigating', 'contained', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid incident status' })
  }
  await getDb().run(
    `UPDATE incidents SET status = ?, resolution = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [status, String(req.body.resolution || '').slice(0, 5000), new Date().toISOString(), req.params.id, req.userId]
  )
  await getDb().run(
    `INSERT INTO audit_log (id, actor_email, action, target_type, target_id, meta, created_at)
     VALUES (?, ?, 'incident.update', 'incident', ?, ?, ?)`,
    [
      `audit-${crypto.randomUUID()}`, `user:${req.userId}`, req.params.id,
      JSON.stringify({ status }), new Date().toISOString(),
    ]
  )
  res.json({ id: req.params.id, status })
})

export default router
