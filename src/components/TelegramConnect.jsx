import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Check, Copy, RefreshCw, Send } from 'lucide-react'
import { api } from '../api/client'
import { TELEGRAM_NOTIFY_BOT } from '../data/siteLinks'
import styles from './TelegramConnect.module.css'

const PREF_LABELS_RU = {
  homework: 'Домашние задания (принято / доработка)',
  promo: 'Промокоды и скидки',
  news: 'Новости Academy',
  reviews: 'Статус отзывов',
  purchases: 'Покупки и доступ к курсам',
}

const PREF_LABELS_EN = {
  homework: 'Homework (accepted / resubmit)',
  promo: 'Promo codes',
  news: 'Academy news',
  reviews: 'Review status',
  purchases: 'Purchases & access',
}

async function copyText(text) {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function TelegramConnect({ lang, personalId: personalIdProp, variant = 'default' }) {
  const ru = lang === 'ru'
  const [status, setStatus] = useState(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [botUrl, setBotUrl] = useState(TELEGRAM_NOTIFY_BOT || '')
  const [manualCommand, setManualCommand] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [info, botMeta] = await Promise.all([
        api.telegramStatus(),
        api.telegramBotInfo().catch(() => ({})),
      ])
      setStatus(info)
      if (botMeta?.botUrl) setBotUrl(botMeta.botUrl)
      else if (info?.botUrl) setBotUrl(info.botUrl)

      if (!info.connected) {
        const link = await api.telegramLinkToken()
        if (link.url) setLinkUrl(link.url)
        if (link.botUsername && !botMeta?.botUrl) {
          setBotUrl(`https://t.me/${link.botUsername}`)
        }
        if (link.manualCommand) setManualCommand(link.manualCommand)
      }
    } catch (err) {
      setMsg(err.data?.errorRu || err.message || (ru ? 'Ошибка загрузки' : 'Load error'))
    } finally {
      setLoading(false)
    }
  }, [ru])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!status || status.connected || loading) return undefined
    const id = setInterval(() => { load().catch(() => {}) }, 5000)
    return () => clearInterval(id)
  }, [status, loading, load])

  const togglePref = async (key) => {
    if (!status?.prefs) return
    setBusy(true)
    try {
      const next = await api.telegramUpdatePrefs({ [key]: !status.prefs[key] })
      setStatus((s) => ({ ...s, prefs: next.prefs }))
    } catch (_) {}
    setBusy(false)
  }

  const disconnect = async () => {
    setBusy(true)
    await api.telegramDisconnect()
    await load()
    setBusy(false)
    setMsg(ru ? 'Telegram отключён' : 'Telegram disconnected')
  }

  const onCopy = async (kind, text) => {
    const ok = await copyText(text)
    if (ok) {
      setCopied(kind)
      setTimeout(() => setCopied(''), 2000)
    }
  }

  if (loading) {
    return <p className={styles.muted}>{ru ? 'Загрузка…' : 'Loading…'}</p>
  }

  const labels = ru ? PREF_LABELS_RU : PREF_LABELS_EN
  const personalId = status?.personalId || personalIdProp || ''
  const botUsername = status?.botUsername
    ? `@${status.botUsername}`
    : botUrl
      ? `@${botUrl.replace(/^https?:\/\/t\.me\//i, '').split('?')[0]}`
      : null
  const openBotUrl = linkUrl && linkUrl.includes('start=link_') ? linkUrl : botUrl
  const linkCommand = manualCommand || (personalId ? `/link ${personalId}` : '')

  return (
    <div className={`${styles.wrap} ${variant === 'settings' ? styles.settings : ''}`}>
      {status?.connected ? (
        <>
          <div className={styles.connectionState}>
            <span className={styles.stateIcon}><Check size={17} aria-hidden="true" /></span>
            <p className={styles.ok}>
              {ru ? 'Бот подключён' : 'Bot connected'}
              {status.username && ` · @${status.username}`}
            </p>
          </div>
          <p className={styles.muted}>
            {ru
              ? 'Уведомления приходят в Telegram: ДЗ, промокоды, новости.'
              : 'Notifications in Telegram: homework, promos, news.'}
          </p>
          {botUrl && (
            <a href={botUrl} target="_blank" rel="noreferrer noopener" className={styles.linkBtn}>
              {ru ? 'Открыть бота' : 'Open bot'}
              {botUsername ? ` ${botUsername}` : ''}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          )}
        </>
      ) : (
        <>
          <div className={styles.connectionState}>
            <span className={styles.stateIcon}><Send size={17} aria-hidden="true" /></span>
            <div>
              <strong>{ru ? 'Связать Academy с Telegram' : 'Connect Academy to Telegram'}</strong>
              <p className={styles.muted}>
                {ru
                  ? 'Подключение занимает меньше минуты.'
                  : 'It takes less than a minute.'}
              </p>
            </div>
          </div>

          <ol className={styles.steps} aria-label={ru ? 'Шаги подключения' : 'Connection steps'}>
            <li><span>01</span>{ru ? 'Откройте бота' : 'Open the bot'}</li>
            <li><span>02</span>{ru ? 'Нажмите Start' : 'Tap Start'}</li>
            <li><span>03</span>{ru ? 'Проверьте статус' : 'Check status'}</li>
          </ol>

          {openBotUrl ? (
            <a href={openBotUrl} target="_blank" rel="noreferrer noopener" className={styles.primaryBtn}>
              {ru ? 'Открыть бота в Telegram' : 'Open bot in Telegram'}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          ) : (
            <p className={styles.warn}>
              {ru
                ? 'Ссылка на бота пока не настроена. Администратору: TELEGRAM_BOT_USERNAME на API и VITE_TELEGRAM_NOTIFY_BOT_URL на фронте.'
                : 'Bot link not configured yet.'}
            </p>
          )}

          {botUrl && !openBotUrl?.includes('start=link_') && botUrl !== openBotUrl && (
            <a href={botUrl} target="_blank" rel="noreferrer noopener" className={styles.linkBtn}>
              {botUsername || (ru ? 'Бот без автопривязки' : 'Bot (manual link)')}
            </a>
          )}

          {personalId && (
            <div className={styles.idBox}>
              <div className={styles.credentialHeading}>
                <strong>{ru ? 'Данные подключения' : 'Connection details'}</strong>
                <span>{ru ? 'Запасной способ — отправить команду вручную' : 'Use the command for manual linking'}</span>
              </div>
              <div className={styles.credentialRow}>
                <span className={styles.idLabel}>{ru ? 'Личный ID' : 'Personal ID'}</span>
                <code className={styles.idCode}>{personalId}</code>
                <button type="button" className={styles.copyBtn} onClick={() => onCopy('id', personalId)}>
                  {copied === 'id' ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  <span>{copied === 'id' ? (ru ? 'Готово' : 'Copied') : (ru ? 'Копировать' : 'Copy')}</span>
                </button>
              </div>
              {linkCommand && (
                  <div className={styles.credentialRow}>
                    <span className={styles.idLabel}>{ru ? 'Команда' : 'Command'}</span>
                    <code className={styles.cmdCode}>{linkCommand}</code>
                    <button type="button" className={styles.copyBtn} onClick={() => onCopy('cmd', linkCommand)}>
                      {copied === 'cmd' ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                      <span>{copied === 'cmd' ? (ru ? 'Готово' : 'Copied') : (ru ? 'Копировать' : 'Copy')}</span>
                    </button>
                  </div>
              )}
            </div>
          )}

          <p className={styles.mutedSmall}>
            {ru
              ? 'После привязки нажмите «Обновить статус» или подождите несколько секунд.'
              : 'After linking, tap “Refresh” or wait a few seconds.'}
          </p>
        </>
      )}

      {status?.prefs && (
        <div className={styles.prefs}>
          <div className={styles.prefsHeading}>
            <h4>{ru ? 'Лента уведомлений' : 'Notification feed'}</h4>
            <span>{ru ? 'Выберите, что присылать' : 'Choose what to receive'}</span>
          </div>
          <div className={styles.prefGrid}>
            {Object.entries(labels).map(([key, label]) => (
              <label key={key} className={styles.prefRow}>
                <input
                  type="checkbox"
                  checked={status.prefs[key] !== false}
                  disabled={busy || !status.connected}
                  onChange={() => togglePref(key)}
                />
                <span className={styles.prefCheck}><Check size={13} aria-hidden="true" /></span>
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {status?.connected && (
        <button type="button" className={styles.secondaryBtn} onClick={disconnect} disabled={busy}>
          {ru ? 'Отключить' : 'Disconnect'}
        </button>
      )}

      <button type="button" className={styles.textBtn} onClick={load} disabled={busy}>
        <RefreshCw size={14} aria-hidden="true" />
        {ru ? 'Обновить статус' : 'Refresh'}
      </button>

      {msg && <p className={styles.msg}>{msg}</p>}
    </div>
  )
}
