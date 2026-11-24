/*
 * The academy is run from Switzerland, so "today" and "yesterday" in reports
 * mean the calendar day in Zurich, not in UTC. Timestamps in the database stay
 * ISO-8601 UTC; these helpers turn a Zurich calendar day into the UTC range
 * that covers it (23, 24 or 25 hours around the clock changes).
 */

export const ZONE = 'Europe/Zurich'

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short',
})

/** 'YYYY-MM-DD' of the Zurich calendar day `date` falls on. */
export function zurichDay(date = new Date()) {
  return dayFormat.format(date)
}

export function zurichParts(date = new Date()) {
  const parts = Object.fromEntries(partsFormat.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: parts.weekday, // Mon … Sun
  }
}

/** Minutes Zurich is ahead of UTC at instant `date`. */
function offsetMinutes(date) {
  const p = Object.fromEntries(partsFormat.formatToParts(date).map((x) => [x.type, x.value]))
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute))
  return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000)
}

/** The UTC instant of Zurich midnight starting `day` ('YYYY-MM-DD'). */
export function zurichMidnight(day) {
  const [y, m, d] = day.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d)
  let instant = guess - offsetMinutes(new Date(guess)) * 60000
  // Correct once more in case the offset differs on either side of midnight.
  instant = guess - offsetMinutes(new Date(instant)) * 60000
  return new Date(instant)
}

/** `day` shifted by `delta` calendar days. */
export function addDays(day, delta) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10)
}

/**
 * UTC ISO bounds [from, to) of `days` Zurich calendar days ending with
 * `lastDay` (inclusive), plus the day labels at each end.
 */
export function zurichDayBounds(lastDay = zurichDay(), days = 1) {
  const firstDay = addDays(lastDay, -(days - 1))
  return {
    firstDay,
    lastDay,
    from: zurichMidnight(firstDay).toISOString(),
    to: zurichMidnight(addDays(lastDay, 1)).toISOString(),
  }
}

/** Monday of the Zurich week `day` falls in. */
export function weekStart(day = zurichDay()) {
  const [y, m, d] = day.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
  return addDays(day, -((weekday + 6) % 7))
}

const RU_MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const RU_WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

/** '23 ноября (вс)' */
export function ruDay(day, { weekday = true } = {}) {
  const [y, m, d] = day.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${d} ${RU_MONTHS[m - 1]}${weekday ? ` (${RU_WEEKDAYS[wd]})` : ''}`
}
