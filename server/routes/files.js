import { Router } from 'express'
import { resolveLocalFile, verifyLocalFileSignature } from '../services/storage.js'

const router = Router()

router.get('/*key', (req, res) => {
  const rawKey = Array.isArray(req.params.key) ? req.params.key.join('/') : req.params.key
  let key
  try {
    key = decodeURIComponent(rawKey)
  } catch {
    return res.status(400).json({ error: 'Invalid file key' })
  }
  if (!verifyLocalFileSignature(key, req.query.expires, req.query.signature)) {
    return res.status(403).json({ error: 'Invalid or expired file link' })
  }
  const filePath = resolveLocalFile(key)
  if (!filePath) return res.status(404).json({ error: 'Not found' })
  res.set('X-Content-Type-Options', 'nosniff')
  res.sendFile(filePath)
})

export default router
