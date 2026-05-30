import { Router } from 'express'
import { resolveLocalFile } from '../services/storage.js'

const router = Router()

router.get('/:key(*)', (req, res) => {
  const key = decodeURIComponent(req.params.key)
  const filePath = resolveLocalFile(key)
  if (!filePath) return res.status(404).json({ error: 'Not found' })
  res.sendFile(filePath)
})

export default router
