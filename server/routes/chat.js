import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { chatCompletion } from '../services/openai.js'

const router = Router()

router.post('/', requireUser, async (req, res) => {
  const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-12) : []
  const result = await chatCompletion(messages)
  res.json(result)
})

export default router
