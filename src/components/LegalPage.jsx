import { PageMeta } from './PageMeta'
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
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Последнее обновление: июль 2026</p>
        {sections.map((section) => (
          <section key={section.id} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className={styles.paragraph}>{p}</p>
            ))}
          </section>
        ))}
        {draftNotice && (
          <aside className={styles.todo}>
            <strong>DRAFT для юриста:</strong> реквизиты в блоках выше помечены TODO —
            замените на финальные данные юрлица (название, рег. номер, адрес, IBAN) до приёма боевых платежей.
          </aside>
        )}
      </div>
    </div>
  )
}
