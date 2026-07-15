import { PageMeta } from './PageMeta'
import { CalendarClock, Scale, ShieldAlert } from 'lucide-react'
import styles from './LegalPage.module.css'

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.path
 * @param {Array<{ id: string, title: string, paragraphs: string[] }>} props.sections
 * @param {boolean} [props.draftNotice]
 */
export function LegalPage({ title, description, path, sections, draftNotice = false }) {
  return (
    <div className={styles.wrap}>
      <PageMeta title={title} description={description} path={path} />
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden><Scale size={24} strokeWidth={1.7} /></span>
          <span className={styles.eyebrow}>LEGAL · AI INSIDER ACADEMY</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.updated}>
            <CalendarClock size={14} aria-hidden />
            Последнее обновление: июль 2026
          </p>
        </header>
        {sections.map((section, index) => (
          <section key={section.id} className={styles.section}>
            <span className={styles.sectionIndex} aria-hidden>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className={styles.paragraph}>{p}</p>
              ))}
            </div>
          </section>
        ))}
        {draftNotice && (
          <aside className={styles.todo}>
            <ShieldAlert size={20} aria-hidden />
            <p><strong>DRAFT для юриста:</strong> реквизиты в блоках выше помечены TODO —
              замените на финальные данные юрлица (название, рег. номер, адрес, IBAN) до приёма боевых платежей.</p>
          </aside>
        )}
      </div>
    </div>
  )
}
