import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// 개발 환경 기본값을 프로젝트 전역에서 통일
const DEFAULT_DEV_SECRET = 'unified-dev-secret-2025'
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET

// JWT 토큰 검증을 위한 인터페이스
interface AuthRequest extends Request {
  user?: {
    userId?: string
    email?: string
    isAdmin: boolean
    role?: string
    mustSetPin?: boolean
    loginTime: number
  }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    // 디버깅: 요청 헤더 확인
    if (process.env.NODE_ENV === 'development') {
      console.log('인증 미들웨어:', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!authHeader,
        authHeader: authHeader ? authHeader.substring(0, 20) + '...' : '없음',
      })
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('인증 토큰이 없거나 형식이 잘못되었습니다:', {
          path: req.path,
          authHeader: authHeader || '없음',
        })
      }
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' })
    }

    const token = authHeader.substring(7) // 'Bearer ' 제거

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; email?: string; isAdmin: boolean; role?: string; mustSetPin?: boolean; loginTime: number }
      req.user = decoded
      if (process.env.NODE_ENV === 'development') {
        console.log('토큰 검증 성공:', { path: req.path, userId: decoded.userId, isAdmin: decoded.isAdmin, role: decoded.role })
      }
      next()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('토큰 검증 실패:', {
          path: req.path,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        })
      }
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' })
  }
}

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Admin middleware check:', {
      path: req.path,
      hasUser: !!req.user,
      isAdmin: req.user?.isAdmin,
      role: req.user?.role,
      userId: req.user?.userId,
    })
  }
  
  if (!req.user) {
    return res.status(403).json({ error: '인증이 필요합니다.' })
  }
  
  if (!req.user.isAdmin) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('❌ Admin 권한 없음:', {
        isAdmin: req.user.isAdmin,
        role: req.user.role,
      })
    }
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' })
  }
  
  next()
}

