import { getCourseField } from '../data/courses'
import { ACADEMY_GRADING_STANDARD } from '../data/courseHomework'
import styles from './CourseOverviewSection.module.css'

export function CourseOverviewSection({ course, lang }) {
  const description =
    getCourseField(course, 'fullDescription', lang)
    || getCourseField(course, 'courseIdea', lang)
    || getCourseField(course, 'shortDescription', lang)
  const goals = getCourseField(course, 'goals', lang) || []
  const finalProject = getCourseField(course, 'finalProject', lang)
  const hasHomework = course.hasHomework || (course.priceEur ?? course.price ?? 0) > 0
  const grading = ACADEMY_GRADING_STANDARD[lang === 'en' ? 'en' : 'ru']

  if (!description && !goals.length && !hasHomework) return null

  return (
    <section className={styles.section} aria-label={lang === 'ru' ? 'О курсе' : 'About the course'}>
      <h2 className={styles.title}>{lang === 'ru' ? 'О курсе' : 'About the course'}</h2>

      {description && <p className={styles.desc}>{description}</p>}

      {goals.length > 0 && (
        <div className={styles.block}>
          <h3 className={styles.subtitle}>{lang === 'ru' ? 'Что вы освоите' : 'What you will learn'}</h3>
          <ul className={styles.list}>
            {goals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </div>
      )}

      {finalProject && (
        <div className={styles.block}>
          <h3 className={styles.subtitle}>{lang === 'ru' ? 'Итоговый проект' : 'Capstone project'}</h3>
          <p className={styles.note}>{finalProject}</p>
        </div>
      )}

      {hasHomework && (
        <div className={styles.hwBlock}>
          <h3 className={styles.subtitle}>{lang === 'ru' ? 'Домашние задания' : 'Homework'}</h3>
          <p className={styles.hwIntro}>
            {lang === 'ru'
              ? 'После каждого урока — практическое задание: повторите демонстрацию на своей теме, сохраните результат и добавьте в папку итогового проекта. Следующий урок открывается после принятия ДЗ куратором.'
              : 'After each lesson you complete a practical assignment: repeat the demo in your niche, save the result, and add it to your capstone folder. The next lesson unlocks once homework is accepted.'}
          </p>
          <p className={styles.hwStandard}>{grading.title}</p>
          <ul className={styles.gradingList}>
            {grading.levels.map((level) => (
              <li key={level.name}>
                <strong>{level.name}</strong> — {level.desc}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
