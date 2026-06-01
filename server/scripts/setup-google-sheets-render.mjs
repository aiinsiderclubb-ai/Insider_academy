#!/usr/bin/env node
/**
 * Полная настройка Google Sheets → Render.
 *
 * Вариант A (есть JSON-ключ):
 *   RENDER_API_KEY=rnd_... node server/scripts/setup-google-sheets-render.mjs --key ./path/to/key.json
 *
 * Вариант B (создать SA через gcloud — нужен gcloud auth login):
 *   RENDER_API_KEY=rnd_... node server/scripts/setup-google-sheets-render.mjs --create
 *
 * После скрипта: поделитесь папкой Drive с email service account (Редактор).
 */

import { execSync, spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RENDER_API = 'https://api.render.com/v1'
const SERVICE_ID = process.env.RENDER_SERVICE_ID || 'srv-d8e558vavr4c738cuis0'
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1JlbsIBxryW8dSemF4XSySdcVabqwxghh'
const GCP_PROJECT = process.env.GCP_PROJECT || 'insider-academy-sheets'
const SA_NAME = process.env.GCP_SA_NAME || 'insider-sheets-bot'
const SA_DISPLAY = 'Insider Academy Sheets Bot'

const args = process.argv.slice(2)
const keyPathArg = args.includes('--key') ? args[args.indexOf('--key') + 1] : null
const createSa = args.includes('--create')

function requireRenderKey() {
  const key = process.env.RENDER_API_KEY
  if (!key) {
    console.error('❌ Задайте RENDER_API_KEY (Render Dashboard → Account → API Keys)')
    process.exit(1)
  }
  return key
}

async function renderFetch(method, urlPath, body) {
  const res = await fetch(`${RENDER_API}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${requireRenderKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) throw new Error(`Render API ${res.status}: ${text.slice(0, 300)}`)
  return data
}

async function setRenderEnvVars(pairs) {
  for (const { key, value } of pairs) {
    await renderFetch('PUT', `/services/${SERVICE_ID}/env-vars/${encodeURIComponent(key)}`, { value })
    console.log(`✓ Render env: ${key}`)
  }
}

async function triggerDeploy() {
  const data = await renderFetch('POST', `/services/${SERVICE_ID}/deploys`, { clearCache: 'do_not_clear' })
  console.log('✓ Deploy triggered:', data?.id || data)
}

function minifyJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = JSON.parse(raw)
  if (!parsed.client_email || parsed.type !== 'service_account') {
    throw new Error('Файл не похож на Google Service Account JSON')
  }
  return { oneLine: JSON.stringify(parsed), email: parsed.client_email, projectId: parsed.project_id }
}

function gcloud(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
}

function createServiceAccountKey() {
  console.log('\n→ Создание Service Account через gcloud…')
  try {
    gcloud('gcloud auth list --filter=status:ACTIVE --format="value(account)"')
  } catch {
    console.error('❌ gcloud не авторизован. Выполните: gcloud auth login')
    process.exit(1)
  }

  try {
    gcloud(`gcloud projects describe ${GCP_PROJECT} --format="value(projectId)"`)
  } catch {
    console.log(`→ Создаём проект ${GCP_PROJECT}…`)
    gcloud(`gcloud projects create ${GCP_PROJECT} --name="Insider Academy Sheets"`)
  }

  gcloud(`gcloud config set project ${GCP_PROJECT}`)
  for (const api of ['sheets.googleapis.com', 'drive.googleapis.com']) {
    try {
      gcloud(`gcloud services enable ${api} --project=${GCP_PROJECT}`)
      console.log(`✓ API enabled: ${api}`)
    } catch (err) {
      console.warn(`⚠ ${api}:`, err.message?.slice(0, 120))
    }
  }

  const saEmail = `${SA_NAME}@${GCP_PROJECT}.iam.gserviceaccount.com`
  try {
    gcloud(`gcloud iam service-accounts describe ${saEmail} --project=${GCP_PROJECT}`)
  } catch {
    gcloud(`gcloud iam service-accounts create ${SA_NAME} --display-name="${SA_DISPLAY}" --project=${GCP_PROJECT}`)
    console.log(`✓ Service account: ${saEmail}`)
  }

  const outPath = path.join(__dirname, '..', 'data', 'google-sheets-key.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  gcloud(`gcloud iam service-accounts keys create "${outPath}" --iam-account=${saEmail} --project=${GCP_PROJECT}`)
  console.log(`✓ Key saved: ${outPath}`)
  return minifyJson(outPath)
}

async function waitForHealth(maxSec = 180) {
  const url = process.env.API_URL || 'https://insider-academy.onrender.com/api/health'
  const start = Date.now()
  while (Date.now() - start < maxSec * 1000) {
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (data.features?.googleSheets) {
        console.log('✅ googleSheets: true на', url)
        return true
      }
      console.log('… ждём деплой, googleSheets:', data.features?.googleSheets)
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 10000))
  }
  return false
}

async function main() {
  let jsonOneLine
  let clientEmail

  if (keyPathArg) {
    const abs = path.resolve(keyPathArg)
    if (!fs.existsSync(abs)) {
      console.error('❌ Файл не найден:', abs)
      process.exit(1)
    }
    const parsed = minifyJson(abs)
    jsonOneLine = parsed.oneLine
    clientEmail = parsed.email
  } else if (createSa) {
    const parsed = createServiceAccountKey()
    jsonOneLine = parsed.oneLine
    clientEmail = parsed.email
  } else {
    console.log(`Использование:
  --key ./key.json     загрузить существующий JSON на Render
  --create             создать SA через gcloud (нужен gcloud auth login)

  RENDER_API_KEY=rnd_... node server/scripts/setup-google-sheets-render.mjs --key ./key.json`)
    process.exit(0)
  }

  console.log('\n→ Обновление Render env…')
  await setRenderEnvVars([
    { key: 'GOOGLE_SHEETS_ENABLED', value: '1' },
    { key: 'GOOGLE_DRIVE_FOLDER_ID', value: FOLDER_ID },
    { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', value: jsonOneLine },
  ])

  console.log('\n→ Запуск деплоя API…')
  await triggerDeploy()

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  ВАЖНО: Google Drive → папка «AI Insider Academy»')
  console.log('    Поделиться → добавить Редактором:')
  console.log('   ', clientEmail)
  console.log('    https://drive.google.com/drive/folders/' + FOLDER_ID)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('→ Проверка /api/health (до 3 мин)…')
  const ok = await waitForHealth()
  if (!ok) {
    console.log('⚠️  Деплой ещё идёт. После завершения проверьте:')
    console.log('   curl https://insider-academy.onrender.com/api/health')
    console.log('   → features.googleSheets должно быть true')
    console.log('\n   Затем в админке: Настройки → Google Таблицы → Обновить архив из БД')
  }
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
