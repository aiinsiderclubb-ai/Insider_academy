import { Router } from 'express'
import { validatePromoCode } from '../services/promoCodes.js'

const router = Router()

router.post('/validate', async (req, res) => {
  const { code, courseId, amountEur } = req.body
  const result = await validatePromoCode({ code, courseId, amountEur: Number(amountEur) || 0 })
  if (!result.valid) return res.status(400).json(result)
  res.json(result)
})

export default router
