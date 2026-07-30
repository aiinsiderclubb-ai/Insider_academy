import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config, isS3Enabled } from '../config.js'
import { safeSecretEqual } from '../utils/security.js'

let s3Client = null
const EXTENSION_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/json': '.json',
  'application/zip': '.zip',
}

function getS3() {
  if (!s3Client && isS3Enabled()) {
    s3Client = new S3Client({
      region: config.storage.s3.region,
      credentials: {
        accessKeyId: config.storage.s3.accessKey,
        secretAccessKey: config.storage.s3.secretKey,
      },
      ...(config.storage.s3.endpoint ? { endpoint: config.storage.s3.endpoint, forcePathStyle: true } : {}),
    })
  }
  return s3Client
}

function ensureLocalDir(subdir) {
  const dir = path.join(config.uploadsDir, subdir)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export async function saveUploadedFile(file, subdir = 'homework') {
  const ext = EXTENSION_BY_MIME[file.mimetype]
  if (!ext) throw Object.assign(new Error('Unsupported file type'), { status: 400 })
  const key = `${subdir}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`

  if (isS3Enabled()) {
    const client = getS3()
    await client.send(new PutObjectCommand({
      Bucket: config.storage.s3.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }))
    return { key, storage: 's3', fileName: file.originalname, fileType: file.mimetype }
  }

  const dir = ensureLocalDir(subdir)
  const localPath = path.join(dir, path.basename(key))
  fs.writeFileSync(localPath, file.buffer)
  return { key, storage: 'local', fileName: file.originalname, fileType: file.mimetype, localPath }
}

export async function getFileUrl(storedPath, storage = 'local') {
  if (!storedPath) return null
  if (storage === 's3' || isS3Enabled()) {
    const client = getS3()
    if (!client) return null
    return getSignedUrl(client, new GetObjectCommand({
      Bucket: config.storage.s3.bucket,
      Key: storedPath,
    }), { expiresIn: 15 * 60 })
  }
  const expires = Math.floor(Date.now() / 1000) + 15 * 60
  const signature = signLocalFile(storedPath, expires)
  return `/api/files/${encodeURIComponent(storedPath)}?expires=${expires}&signature=${signature}`
}

export function resolveLocalFile(storedPath) {
  const key = String(storedPath || '')
  if (!key || key.includes('\0') || path.isAbsolute(key) || key.split(/[\\/]/).includes('..')) return null
  const root = path.resolve(config.uploadsDir)
  const full = path.resolve(root, key)
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) return null
  return fs.existsSync(full) && fs.statSync(full).isFile() ? full : null
}

function signLocalFile(storedPath, expires) {
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${storedPath}:${expires}`)
    .digest('hex')
}

export function verifyLocalFileSignature(storedPath, expires, signature) {
  const expiration = Number(expires)
  if (!Number.isInteger(expiration) || expiration < Math.floor(Date.now() / 1000)) return false
  if (expiration > Math.floor(Date.now() / 1000) + 60 * 60) return false
  return safeSecretEqual(signature, signLocalFile(storedPath, expiration))
}
