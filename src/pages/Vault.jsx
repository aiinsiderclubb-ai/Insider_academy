import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { VAULT_HUB } from '../data/vaultProducts'
import { VaultSection } from '../components/VaultSection'
import styles from './Vault.module.css'

export function Vault() {
  const { lang } = useLanguage()
  const { hasPurchased } = useAuth()
  const ru = lang === 'ru'

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <Link to="/courses" className={styles.backLink}>
          {ru ? '← Каталог' : '← Catalog'}
        </Link>
        <span className={styles.heroPill}>Vault</span>
        <h1 className={styles.title}>{ru ? VAULT_HUB.titleRu : VAULT_HUB.titleEn}</h1>
        <p className={styles.lead}>{ru ? VAULT_HUB.leadRu : VAULT_HUB.leadEn}</p>
        <VaultSection lang={lang} hasPurchased={hasPurchased} showMoreLink={false} />
      </div>
    </div>
  )
}
