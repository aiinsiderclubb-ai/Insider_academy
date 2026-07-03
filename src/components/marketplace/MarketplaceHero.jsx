import { Link } from 'react-router-dom'
import styles from './MarketplaceHero.module.css'

export function MarketplaceHero({ lang }) {
  const ru = lang === 'ru'

  const floats = ru
    ? ['n8n Workflow', 'AI Agent', 'Prompt Pack', 'CRM Auto', 'RAG System']
    : ['n8n Workflow', 'AI Agent', 'Prompt Pack', 'CRM Auto', 'RAG System']

  return (
    <header className={styles.hero}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.floats} aria-hidden>
        {floats.map((label) => (
          <span key={label} className={styles.chip}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.inner}>
        <span className={styles.pill}>AI Insider Marketplace</span>
        <h1 className={styles.title}>AI Insider Marketplace</h1>
        <p className={styles.sub}>
          {ru
            ? 'Готовые AI-ассеты, автоматизации, шаблоны и бизнес-системы — скачайте и внедрите за часы.'
            : 'Ready AI assets, automations, templates and business systems — deploy in hours.'}
        </p>
        <div className={styles.actions}>
          <a href="#catalog" className={styles.btnPrimary}>
            {ru ? 'Смотреть каталог' : 'Browse Marketplace'}
          </a>
          <Link to="/marketplace/creators" className={styles.btnSecondary}>
            {ru ? 'Стать креатором' : 'Become a Creator'}
          </Link>
        </div>
      </div>
    </header>
  )
}
