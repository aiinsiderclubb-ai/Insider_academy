/**
 * Вычисляет даты открытия уроков по расписанию после покупки.
 * releaseSchedule: { daysOfWeek: [1, 2], time: "19:30" } — понедельник и вторник в 19:30
 * daysOfWeek: 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
 * Урок 0 открывается в момент покупки, остальные — по слотам (Пн/Вт 19:30).
 */
export function getUnlockDates(purchasedAt, releaseSchedule, lessonCount) {
  if (!releaseSchedule || !lessonCount) return []
  const purchase = new Date(purchasedAt)
  const { daysOfWeek, time } = releaseSchedule
  const [hours, minutes] = (time || '19:30').split(':').map(Number)
  const dates = [{ lessonIndex: 0, unlockAt: new Date(purchase) }]
  const start = new Date(purchase)
  start.setHours(0, 0, 0, 0)

  let slotIndex = 1
  for (let d = 0; d < 365 && slotIndex < lessonCount; d++) {
    const day = new Date(start)
    day.setDate(start.getDate() + d)
    if (!daysOfWeek.includes(day.getDay())) continue
    const unlock = new Date(day)
    unlock.setHours(hours, minutes, 0, 0)
    if (unlock < purchase && d === 0) continue
    dates.push({ lessonIndex: slotIndex, unlockAt: unlock })
    slotIndex++
  }
  return dates
}

export function isLessonUnlocked(lessonIndex, unlockDates, now = new Date()) {
  const entry = unlockDates.find((e) => e.lessonIndex === lessonIndex)
  if (!entry) return false
  return now >= new Date(entry.unlockAt)
}

export function formatScheduleLabel(schedule) {
  if (!schedule) return ''
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const days = (schedule.daysOfWeek || [])
    .sort((a, b) => a - b)
    .map((d) => dayNames[d])
    .join(', ')
  return `${days} в ${schedule.time || '19:30'}`
}
