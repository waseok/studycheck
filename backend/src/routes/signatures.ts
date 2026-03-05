import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth'
import { getSignatures, saveSignature, deleteSignature } from '../controllers/signatures'

const router = Router()

// 연수 서명 목록 조회 (로그인 필요)
router.get('/training/:trainingId', authMiddleware, getSignatures)

// 서명 저장 (본인)
router.post('/training/:trainingId', authMiddleware, saveSignature)

// 서명 삭제 (관리자)
router.delete('/training/:trainingId/user/:userId', authMiddleware, adminMiddleware, deleteSignature)

export default router
