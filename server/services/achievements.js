export const ACHIEVEMENTS = [
  { id: 'first_lesson', titleRu: 'Первый урок', titleEn: 'First lesson', descRu: 'Посмотрели первый урок', descEn: 'Watched first lesson', icon: '🎬' },
  { id: 'first_hw', titleRu: 'Первое ДЗ', titleEn: 'First homework', descRu: 'Сдали домашнее задание', descEn: 'Submitted homework', icon: '📝' },
  { id: 'streak_3', titleRu: 'Серия 3 дня', titleEn: '3-day streak', descRu: '3 дня подряд в обучении', descEn: '3 days in a row', icon: '🔥' },
  { id: 'streak_7', titleRu: 'Серия 7 дней', titleEn: '7-day streak', descRu: 'Неделя без перерыва', descEn: 'Week without break', icon: '⚡' },
  { id: 'streak_14', titleRu: 'Серия 14 дней', titleEn: '14-day streak', descRu: 'Две недели подряд', descEn: 'Two weeks in a row', icon: '💎' },
  { id: 'course_50', titleRu: 'Полпути', titleEn: 'Halfway', descRu: '50% курса пройдено', descEn: '50% of course done', icon: '🎯' },
  { id: 'course_100', titleRu: 'Выпускник', titleEn: 'Graduate', descRu: 'Курс завершён на 100%', descEn: 'Course 100% complete', icon: '🏆' },
  { id: 'reviewer', titleRu: 'Критик', titleEn: 'Reviewer', descRu: 'Оставили отзыв', descEn: 'Left a review', icon: '⭐' },
]

export function computeAchievements({ progress, purchases, reviews, streak }) {
  const unlocked = new Set()
  for (const [courseId, p] of Object.entries(progress || {})) {
    const watched = p.watched?.length || 0
    const submitted = p.homeworkSubmitted?.length || 0
    const total = Math.max(watched, (p.homeworkChecked?.length || 0) + watched)
    if (watched >= 1) unlocked.add('first_lesson')
    if (submitted >= 1) unlocked.add('first_hw')
    if (total >= 5) unlocked.add('course_50')
    if (total >= 10) unlocked.add('course_100')
  }
  if ((streak?.current || 0) >= 3) unlocked.add('streak_3')
  if ((streak?.current || 0) >= 7) unlocked.add('streak_7')
  if ((streak?.current || 0) >= 14) unlocked.add('streak_14')
  if ((reviews?.length || 0) >= 1) unlocked.add('reviewer')
  if ((purchases?.length || 0) >= 1 && unlocked.size === 0) unlocked.add('first_lesson')
  return ACHIEVEMENTS.filter((a) => unlocked.has(a.id))
}

export async function updateStreak(db, userId) {
  const today = new Date().toISOString().slice(0, 10)
  const row = await db.get('SELECT streak_count, last_activity_date FROM users WHERE id = ?', [userId])
  if (!row) return { current: 0, best: 0 }
  let current = row.streak_count || 0
  const last = row.last_activity_date
  if (last === today) return { current, best: current }
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  current = last === yesterday ? current + 1 : 1
  await db.run('UPDATE users SET streak_count = ?, last_activity_date = ? WHERE id = ?', [current, today, userId])
  return { current, best: current }
}
