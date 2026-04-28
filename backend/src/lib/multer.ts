import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import multer from 'multer'

export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now()
    const randomHex = crypto.randomBytes(6).toString('hex')
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${timestamp}-${randomHex}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('허용되지 않는 이미지 형식입니다'))
      return
    }
    cb(null, true)
  },
})
