import { google } from 'googleapis'
import { config } from '../config.js'

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
  applications: ['Дата', 'Email', 'Имя', 'Фамилия', 'Telegram', 'Статус', 'Заметка админа', 'Действие', 'ID заявки'],
  referrals: ['Дата', 'Email реферера', 'Email приглашённого', 'Купил', 'Действие'],
  registrations: ['Дата', 'Личный ID', 'Email', 'Имя', 'Действие'],
  audit: ['Дата', 'Тип', 'Email', 'Личный ID', 'Описание', 'Мета'],
}

let authClient = null
let sheetIdCache = null
let initPromise = null

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

async function resolveSheetIds() {
  if (sheetIdCache) return sheetIdCache
  const auth = await getAuth()
  const drive = google.drive({ version: 'v3', auth })
  const folderId = config.googleSheets.folderId
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
    console.warn('[googleSheets] init failed:', err.message)
    return { ok: false, error: err.message }
  })
  return initPromise
}

function cell(v) {
  if (v == null) return ''
  return String(v).slice(0, 5000)
}

export async function appendSheetRow(sheetKey, row) {
  if (!isGoogleSheetsEnabled()) return
  try {
    await initGoogleSheets()
    const auth = await getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const ids = await resolveSheetIds()
    const spreadsheetId = ids[sheetKey]
    if (!spreadsheetId) return
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:Z',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row.map(cell)] },
    })
  } catch (err) {
    console.warn(`[googleSheets] append ${sheetKey}:`, err.message)
  }
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

export async function getSheetsStatus() {
  if (!isGoogleSheetsEnabled()) {
    return {
      enabled: false,
      folderUrl: getDriveFolderUrl(),
      message: 'Задайте GOOGLE_SERVICE_ACCOUNT_JSON и GOOGLE_DRIVE_FOLDER_ID на сервере',
    }
  }
  const init = await initGoogleSheets()
  const ids = sheetIdCache || {}
  return {
    enabled: true,
    ok: init.ok,
    error: init.error,
    folderUrl: getDriveFolderUrl(),
    sheets: Object.entries(SHEET_TITLES).map(([key, title]) => ({
      key,
      title,
      spreadsheetId: ids[key] || null,
      url: ids[key] ? `https://docs.google.com/spreadsheets/d/${ids[key]}` : null,
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

  const users = await db.all(
    `SELECT id, personal_id, email, name, email_verified, password_changed_at, last_login_at, created_at FROM users ORDER BY created_at`
  )
  for (const u of users) {
    await appendSheetRow('users', [
      u.created_at, u.personal_id, u.id, u.email, u.name,
      u.email_verified ? 'да' : 'нет',
      u.password_changed_at || '', u.last_login_at || '',
      'синхронизация', 'полный импорт',
    ])
  }

  const regs = await db.all('SELECT * FROM registrations ORDER BY date')
  for (const r of regs) {
    await appendSheetRow('registrations', [r.date, r.personal_id, r.email, r.name, 'синхронизация'])
  }

  const purchases = await db.all('SELECT * FROM purchase_log ORDER BY date')
  for (const p of purchases) {
    await appendSheetRow('purchases', [
      p.date, p.email, '', p.course_id, p.course_title, p.amount ?? '', 'синхронизация', 'импорт',
    ])
  }

  const hw = await db.all('SELECT * FROM homework ORDER BY date')
  for (const h of hw) {
    await appendSheetRow('homework', [
      h.updated_at || h.date, h.email, '', h.course_title, h.lesson_index, h.lesson_title,
      h.status, h.score ?? '', h.admin_comment || '', 'синхронизация', h.id,
    ])
  }

  const reviews = await db.all('SELECT * FROM reviews ORDER BY date')
  for (const r of reviews) {
    await appendSheetRow('reviews', [
      r.date, r.email, '', r.course_id, r.rating, r.status, (r.text || '').slice(0, 500), 'синхронизация', r.id,
    ])
  }

  const certs = await db.all('SELECT * FROM certificates ORDER BY date')
  for (const c of certs) {
    await appendSheetRow('certificates', [
      c.date, c.email, '', c.course_id, c.course_title, c.score ?? '', 'синхронизация', c.id,
    ])
  }

  const apps = await db.all('SELECT * FROM accelerator_applications ORDER BY date')
  for (const a of apps) {
    await appendSheetRow('applications', [
      a.date, a.email, a.first_name, a.last_name, a.telegram, a.status, a.admin_note || '', 'синхронизация', a.id,
    ])
  }

  const refs = await db.all('SELECT * FROM referrals ORDER BY date')
  for (const r of refs) {
    await appendSheetRow('referrals', [
      r.date, r.referrer_email, r.referred_email, r.referred_purchased ? 'да' : 'нет', 'синхронизация',
    ])
  }

  await appendAudit('sync', '', '', 'Полная синхронизация БД → Google Sheets', {
    users: users.length,
    purchases: purchases.length,
    homework: hw.length,
  })

  return { ok: true, counts: { users: users.length, purchases: purchases.length, homework: hw.length, reviews: reviews.length } }
}
