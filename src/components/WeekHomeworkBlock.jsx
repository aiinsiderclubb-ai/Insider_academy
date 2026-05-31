import styles from './WeekHomeworkBlock.module.css'

function ListSection({ label, items }) {
  if (!items?.length) return null
  return (
    <>
      <strong className={styles.label}>{label}</strong>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  )
}

export function WeekHomeworkBlock({ homework, lang = 'ru', compact = false }) {
  if (!homework) return null

  const isEn = lang === 'en'
  const tasks = isEn ? homework.tasksEn : homework.tasks
  const deliverables = isEn ? homework.deliverablesEn : homework.deliverables
  const criteria = isEn ? homework.criteriaEn : homework.criteria
  const defense = isEn ? homework.defenseEn : homework.defense
  const capstoneTitle = isEn ? homework.titleEn : homework.title

  return (
    <div className={`${styles.block} ${compact ? styles.compact : ''}`}>
      <h4 className={styles.heading}>
        {homework.capstone
          ? (isEn ? 'Capstone project' : 'Финальный проект')
          : (isEn ? 'Homework' : 'Домашнее задание')}
        {homework.capstone && capstoneTitle ? `: ${capstoneTitle}` : ''}
      </h4>
      <ListSection
        label={homework.capstone ? (isEn ? 'Must include' : 'Что должно быть') : (isEn ? 'Tasks' : 'Задание')}
        items={homework.capstone && !tasks?.length ? deliverables : tasks}
      />
      {!homework.capstone && (
        <ListSection label={isEn ? 'Deliverables' : 'Что должно быть в результате'} items={deliverables} />
      )}
      {homework.capstone && tasks?.length > 0 && (
        <ListSection label={isEn ? 'Also include' : 'Дополнительно'} items={deliverables} />
      )}
      <ListSection
        label={homework.capstone ? (isEn ? 'Defense criteria' : 'Критерии защиты') : (isEn ? 'Grading criteria' : 'Критерии проверки')}
        items={homework.capstone && defense?.length ? defense : criteria}
      />
      {homework.capstone && criteria?.length > 0 && defense?.length > 0 && (
        <ListSection label={isEn ? 'Quality criteria' : 'Критерии качества'} items={criteria} />
      )}
    </div>
  )
}
