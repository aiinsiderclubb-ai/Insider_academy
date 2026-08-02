import crypto from 'crypto'
import dns from 'dns/promises'
import net from 'net'

function encryptionKey() {
  const source = process.env.N8N_CREDENTIALS_ENCRYPTION_KEY
  if (!source && process.env.NODE_ENV === 'production') throw new Error('N8N credential encryption is not configured')
  return crypto.createHash('sha256').update(source || 'development-only-key').digest()
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number)
    return parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 0
  }
  const normalized = ip.toLowerCase()
  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')
}

export async function validateN8nUrl(rawUrl) {
  const url = new URL(String(rawUrl || ''))
  const allowHttp = process.env.NODE_ENV !== 'production' && process.env.N8N_ALLOW_HTTP === 'true'
  if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) throw new Error('n8n URL must use HTTPS')
  if (url.username || url.password || url.pathname !== '/' && url.pathname !== '') throw new Error('Use only the n8n instance origin')
  const records = await dns.lookup(url.hostname, { all: true })
  if (!records.length || records.some((record) => isPrivateIp(record.address))) throw new Error('Private or unresolved n8n hosts are not allowed')
  return url.origin
}

export function encryptApiKey(apiKey) {
  if (!apiKey || String(apiKey).length < 16) throw new Error('A valid n8n API key is required')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(String(apiKey), 'utf8'), cipher.final()])
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  }
}

export function decryptApiKey({ encrypted, iv, tag }) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

export async function n8nRequest(connection, path, { method = 'GET', body } = {}) {
  const origin = await validateN8nUrl(connection.instance_url)
  const apiKey = decryptApiKey({
    encrypted: connection.encrypted_api_key,
    iv: connection.key_iv,
    tag: connection.key_tag,
  })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(`${origin}/api/v1${path}`, {
      method,
      headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
      redirect: 'error',
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(`n8n API returned ${response.status}`)
    return data
  } finally {
    clearTimeout(timeout)
  }
}

export function prepareWorkflow(manifest, credentialMapping = {}) {
  const workflow = structuredClone(manifest.workflow || manifest)
  const requiredCredentials = manifest.requiredCredentials || []
  for (const requirement of requiredCredentials) {
    if (!credentialMapping[requirement.key]) throw new Error(`Missing credential mapping: ${requirement.key}`)
  }
  const serialized = JSON.stringify(workflow)
  if (/api[_-]?key|secret|password/i.test(serialized)) {
    throw new Error('Workflow manifest appears to contain embedded secrets')
  }
  return workflow
}
