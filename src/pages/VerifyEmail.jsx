import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import styles from './Login.module.css'

export function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); return }
    api.verifyEmail(token).then(() => setStatus('ok')).catch(() => setStatus('error'))
  }, [params])

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.card}><div className={styles.cardInner}>
          {status === 'loading' && <p>Проверяем email…</p>}
          {status === 'ok' && <><h1>Email подтверждён</h1><Link to="/cabinet">В кабинет →</Link></>}
          {status === 'error' && <><h1>Ошибка</h1><p>Ссылка недействительна.</p><Link to="/login">Войти</Link></>}
        </div></div>
      </div>
    </div>
  )
}
