import { Router } from 'express'
import { login, loginInitial, loginPin, setPin } from '../controllers/auth'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/login', login) // 관리자용 (호환성)
router.post('/login-initial', loginInitial) // 초기 비번 로그인
router.post('/login-pin', loginPin) // PIN 로그인
router.post('/set-pin', authMiddleware, setPin) // PIN 설정 (인증 필요)

export default router

