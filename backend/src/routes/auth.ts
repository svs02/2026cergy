import { Router } from 'express'
import passport from 'passport'
import { env } from '../env'
import { User } from '../models/User'

export const authRouter = Router()

// Google OAuth
authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
authRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (_req, res) => {
    res.redirect(env.CLIENT_URL)
  }
)

// Naver OAuth
authRouter.get('/naver', passport.authenticate('naver'))
authRouter.get(
  '/naver/callback',
  passport.authenticate('naver', { failureRedirect: '/login' }),
  (_req, res) => {
    res.redirect(env.CLIENT_URL)
  }
)

// 로그아웃
authRouter.post('/logout', (req, res) => {
  req.logout((error: unknown) => {
    if (error) {
      res.status(500).json({ message: '로그아웃 실패' })
      return
    }
    res.json({ message: '로그아웃 완료' })
  })
})

// 현재 사용자 정보
authRouter.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: '로그인이 필요합니다' })
    return
  }
  res.json(req.user)
})

// 테스트 전용 로그인 — NODE_ENV=test 일 때만 활성화
if (process.env.NODE_ENV === 'test') {
  authRouter.post('/test-login', async (req, res) => {
    const { role } = req.body as { role?: string }
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER'

    const testUser = await User.findOneAndUpdate(
      { provider: 'google', providerId: 'test-user-id' },
      {
        provider: 'google',
        providerId: 'test-user-id',
        name: '테스트 사용자',
        email: 'test@example.com',
        role: userRole,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    req.login(testUser, (error: unknown) => {
      if (error) {
        res.status(500).json({ message: '테스트 로그인 실패' })
        return
      }
      res.json(testUser)
    })
  })
}
