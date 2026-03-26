import { Router } from 'express'
import { authMiddleware, adminMiddleware, trainingAdminMiddleware } from '../middleware/auth'
import { getSignatures, saveSignature, deleteSignature, syncSignatureStatus } from '../controllers/signatures'

const router = Router()

// 연수 서명 목록 조회 (로그인 필요)
router.get('/training/:trainingId', authMiddleware, getSignatures)

// 서명 저장 (본인)
router.post('/training/:trainingId', authMiddleware, saveSignature)

// 서명된 참여자 상태 일괄 동기화 (관리자)
router.post('/training/:trainingId/sync-status', authMiddleware, trainingAdminMiddleware, syncSignatureStatus)

// 서명 삭제 (관리자)
router.delete('/training/:trainingId/user/:userId', authMiddleware, trainingAdminMiddleware, deleteSignature)

export default router
