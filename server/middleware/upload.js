import multer from 'multer'
import { config } from '../config.js'

const storage = multer.memoryStorage()

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
      'text/plain', 'text/markdown', 'application/json', 'application/zip',
    ]
    if (!allowed.includes(file.mimetype)) return cb(Object.assign(new Error('Unsupported file type'), { status: 400 }))
    cb(null, true)
  },
})

export function uploadsDir() {
  return config.uploadsDir
}
