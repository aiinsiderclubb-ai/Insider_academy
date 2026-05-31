import { WeekHomeworkBlock } from './WeekHomeworkBlock'
import styles from './CourseHomeworkPanel.module.css'

export function CourseHomeworkPanel({
  lang,
  t,
  lessonIndex,
  homework,
  hwText,
  hwFile,
  hwError,
  homeworkEntry,
  onTextChange,
  onFileChange,
  onSubmit,
  showForm,
  canSubmit = false,
}) {
  if (!homework && !homeworkEntry) return null

  return (
    <section className={styles.panel} aria-label={lang === 'ru' ? 'Домашнее задание' : 'Homework'}>
      <div className={styles.head}>
        <span className={styles.headIcon} aria-hidden>📝</span>
        <div>
          <h3 className={styles.title}>{lang === 'ru' ? 'Домашнее задание к уроку' : 'Homework for this lesson'}</h3>
          <p className={styles.subtitle}>
            {lang === 'ru'
              ? 'Выполните задание после просмотра видео — так закрепляется материал.'
              : 'Complete the assignment after watching — it helps you retain the material.'}
          </p>
        </div>
      </div>

      {homework && <WeekHomeworkBlock homework={homework} lang={lang} compact />}

      {homeworkEntry && !showForm && (
        <div className={styles.feedback}>
          {homeworkEntry.adminComment && (
            <div className={styles.adminComment}>
              <strong>{lang === 'ru' ? 'Комментарий проверяющего:' : 'Reviewer feedback:'}</strong>
              <p>{homeworkEntry.adminComment}</p>
            </div>
          )}
          <span className={`${styles.statusBadge} ${styles[`status_${homeworkEntry.status}`] || ''}`}>
            {homeworkEntry.status === 'accepted'
              ? (lang === 'ru' ? '✓ ДЗ принято' : '✓ Homework accepted')
              : homeworkEntry.status === 'resubmit'
                ? (lang === 'ru' ? '↻ На доработку' : '↻ Needs revision')
                : (lang === 'ru' ? '⏳ На проверке' : '⏳ Under review')}
          </span>
        </div>
      )}

      {!canSubmit && !homeworkEntry && homework && (
        <p className={styles.lockedHint}>
          {lang === 'ru'
            ? 'Сдача ДЗ доступна после покупки курса и открытия урока.'
            : 'Submit homework after purchasing the course and unlocking this lesson.'}
        </p>
      )}

      {showForm && canSubmit && (
        <div className={styles.form}>
          {homeworkEntry?.status === 'resubmit' && (
            <div className={styles.resubmitNote}>
              {lang === 'ru' ? 'Исправьте замечания и загрузите файл заново.' : 'Please revise and upload again.'}
            </div>
          )}
          <label className={styles.label}>{t('course.hwLabel')}</label>
          <textarea
            className={styles.textarea}
            placeholder={t('course.hwPlaceholder')}
            value={hwText ?? ''}
            onChange={(e) => onTextChange(e.target.value)}
            rows={3}
          />
          <label className={styles.label}>{t('course.hwFile')}</label>
          <input type="file" className={styles.fileInput} onChange={(e) => onFileChange(e.target.files?.[0])} />
          <span className={styles.fileRequired}>
            {lang === 'ru' ? 'Файл обязателен для отправки.' : 'A file is required for submission.'}
          </span>
          {hwFile?.name && <span className={styles.fileName}>{hwFile.name}</span>}
          {hwError && <span className={styles.error}>{hwError}</span>}
          <button type="button" className={styles.submitBtn} onClick={onSubmit}>
            {t('course.submitHwBtn')}
          </button>
        </div>
      )}
    </section>
  )
}
