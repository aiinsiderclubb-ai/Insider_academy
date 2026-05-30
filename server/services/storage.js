import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config, isS3Enabled } from '../config.js'

let s3Client = null

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
  const ext = path.extname(file.originalname || '') || ''
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
    }), { expiresIn: 3600 })
  }
  return `/api/files/${encodeURIComponent(storedPath)}`
}

export function resolveLocalFile(storedPath) {
  const full = path.join(config.uploadsDir, storedPath)
  if (!full.startsWith(config.uploadsDir)) return null
  return fs.existsSync(full) ? full : null
}
