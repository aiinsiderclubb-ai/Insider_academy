import { google } from 'googleapis'
import { config } from '../config.js'
import { hasAcceleratorAccess } from './adminApplications.js'

const SHEET_TITLES = {
  users: 'Пользователи',
  logins: 'Входы',
  purchases: 'Покупки',
  homework: 'Домашнее задание',
  reviews: 'Отзывы',
  certificates: 'Сертификаты',
  applications: 'Заявки',
  referrals: 'Рефералы',
  registrations: 'Регистрации',
  audit: 'Журнал событий',
}

const HEADERS = {
  users: ['Дата', 'Личный ID', 'ID', 'Email', 'Имя', 'Email ✓', 'Пароль изменён', 'Последний вход', 'Действие', 'Детали'],
  logins: ['Дата', 'Email', 'Личный ID', 'ID пользователя', 'Действие', 'Детали'],
  purchases: ['Дата', 'Email', 'Личный ID', 'Курс ID', 'Курс', 'Сумма', 'Источник', 'Действие'],
  homework: ['Дата', 'Email', 'Личный ID', 'Курс', 'Урок №', 'Урок', 'Статус', 'Оценка', 'Комментарий', 'Действие', 'ID записи'],
  reviews: ['Дата', 'Email', 'Личный ID', 'Курс ID', 'Рейтинг', 'Статус', 'Текст', 'Действие', 'ID отзыва'],
  certificates: ['Дата', 'Email', 'Личный ID', 'Курс ID', 'Курс', 'Оценка', 'Действие', 'ID'],
  applications: ['Дата', 'Email', 'Имя', 'Фамилия', 'Telegram', 'Статус', 'Заметка админа', 'Доступ выдан', 'Действие', 'ID заявки'],
  referrals: ['Дата', 'Email реферера', 'Email приглашённого', 'Купил', 'Действие'],
  registrations: ['Дата', 'Личный ID', 'Email', 'Имя', 'Действие'],
  audit: ['Дата', 'Тип', 'Email', 'Личный ID', 'Описание', 'Мета'],
}

let authClient = null
let sheetIdCache = null
let initPromise = null

/** Основные таблицы-архив в папке Google Drive (как на скриншоте). */
export const ARCHIVE_SHEET_KEYS = ['users', 'logins', 'purchases', 'homework', 'reviews']

export function isGoogleSheetsEnabled() {
  return Boolean(config.googleSheets.enabled && config.googleSheets.serviceAccount)
}

function getCredentials() {
  if (!config.googleSheets.serviceAccount) return null
  try {
    return typeof config.googleSheets.serviceAccount === 'string'
      ? JSON.parse(config.googleSheets.serviceAccount)
      : config.googleSheets.serviceAccount
  } catch {
    return null
  }
}

export function classifyGoogleDriveError(message) {
  if (!message) return 'unknown'
  if (/FOLDER_NO_WRITE|FOLDER_NOT_FOUND|FOLDER_INACCESSIBLE/i.test(message)) return 'folder_access'
  if (/storage quota|quota exceeded|quotaExceeded/i.test(message)) return 'drive_quota'
  if (/403|permission|forbidden|insufficient/i.test(message)) return 'folder_access'
  return 'unknown'
}

/** Понятное сообщение для типичных ошибок Google API (квота Drive, доступ к папке). */
export function formatGoogleDriveError(message) {
  if (!message) return message
  if (/FOLDER_NO_WRITE/i.test(message)) {
    return (
      'Сервис-аккаунт видит папку, но не может создавать в ней файлы. '
      + 'Откройте папку на Google Drive → Поделиться → добавьте email робота с правом «Редактор» (не «Читатель»).'
    )
  }
  if (/FOLDER_NOT_FOUND|FOLDER_INACCESSIBLE/i.test(message)) {
    return (
      'Папка архива недоступна сервис-аккаунту. Проверьте GOOGLE_DRIVE_FOLDER_ID и что папку расшарили '
      + 'на email робота (Редактор). Ссылка «доступ по ссылке» без добавления email робота не сработает.'
    )
  }
  if (/storage quota has been exceeded|quota exceeded|quotaExceeded/i.test(message)) {
    return (
      'Google вернул «квота превышена». Если ваш личный Drive пустой — обычно папка не расшарена роботу как «Редактор», '
      + 'и таблицы пытаются создаться в Drive сервис-аккаунта (лимит ~15 МБ). '
      + 'Исправление: Поделиться папкой → добавить my-insider-academy@... → Редактор. '
      + 'Либо вручную создайте в папке таблицы «Пользователи», «Входы», «Покупки», «Домашнее задание», «Отзывы».'
    )
  }
  if (/403|permission|forbidden/i.test(message)) {
    return (
      'Нет доступа к Google Drive. Дайте сервис-аккаунту роль «Редактор» на папку архива '
      + '(Поделиться → конкретный email робота, не только ссылка).'
    )
  }
  return message
}

/** Проверка доступа сервис-аккаунта к папке архива (без создания файлов). */
export async function inspectDriveFolder() {
  if (!isGoogleSheetsEnabled()) {
    return { ok: false, reason: 'disabled' }
  }
  const folderId = config.googleSheets.folderId
  if (!folderId) return { ok: false, reason: 'no_folder_id' }

  const auth = await getAuth()
  const drive = google.drive({ version: 'v3', auth })
  try {
    const meta = await drive.files.get({
      fileId: folderId,
      fields: 'id,name,mimeType,capabilities,driveId,shared',
      supportsAllDrives: true,
    })
    const caps = meta.data.capabilities || {}
    const listQ = `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
    const listed = await drive.files.list({
      q: listQ,
      fields: 'files(id, name)',
      pageSize: 50,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    const files = listed.data.files || []
    return {
      ok: true,
      folderId,
      folderName: meta.data.name,
      canAddChildren: Boolean(caps.canAddChildren),
      canEdit: Boolean(caps.canEdit),
      isSharedDrive: Boolean(meta.data.driveId),
      existingSpreadsheets: files.length,
      spreadsheetNames: files.map((f) => f.name),
    }
  } catch (err) {
    const code = err?.code === 404 || err?.response?.status === 404 ? 'folder_not_found' : 'folder_inaccessible'
    return { ok: false, reason: code, detail: err.message }
  }
}

async function getAuth() {
  if (authClient) return authClient
  const credentials = getCredentials()
  if (!credentials) throw new Error('Google credentials missing')
  authClient = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
  return authClient
}

async function assertFolderWritable(folderId) {
  const inspection = await inspectDriveFolder()
  if (!inspection.ok) {
    if (inspection.reason === 'folder_not_found') {
      throw new Error(`FOLDER_NOT_FOUND: ${inspection.detail || folderId}`)
    }
    throw new Error(`FOLDER_INACCESSIBLE: ${inspection.detail || 'no access'}`)
  }
  if (!inspection.canAddChildren) {
    throw new Error('FOLDER_NO_WRITE: service account cannot create files in archive folder')
  }
  return inspection
}

async function resolveSheetIds() {
  if (sheetIdCache) return sheetIdCache
  const auth = await getAuth()
  const drive = google.drive({ version: 'v3', auth })
  const folderId = config.googleSheets.folderId
  if (folderId) await assertFolderWritable(folderId)
  const q = folderId
    ? `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
    : "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  const files = res.data.files || []
  const byTitle = {}
  for (const f of files) byTitle[f.name] = f.id

  const sheets = google.sheets({ version: 'v4', auth })
  const map = {}

  for (const [key, title] of Object.entries(SHEET_TITLES)) {
    let spreadsheetId = byTitle[title]
    if (!spreadsheetId && folderId) {
      const created = await drive.files.create({
        requestBody: {
          name: title,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: [folderId],
        },
        fields: 'id',
        supportsAllDrives: true,
      })
      spreadsheetId = created.data.id
      await ensureHeaders(sheets, spreadsheetId, key)
    }
    map[key] = spreadsheetId
  }

  sheetIdCache = map
  return map
}

async function ensureHeaders(sheetsApi, spreadsheetId, sheetKey) {
  const headers = HEADERS[sheetKey]
  if (!headers) return
  const existing = await sheetsApi.spreadsheets.values.get({
    spreadsheetId,
    range: 'A1:Z1',
  }).catch(() => ({ data: { values: [] } }))
  if (existing.data.values?.[0]?.length) return
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers] },
  })
}

export async function initGoogleSheets() {
  if (!isGoogleSheetsEnabled()) return { ok: false, reason: 'disabled' }
  if (initPromise) return initPromise
  initPromise = (async () => {
    const auth = await getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const ids = await resolveSheetIds()
    for (const [key, spreadsheetId] of Object.entries(ids)) {
      if (spreadsheetId) await ensureHeaders(sheets, spreadsheetId, key)
    }
    return { ok: true, sheets: Object.keys(ids).length }
  })().catch((err) => {
    initPromise = null
    const friendly = formatGoogleDriveError(err.message)
    console.warn('[googleSheets] init failed:', err.message)
    return { ok: false, error: friendly, errorCode: classifyGoogleDriveError(err.message) }
  })
  return initPromise
}

function cell(v) {
  if (v == null) return ''
  return String(v).slice(0, 5000)
}

export async function appendSheetRow(sheetKey, row) {
  if (!isGoogleSheetsEnabled()) return false
  try {
    await initGoogleSheets()
    const auth = await getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const ids = await resolveSheetIds()
    const spreadsheetId = ids[sheetKey]
    if (!spreadsheetId) return false
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:Z',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row.map(cell)] },
    })
    return true
  } catch (err) {
    console.warn(`[googleSheets] append ${sheetKey}:`, err.message)
    return false
  }
}

async function getSheetRowCount(sheetKey) {
  if (!isGoogleSheetsEnabled()) return 0
  await initGoogleSheets()
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const ids = await resolveSheetIds()
  const spreadsheetId = ids[sheetKey]
  if (!spreadsheetId) return 0
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:A',
  }).catch(() => ({ data: { values: [] } }))
  const total = (res.data.values || []).length
  return Math.max(0, total - 1)
}

async function replaceSheetRows(sheetKey, dataRows) {
  if (!isGoogleSheetsEnabled()) return false
  await initGoogleSheets()
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const ids = await resolveSheetIds()
  const spreadsheetId = ids[sheetKey]
  if (!spreadsheetId) return false
  const headers = HEADERS[sheetKey]
  if (!headers) return false
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'A:Z' }).catch(() => {})
  const values = [headers, ...dataRows.map((row) => row.map(cell))]
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })
  return true
}

async function buildArchiveRows(db, sheetKey) {
  switch (sheetKey) {
    case 'users': {
      const users = await db.all(
        `SELECT id, personal_id, email, name, email_verified, password_changed_at, last_login_at, created_at
         FROM users ORDER BY created_at`
      )
      return users.map((u) => [
        u.created_at, u.personal_id, u.id, u.email, u.name,
        u.email_verified ? 'да' : 'нет',
        u.password_changed_at || '', u.last_login_at || '',
        'архив', 'регистрация',
      ])
    }
    case 'logins': {
      const users = await db.all(
        `SELECT id, personal_id, email, last_login_at FROM users
         WHERE last_login_at IS NOT NULL AND last_login_at != '' ORDER BY last_login_at`
      )
      return users.map((u) => [
        u.last_login_at, u.email, u.personal_id || '', u.id, 'вход', 'архив',
      ])
    }
    case 'purchases': {
      const purchases = await db.all('SELECT * FROM purchase_log ORDER BY date')
      return purchases.map((p) => [
        p.date, p.email, '', p.course_id, p.course_title, p.amount ?? '', 'архив', 'импорт',
      ])
    }
    case 'homework': {
      const hw = await db.all('SELECT * FROM homework ORDER BY COALESCE(updated_at, date)')
      return hw.map((h) => [
        h.updated_at || h.date, h.email, '', h.course_title, h.lesson_index, h.lesson_title,
        h.status, h.score ?? '', h.admin_comment || '', 'архив', h.id,
      ])
    }
    case 'reviews': {
      const reviews = await db.all('SELECT * FROM reviews ORDER BY date')
      return reviews.map((r) => [
        r.date, r.email, '', r.course_id, r.rating, r.status, (r.text || '').slice(0, 500), 'архив', r.id,
      ])
    }
    default:
      return []
  }
}

/** Заполнить пустые таблицы из БД при старте сервера. */
export async function bootstrapArchiveIfNeeded(db) {
  if (!isGoogleSheetsEnabled()) return { ok: false, skipped: true, reason: 'disabled' }
  await initGoogleSheets()
  const results = {}
  for (const key of ARCHIVE_SHEET_KEYS) {
    try {
      const count = await getSheetRowCount(key)
      if (count > 0) {
        results[key] = { action: 'skipped', rows: count }
        continue
      }
      const rows = await buildArchiveRows(db, key)
      await replaceSheetRows(key, rows)
      results[key] = { action: 'backfilled', rows: rows.length }
      console.log(`[googleSheets] bootstrap ${key}: ${rows.length} rows`)
    } catch (err) {
      results[key] = { action: 'error', error: err.message }
      console.warn(`[googleSheets] bootstrap ${key}:`, err.message)
    }
  }
  return { ok: true, results }
}

/** Полная перезапись основных таблиц из БД (без дубликатов). */
export async function refreshArchiveSheets(db, keys = ARCHIVE_SHEET_KEYS) {
  if (!isGoogleSheetsEnabled()) return { ok: false, error: 'disabled' }
  await initGoogleSheets()
  const counts = {}
  for (const key of keys) {
    const rows = await buildArchiveRows(db, key)
    await replaceSheetRows(key, rows)
    counts[key] = rows.length
  }
  await appendAudit('sync', '', '', 'Полная синхронизация БД → Google Sheets', counts)
  return { ok: true, counts, mode: 'replace' }
}

export async function appendAudit(type, email, personalId, description, meta = {}) {
  const now = new Date().toISOString()
  await appendSheetRow('audit', [
    now, type, email || '', personalId || '', description || '', JSON.stringify(meta).slice(0, 2000),
  ])
}

export function getSheetTitles() {
  return { ...SHEET_TITLES }
}

export function getDriveFolderUrl() {
  const id = config.googleSheets.folderId
  return id ? `https://drive.google.com/drive/folders/${id}` : null
}

export async function getSheetsStatus(db = null) {
  if (!isGoogleSheetsEnabled()) {
    return {
      enabled: false,
      folderUrl: getDriveFolderUrl(),
      message: 'Задайте GOOGLE_SERVICE_ACCOUNT_JSON и GOOGLE_DRIVE_FOLDER_ID на сервере',
    }
  }
  let folderInspection = null
  try {
    folderInspection = await inspectDriveFolder()
  } catch {
    folderInspection = { ok: false, reason: 'inspect_failed' }
  }

  const init = await initGoogleSheets()
  const ids = sheetIdCache || {}
  const credentials = getCredentials()
  const rowCounts = {}
  for (const key of ARCHIVE_SHEET_KEYS) {
    try {
      rowCounts[key] = await getSheetRowCount(key)
    } catch {
      rowCounts[key] = null
    }
  }

  let lastFullSync = null
  if (db) {
    try {
      const row = await db.get('SELECT value FROM analytics WHERE key = ?', [GOOGLE_SHEETS_LAST_SYNC_KEY])
      lastFullSync = row?.value ? JSON.parse(row.value) : null
    } catch {
      lastFullSync = null
    }
  }
  return {
    enabled: true,
    ok: init.ok,
    error: init.error,
    errorCode: init.errorCode,
    folderUrl: getDriveFolderUrl(),
    folderInspection,
    serviceAccountEmail: credentials?.client_email || null,
    realtime: true,
    lastFullSync,
    sheets: Object.entries(SHEET_TITLES).map(([key, title]) => ({
      key,
      title,
      spreadsheetId: ids[key] || null,
      url: ids[key] ? `https://docs.google.com/spreadsheets/d/${ids[key]}` : null,
      rowCount: rowCounts[key] ?? undefined,
      archive: ARCHIVE_SHEET_KEYS.includes(key),
    })),
  }
}

export async function exportSheetCsv(sheetKey) {
  if (!isGoogleSheetsEnabled()) throw new Error('Google Sheets disabled')
  await initGoogleSheets()
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const ids = await resolveSheetIds()
  const spreadsheetId = ids[sheetKey]
  if (!spreadsheetId) throw new Error('Sheet not found')
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:Z',
  })
  const rows = res.data.values || []
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((row) => row.map(escape).join(','))
  return '\uFEFF' + lines.join('\n')
}

export async function syncDatabaseToSheets(db) {
  if (!isGoogleSheetsEnabled()) return { ok: false, error: 'disabled' }

  const archive = await refreshArchiveSheets(db, ARCHIVE_SHEET_KEYS)

  const extraCounts = {}
  for (const [key, builder] of [
    ['registrations', async () => {
      const regs = await db.all('SELECT * FROM registrations ORDER BY date')
      return regs.map((r) => [r.date, r.personal_id, r.email, r.name, 'синхронизация'])
    }],
    ['certificates', async () => {
      const certs = await db.all('SELECT * FROM certificates ORDER BY date')
      return certs.map((c) => [c.date, c.email, '', c.course_id, c.course_title, c.score ?? '', 'синхронизация', c.id])
    }],
    ['applications', async () => {
      const apps = await db.all('SELECT * FROM accelerator_applications ORDER BY date')
      const rows = []
      for (const a of apps) {
        const granted = a.status === 'accepted' || await hasAcceleratorAccess(db, a.email)
        rows.push([a.date, a.email, a.first_name, a.last_name, a.telegram, a.status, a.admin_note || '', granted ? 'да' : 'нет', 'синхронизация', a.id])
      }
      return rows
    }],
    ['referrals', async () => {
      const refs = await db.all('SELECT * FROM referrals ORDER BY date')
      return refs.map((r) => [r.date, r.referrer_email, r.referred_email, r.referred_purchased ? 'да' : 'нет', 'синхронизация'])
    }],
  ]) {
    try {
      const count = await getSheetRowCount(key)
      if (count > 0) {
        extraCounts[key] = { skipped: count }
        continue
      }
      const rows = await builder()
      await replaceSheetRows(key, rows)
      extraCounts[key] = rows.length
    } catch (err) {
      extraCounts[key] = { error: err.message }
    }
  }

  const payload = {
    ok: true,
    counts: { ...archive.counts, ...extraCounts },
    mode: 'replace',
  }
  await writeLastFullSync(db, { at: new Date().toISOString(), counts: payload.counts })
  return payload
}

export const GOOGLE_SHEETS_LAST_SYNC_KEY = 'google_sheets_last_full_sync'

async function writeLastFullSync(db, payload) {
  try {
    await db.run(
      `INSERT INTO analytics (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [GOOGLE_SHEETS_LAST_SYNC_KEY, JSON.stringify(payload)]
    )
  } catch (err) {
    console.warn('[googleSheets] write last sync failed:', err.message)
  }
}
