import { useToast } from '../context/ToastContext'
import { ACADEMY_URL } from '../data/siteLinks'
import styles from './CertificateShare.module.css'

function buildShareText(cert, lang) {
  const ru = lang === 'ru'
  const title = cert.courseTitle || (ru ? 'курс AI Insider Academy' : 'AI Insider Academy course')
  return ru
    ? `Получил(а) сертификат AI Insider Academy: ${title}`
    : `Earned an AI Insider Academy certificate: ${title}`
}

function linkedInUrl(cert) {
  const shareUrl = encodeURIComponent(`${ACADEMY_URL}/cabinet#certificates`)
  return `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
}

function telegramUrl(text) {
  const t = encodeURIComponent(text)
  const u = encodeURIComponent(`${ACADEMY_URL}/cabinet#certificates`)
  return `https://t.me/share/url?url=${u}&text=${t}`
}

async function renderCertificatePng(cert, userName, lang) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 850
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 1200, 850)
  grad.addColorStop(0, '#1a1030')
  grad.addColorStop(0.5, '#2d1b4e')
  grad.addColorStop(1, '#0f172a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1200, 850)

  ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)'
  ctx.lineWidth = 4
  ctx.strokeRect(40, 40, 1120, 770)

  ctx.fillStyle = 'rgba(249, 115, 22, 0.9)'
  ctx.font = '700 22px system-ui, sans-serif'
  ctx.fillText('AI INSIDER ACADEMY', 80, 120)

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 48px system-ui, sans-serif'
  ctx.fillText(lang === 'ru' ? 'Сертификат' : 'Certificate', 80, 200)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '400 22px system-ui, sans-serif'
  ctx.fillText(lang === 'ru' ? 'подтверждает, что' : 'This certifies that', 80, 280)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 40px system-ui, sans-serif'
  ctx.fillText(userName || (lang === 'ru' ? 'Студент' : 'Student'), 80, 350)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '400 22px system-ui, sans-serif'
  ctx.fillText(lang === 'ru' ? 'успешно завершил(а) программу' : 'successfully completed', 80, 420)

  ctx.fillStyle = '#c4b5fd'
  ctx.font = '700 34px system-ui, sans-serif'
  const title = cert.courseTitle || 'AI Insider Course'
  wrapText(ctx, title, 80, 490, 1000, 42)

  if (cert.score != null) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '600 20px system-ui, sans-serif'
    ctx.fillText(`${lang === 'ru' ? 'Оценка' : 'Score'}: ${cert.score}`, 80, 620)
  }

  const date = cert.date || cert.updatedAt
  if (date) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '400 18px system-ui, sans-serif'
    ctx.fillText(new Date(date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB'), 80, 740)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '400 16px system-ui, sans-serif'
  ctx.fillText('myinsideracademy.com', 80, 780)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ')
  let line = ''
  let yy = y
  for (let n = 0; n < words.length; n += 1) {
    const test = `${line}${words[n]} `
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line, x, yy)
      line = `${words[n]} `
      yy += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, yy)
}

export function CertificateShare({ cert, lang, userName }) {
  const ru = lang === 'ru'
  const { showToast } = useToast()
  const text = buildShareText(cert, lang)

  const downloadPng = async () => {
    try {
      if (cert.fileDataUrl) {
        const a = document.createElement('a')
        a.href = cert.fileDataUrl
        a.download = cert.fileName || 'certificate'
        a.click()
        return
      }
      const blob = await renderCertificatePng(cert, userName, lang)
      if (!blob) throw new Error('render failed')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-insider-${(cert.courseId || 'certificate')}.png`
      a.click()
      URL.revokeObjectURL(url)
      showToast(ru ? 'PNG сохранён' : 'PNG saved', 'success')
    } catch (_) {
      showToast(ru ? 'Не удалось сохранить PNG' : 'Could not save PNG', 'error')
    }
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${ACADEMY_URL}`)
      showToast(ru ? 'Текст скопирован' : 'Copied', 'success')
    } catch (_) {
      showToast(ru ? 'Не удалось скопировать' : 'Copy failed', 'error')
    }
  }

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.btnPrimary} onClick={downloadPng}>
        {ru ? 'Скачать PNG' : 'Download PNG'}
      </button>
      <a
        className={styles.btn}
        href={linkedInUrl(cert)}
        target="_blank"
        rel="noreferrer noopener"
      >
        LinkedIn
      </a>
      <a
        className={styles.btn}
        href={telegramUrl(text)}
        target="_blank"
        rel="noreferrer noopener"
      >
        Telegram
      </a>
      <button type="button" className={styles.btnGhost} onClick={copyText}>
        {ru ? 'Копировать' : 'Copy'}
      </button>
    </div>
  )
}
