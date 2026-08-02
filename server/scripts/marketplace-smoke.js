const base = String(process.env.SMOKE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')
const token = process.env.SMOKE_USER_TOKEN

async function request(path, { auth = false } = {}) {
  const response = await fetch(`${base}${path}`, {
    headers: auth && token ? { Authorization: `Bearer ${token}` } : {},
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${path}: ${response.status} ${data.error || ''}`)
  return data
}

const health = await request('/health/ready')
if (!health.ok) throw new Error('Readiness check failed')

const catalog = await request('/marketplace/catalog')
if (!Array.isArray(catalog.products) || catalog.products.length === 0) {
  throw new Error('Marketplace catalog is empty')
}
for (const product of catalog.products) {
  if ('downloads' in product) throw new Error(`Unverified download counter leaked for ${product.id}`)
}

if (token) {
  const [entitlements, downloads] = await Promise.all([
    request('/marketplace/me/entitlements', { auth: true }),
    request('/marketplace/me/downloads', { auth: true }),
  ])
  if (!Array.isArray(entitlements) || !Array.isArray(downloads)) throw new Error('User marketplace endpoints failed')
}

console.log(JSON.stringify({
  ok: true,
  products: catalog.products.length,
  bundles: catalog.bundles?.length || 0,
  commerceEnabled: catalog.enabled,
}, null, 2))
