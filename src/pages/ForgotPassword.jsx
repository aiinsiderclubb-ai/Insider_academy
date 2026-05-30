import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import styles from './Login.module.css'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.forgotPassword(email.trim())
      setSent(true)
    } catch {
      setError('Ошибка отправки')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.card}><div className={styles.cardInner}>
          <h1 className={styles.title}>Сброс пароля</h1>
          {sent ? <p>Письмо отправлено, если аккаунт существует.</p> : (
            <form onSubmit={submit} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={styles.input} required />
              <button type="submit" className={styles.submit}>Отправить ссылку</button>
            </form>
          )}
          <Link to="/login" className={styles.backLink}>← Назад</Link>
        </div></div>
      </div>
    </div>
  )
}
