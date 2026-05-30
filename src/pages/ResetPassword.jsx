import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import styles from './Login.module.css'

export function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.resetPassword(params.get('token'), password)
      navigate('/login')
    } catch {
      setError('Не удалось сменить пароль')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.card}><div className={styles.cardInner}>
          <h1 className={styles.title}>Новый пароль</h1>
          <form onSubmit={submit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className={styles.input} required />
            <button type="submit" className={styles.submit}>Сохранить</button>
          </form>
          <Link to="/login" className={styles.backLink}>← Войти</Link>
        </div></div>
      </div>
    </div>
  )
}
