import { Router } from 'express'
import { resolveLocalFile } from '../services/storage.js'
import { prelaunchBlocked } from '../middleware/prelaunch.js'

const router = Router()

router.get('/*key', prelaunchBlocked, (req, res) => {
  const rawKey = Array.isArray(req.params.key) ? req.params.key.join('/') : req.params.key
  const key = decodeURIComponent(rawKey)
  const filePath = resolveLocalFile(key)
  if (!filePath) return res.status(404).json({ error: 'Not found' })
  res.sendFile(filePath)
})

export default router
