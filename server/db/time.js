/** ISO timestamp — works on SQLite and Postgres (TEXT columns). */
export function nowIso() {
  return new Date().toISOString()
}
