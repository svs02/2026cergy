import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import multer from 'multer'

export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const ALLOWED_MEDIA_MIME = new Set([...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME])

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
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(new Error('허용되지 않는 이미지 형식입니다'))
      return
    }
    cb(null, true)
  },
})

export const galleryUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MEDIA_MIME.has(file.mimetype)) {
      callback(new Error('허용되지 않는 파일 형식입니다'))
      return
    }
    callback(null, true)
  },
})

export function mediaTypeFromMime(mime: string): 'image' | 'video' {
  return ALLOWED_VIDEO_MIME.has(mime) ? 'video' : 'image'
}
