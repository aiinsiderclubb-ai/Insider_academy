import crypto from 'crypto'
import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { encryptApiKey, n8nRequest, prepareWorkflow, validateN8nUrl } from '../services/n8n.js'

const router = Router()
router.use(requireUser)

function enabled() {
  return process.env.FEATURE_N8N_DEPLOY === 'true'
}

function requireEnabled(_req, res, next) {
  if (!enabled()) return res.status(404).json({ error: 'Not found' })
  next()
}

router.use(requireEnabled)

router.get('/connections', async (req, res) => {
  const rows = await getDb().all(
    'SELECT id, instance_url AS instanceUrl, status, created_at AS createdAt, updated_at AS updatedAt FROM n8n_connections WHERE user_id = ?',
    [req.userId]
  )
  res.json(rows)
})

router.post('/connections', async (req, res) => {
  try {
    const instanceUrl = await validateN8nUrl(req.body.instanceUrl)
    const encrypted = encryptApiKey(req.body.apiKey)
    const id = `n8nc-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    const row = {
      instance_url: instanceUrl,
      encrypted_api_key: encrypted.encrypted,
      key_iv: encrypted.iv,
      key_tag: encrypted.tag,
    }
    await n8nRequest(row, '/workflows?limit=1')
    await getDb().run(
      `INSERT INTO n8n_connections
       (id, user_id, instance_url, encrypted_api_key, key_iv, key_tag, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [id, req.userId, instanceUrl, encrypted.encrypted, encrypted.iv, encrypted.tag, now, now]
    )
    res.status(201).json({ id, instanceUrl, status: 'active' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/connections/:id/test', async (req, res) => {
  const connection = await getDb().get(
    'SELECT * FROM n8n_connections WHERE id = ? AND user_id = ? AND status = ?',
    [req.params.id, req.userId, 'active']
  )
  if (!connection) return res.status(404).json({ error: 'Connection not found' })
  try {
    const result = await n8nRequest(connection, '/workflows?limit=1')
    res.json({ ok: true, workflowCount: Array.isArray(result.data) ? result.data.length : 0 })
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message })
  }
})

router.delete('/connections/:id', async (req, res) => {
  await getDb().run(
    `UPDATE n8n_connections SET status = 'revoked', encrypted_api_key = '',
     key_iv = '', key_tag = '', updated_at = ? WHERE id = ? AND user_id = ?`,
    [new Date().toISOString(), req.params.id, req.userId]
  )
  res.status(204).end()
})

router.patch('/connections/:id/rotate', async (req, res) => {
  const db = getDb()
  const current = await db.get(
    'SELECT * FROM n8n_connections WHERE id = ? AND user_id = ? AND status = ?',
    [req.params.id, req.userId, 'active']
  )
  if (!current) return res.status(404).json({ error: 'Connection not found' })
  try {
    const encrypted = encryptApiKey(req.body.apiKey)
    const candidate = {
      ...current,
      encrypted_api_key: encrypted.encrypted,
      key_iv: encrypted.iv,
      key_tag: encrypted.tag,
    }
    await n8nRequest(candidate, '/workflows?limit=1')
    await db.run(
      `UPDATE n8n_connections SET encrypted_api_key = ?, key_iv = ?, key_tag = ?,
       updated_at = ? WHERE id = ? AND user_id = ?`,
      [encrypted.encrypted, encrypted.iv, encrypted.tag, new Date().toISOString(), current.id, req.userId]
    )
    res.json({ id: current.id, rotated: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

async function deploymentContext(userId, productId, connectionId) {
  const db = getDb()
  const entitlement = await db.get(
    `SELECT id FROM entitlements WHERE user_id = ? AND product_id = ? AND status = 'active'
     AND (expires_at IS NULL OR expires_at > ?) LIMIT 1`,
    [userId, productId, new Date().toISOString()]
  )
  if (!entitlement) throw Object.assign(new Error('Active product entitlement required'), { status: 403 })
  const version = await db.get(
    `SELECT * FROM product_versions WHERE product_id = ? AND status = 'published'
     AND deploy_manifest IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
    [productId]
  )
  if (!version) throw Object.assign(new Error('No deployable product version'), { status: 409 })
  const connection = await db.get(
    'SELECT * FROM n8n_connections WHERE id = ? AND user_id = ? AND status = ?',
    [connectionId, userId, 'active']
  )
  if (!connection) throw Object.assign(new Error('Connection not found'), { status: 404 })
  return { db, version, connection, manifest: parseJson(version.deploy_manifest, {}) }
}

router.post('/preview', async (req, res) => {
  try {
    const { manifest, version } = await deploymentContext(req.userId, req.body.productId, req.body.connectionId)
    res.json({
      productId: req.body.productId,
      version: version.version,
      requiredCredentials: manifest.requiredCredentials || [],
      requiredNodes: manifest.requiredNodes || [],
      diff: {
        action: 'create',
        workflowName: manifest.workflow?.name || manifest.name || req.body.productId,
        nodeCount: manifest.workflow?.nodes?.length || 0,
      },
    })
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

async function executeDeployment(deploymentId, credentialMapping = {}) {
  const db = getDb()
  const deployment = await db.get('SELECT * FROM agent_deployments WHERE id = ?', [deploymentId])
  if (!deployment) return
  const connection = await db.get('SELECT * FROM n8n_connections WHERE id = ?', [deployment.connection_id])
  const version = await db.get('SELECT * FROM product_versions WHERE id = ?', [deployment.product_version_id])
  const started = Date.now()
  try {
    const manifest = parseJson(version.deploy_manifest, {})
    const workflow = prepareWorkflow(manifest, credentialMapping)
    const remote = await n8nRequest(connection, '/workflows', { method: 'POST', body: workflow })
    const now = new Date().toISOString()
    await db.run(
      `UPDATE agent_deployments SET status = 'succeeded', remote_workflow_id = ?,
       latency_ms = ?, error_code = NULL, error_message = NULL, updated_at = ? WHERE id = ?`,
      [String(remote.id || remote.data?.id || ''), Date.now() - started, now, deploymentId]
    )
    await db.run(
      'INSERT INTO deployment_events (id, deployment_id, event_name, details, created_at) VALUES (?, ?, ?, ?, ?)',
      [`de-${crypto.randomUUID()}`, deploymentId, 'succeeded', JSON.stringify({ latencyMs: Date.now() - started }), now]
    )
  } catch (err) {
    const now = new Date().toISOString()
    await db.run(
      `UPDATE agent_deployments SET status = 'failed', error_code = 'DEPLOY_FAILED',
       error_message = ?, latency_ms = ?, updated_at = ? WHERE id = ?`,
      [String(err.message || 'Deploy failed').slice(0, 500), Date.now() - started, now, deploymentId]
    )
    await db.run(
      'INSERT INTO deployment_events (id, deployment_id, event_name, details, created_at) VALUES (?, ?, ?, ?, ?)',
      [`de-${crypto.randomUUID()}`, deploymentId, 'failed', JSON.stringify({ code: 'DEPLOY_FAILED' }), now]
    )
  }
}

router.post('/deployments', async (req, res) => {
  try {
    const context = await deploymentContext(req.userId, req.body.productId, req.body.connectionId)
    prepareWorkflow(context.manifest, req.body.credentialMapping || {})
    const id = `dep-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    await context.db.run(
      `INSERT INTO agent_deployments
       (id, user_id, product_id, product_version_id, connection_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)`,
      [id, req.userId, req.body.productId, context.version.id, req.body.connectionId, now, now]
    )
    await context.db.run(
      'INSERT INTO deployment_events (id, deployment_id, event_name, details, created_at) VALUES (?, ?, ?, ?, ?)',
      [`de-${crypto.randomUUID()}`, id, 'queued', JSON.stringify({ version: context.version.version }), now]
    )
    setImmediate(() => executeDeployment(id, req.body.credentialMapping || {}))
    res.status(202).json({ id, status: 'queued' })
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

router.get('/deployments', async (req, res) => {
  const rows = await getDb().all(
    `SELECT id, product_id AS productId, status, remote_workflow_id AS remoteWorkflowId,
     error_code AS errorCode, error_message AS errorMessage, latency_ms AS latencyMs,
     created_at AS createdAt, updated_at AS updatedAt
     FROM agent_deployments WHERE user_id = ? ORDER BY created_at DESC`,
    [req.userId]
  )
  res.json(rows)
})

router.post('/deployments/:id/retry', async (req, res) => {
  const deployment = await getDb().get(
    'SELECT id FROM agent_deployments WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  )
  if (!deployment) return res.status(404).json({ error: 'Deployment not found' })
  await getDb().run(
    `UPDATE agent_deployments SET status = 'queued', error_code = NULL,
     error_message = NULL, updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), req.params.id]
  )
  setImmediate(() => executeDeployment(req.params.id, req.body.credentialMapping || {}))
  res.status(202).json({ id: req.params.id, status: 'queued' })
})

router.post('/deployments/:id/rollback', async (req, res) => {
  const db = getDb()
  const deployment = await db.get(
    'SELECT * FROM agent_deployments WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  )
  if (!deployment) return res.status(404).json({ error: 'Deployment not found' })
  if (deployment.remote_workflow_id) {
    const connection = await db.get(
      'SELECT * FROM n8n_connections WHERE id = ? AND user_id = ?',
      [deployment.connection_id, req.userId]
    )
    try {
      await n8nRequest(connection, `/workflows/${encodeURIComponent(deployment.remote_workflow_id)}`, { method: 'DELETE' })
    } catch (err) {
      return res.status(502).json({ error: err.message })
    }
  }
  await db.run(
    "UPDATE agent_deployments SET status = 'rolled_back', updated_at = ? WHERE id = ?",
    [new Date().toISOString(), deployment.id]
  )
  res.json({ id: deployment.id, status: 'rolled_back' })
})

export default router
