import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from 'passport'
import MongoStore from 'connect-mongo'
import { env } from './env'
import './lib/passport'

import { authRouter } from './routes/auth'
import { postRouter } from './routes/post'
import { galleryRouter } from './routes/gallery'

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
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7일
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.use('/api/auth', authRouter)
app.use('/api/posts', postRouter)
app.use('/api/gallery', galleryRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default app
