import path from 'path'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { env } from './env'

import { authRouter } from './routes/auth'
import { noticeRouter } from './routes/notice'
import { galleryRouter } from './routes/gallery'
import { uploadRouter } from './routes/upload'
import { Notice } from './models/Notice'
import { Gallery } from './models/Gallery'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
)

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
)

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRouter)
app.use('/api/notices', noticeRouter)
app.use('/api/gallery', galleryRouter)
app.use('/api/upload', uploadRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

if (process.env.NODE_ENV === 'test') {
  app.post('/api/test/reset', async (_req, res, next) => {
    try {
      await Promise.all([Notice.deleteMany({}), Gallery.deleteMany({})])
      res.json({ ok: true })
    } catch (error) {
      next(error)
    }
  })
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as { name?: string; message?: string; statusCode?: number }
  if (error?.name === 'DocumentNotFoundError') {
    res.status(404).json({ error: '존재하지 않는 리소스입니다' })
    return
  }
  if (error?.name === 'CastError') {
    res.status(400).json({ error: '잘못된 식별자입니다' })
    return
  }
  console.error(err)
  res.status(500).json({ error: '서버 오류가 발생했습니다' })
})

export default app
