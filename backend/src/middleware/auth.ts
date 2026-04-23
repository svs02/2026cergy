import type { Request, Response, NextFunction } from 'express'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: '로그인이 필요합니다' })
    return
  }
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: '로그인이 필요합니다' })
    return
  }
  const user = req.user as { role?: string }
  if (user.role !== 'ADMIN') {
    res.status(403).json({ message: '관리자 권한이 필요합니다' })
    return
  }
  next()
}
