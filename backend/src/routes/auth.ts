import { Router } from 'express'
import passport from 'passport'
import { env } from '../env'

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
