import { useState } from 'react'
import styles from '../../pages/Admin.module.css'

const emptyPost = () => ({
  id: `post-${Date.now()}`,
  slug: '',
  title: '',
  titleEn: '',
  excerpt: '',
  excerptEn: '',
  content: '',
  contentEn: '',
  date: new Date().toISOString().slice(0, 10),
  category: '',
  categoryEn: '',
})

export function AdminBlogEditor({ posts, onSave, onDelete, canEdit = true }) {
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyPost())

  const startEdit = (post) => {
    setEditingId(post.id)
    setForm({ ...emptyPost(), ...post })
  }

  const startNew = () => {
    setEditingId('new')
    setForm(emptyPost())
  }

  const handleSave = () => {
    if (!form.title?.trim() || !form.slug?.trim()) {
      window.alert('Укажите название и slug')
      return
    }
    const list = [...posts]
    const idx = list.findIndex((p) => p.id === form.id)
    const next = { ...form, slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-') }
    if (idx >= 0) list[idx] = next
    else list.unshift(next)
    onSave(list)
    setEditingId(null)
    setForm(emptyPost())
  }

  if (!canEdit) return null

  return (
    <div className={styles.blogEditor}>
      <div className={styles.courseActions}>
        <button type="button" className={styles.addBtn} onClick={startNew}>+ Новая статья</button>
      </div>

      {(editingId != null) && (
        <div className={styles.editForm}>
          <h3>{editingId === 'new' ? 'Новая статья' : 'Редактирование'}</h3>
          <div className={styles.editGrid}>
            <label>Slug <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={styles.editInput} /></label>
            <label>Дата <input type="date" value={form.date?.slice(0, 10)} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={styles.editInput} /></label>
            <label className={styles.editFullWidth}>Название (RU) <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={styles.editInput} /></label>
            <label className={styles.editFullWidth}>Название (EN) <input value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} className={styles.editInput} /></label>
            <label>Категория (RU) <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={styles.editInput} /></label>
            <label>Категория (EN) <input value={form.categoryEn} onChange={(e) => setForm((f) => ({ ...f, categoryEn: e.target.value }))} className={styles.editInput} /></label>
            <label className={styles.editFullWidth}>Краткое описание (RU) <textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className={styles.editTextarea} rows={2} /></label>
            <label className={styles.editFullWidth}>Краткое описание (EN) <textarea value={form.excerptEn} onChange={(e) => setForm((f) => ({ ...f, excerptEn: e.target.value }))} className={styles.editTextarea} rows={2} /></label>
            <label className={styles.editFullWidth}>Контент (RU, HTML/Markdown) <textarea value={form.content || ''} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className={styles.editTextarea} rows={6} /></label>
            <label className={styles.editFullWidth}>Контент (EN) <textarea value={form.contentEn || ''} onChange={(e) => setForm((f) => ({ ...f, contentEn: e.target.value }))} className={styles.editTextarea} rows={6} /></label>
          </div>
          <div className={styles.editFormActions}>
            <button type="button" className={styles.saveEditBtn} onClick={handleSave}>Сохранить</button>
            <button type="button" className={styles.cancelBtn} onClick={() => { setEditingId(null); setForm(emptyPost()) }}>Отмена</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Slug</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={4} className={styles.empty}>Нет статей</td></tr>
            ) : (
              posts.slice(0, 50).map((post) => (
                <tr key={post.id}>
                  <td>{post.title?.slice(0, 60)}{post.title?.length > 60 ? '…' : ''}</td>
                  <td>{post.slug}</td>
                  <td>{post.date?.slice(0, 10)}</td>
                  <td>
                    <button type="button" className={styles.smallBtn} onClick={() => startEdit(post)}>Изменить</button>
                    <button type="button" className={styles.smallBtnDanger} onClick={() => { if (window.confirm('Удалить статью?')) onDelete(post.id) }}>Удалить</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
