import { Router } from 'express'
import { z } from 'zod/v4'
import bcrypt from 'bcryptjs'
import { env } from '../env'
import { sendAdminLoginNotification } from '../lib/email'

export const authRouter = Router()

const loginSchema = z.strictObject({
  password: z.string().min(1),
})

authRouter.post('/admin/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다' })
      return
    }

    const isMatch = await bcrypt.compare(parsed.data.password, env.ADMIN_PASSWORD_HASH)
    if (!isMatch) {
      res.status(401).json({ error: '비밀번호가 올바르지 않습니다' })
      return
    }

    req.session.isAdmin = true

    void sendAdminLoginNotification({
      ip: req.ip ?? 'unknown',
      userAgent: req.get('user-agent') ?? 'unknown',
      when: new Date(),
    })

    res.json({ isAdmin: true })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/admin/logout', (req, res) => {
  req.session.destroy((error: unknown) => {
    if (error) {
      res.status(500).json({ error: '로그아웃에 실패했습니다' })
      return
    }
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

authRouter.get('/admin/me', (req, res) => {
  res.json({ isAdmin: !!req.session?.isAdmin })
})
