import { useState } from 'react'
import { api } from '../api/client'
import { formatApiError } from '../utils/formatApiError'
import styles from '../pages/CourseBuy.module.css'

export function PromoCodeInput({ courseId, amountEur, lang, onApplied }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(null)

  const handleApply = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await api.validatePromo({ code, courseId, amountEur })
      setApplied(result)
      onApplied?.(result)
    } catch (err) {
      setApplied(null)
      onApplied?.(null)
      if (err.status === 404) {
        setError(lang === 'ru' ? 'Промокоды временно недоступны. Оплатите без промокода.' : 'Promo codes unavailable. Pay without a promo.')
      } else {
        setError(formatApiError(err, lang) || (lang === 'ru' ? 'Промокод недействителен' : 'Invalid promo'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.promoRow}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={lang === 'ru' ? 'Промокод' : 'Promo code'}
        className={styles.promoInput}
        disabled={loading}
      />
      <button type="button" className={styles.promoBtn} onClick={handleApply} disabled={loading || !code.trim()}>
        {loading ? '…' : lang === 'ru' ? 'Применить' : 'Apply'}
      </button>
      {applied?.valid && (
        <p className={styles.promoOk}>
          {lang === 'ru'
            ? `Скидка −${applied.discountEur} € → ${applied.finalEur} €`
            : `Discount −${applied.discountEur} € → ${applied.finalEur} €`}
        </p>
      )}
      {error && <p className={styles.promoErr}>{error}</p>}
    </div>
  )
}
