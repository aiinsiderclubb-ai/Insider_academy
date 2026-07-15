import { useState } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'
import styles from '../../pages/Admin.module.css'

export function LessonDragList({ lessons, onChange, onRemove, onAdd }) {
  const [dragIndex, setDragIndex] = useState(null)

  const reorder = (from, to) => {
    if (from === to || from == null || to == null) return
    const next = [...lessons]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const setLesson = (index, field, value) => {
    const next = lessons.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    onChange(next)
  }

  return (
    <div className={styles.lessonDragList}>
      <h4 className={styles.editSubtitle}>Уроки — перетащите для изменения порядка</h4>
      {lessons.map((les, idx) => (
        <div
          key={les.id || idx}
          className={`${styles.lessonDragRow} ${dragIndex === idx ? styles.lessonDragging : ''}`}
          draggable
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { reorder(dragIndex, idx); setDragIndex(null) }}
          onDragEnd={() => setDragIndex(null)}
        >
          <span className={styles.dragHandle} title="Перетащить"><GripVertical size={17} aria-hidden /></span>
          <span className={styles.lessonNum}>#{idx + 1}</span>
          <input placeholder="Название RU" value={les.title} onChange={(e) => setLesson(idx, 'title', e.target.value)} className={styles.editInput} />
          <input placeholder="Название EN" value={les.titleEn} onChange={(e) => setLesson(idx, 'titleEn', e.target.value)} className={styles.editInput} />
          <input placeholder="Длительность" value={les.duration} onChange={(e) => setLesson(idx, 'duration', e.target.value)} className={styles.editInput} />
          <input placeholder="URL видео" value={les.videoUrl} onChange={(e) => setLesson(idx, 'videoUrl', e.target.value)} className={styles.editInput} />
          <button type="button" onClick={() => onRemove(idx)} className={styles.smallBtnDanger} aria-label="Удалить урок"><X size={14} aria-hidden /></button>
        </div>
      ))}
      <button type="button" onClick={onAdd} className={styles.smallBtn}><Plus size={14} aria-hidden /> Урок</button>
    </div>
  )
}
