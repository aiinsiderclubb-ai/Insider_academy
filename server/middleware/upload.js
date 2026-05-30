import multer from 'multer'
import { config } from '../config.js'

const storage = multer.memoryStorage()

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
      'text/plain', 'application/zip',
    ]
    cb(null, allowed.includes(file.mimetype) || file.mimetype.startsWith('text/'))
  },
})

export function uploadsDir() {
  return config.uploadsDir
}
