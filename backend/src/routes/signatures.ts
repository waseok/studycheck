import { Router } from 'express'
import { authMiddleware, trainingAdminMiddleware } from '../middleware/auth'
import {
  getSignatures, saveSignature, deleteSignature, syncSignatureStatus,
  createTrainingSignatureLink, getTrainingSignaturesByAccessToken, saveTrainingSignatureByAccessToken
} from '../controllers/signatures'

const router = Router()

// 연수 서명 목록 조회 (로그인 필요)
router.get('/training/:trainingId', authMiddleware, getSignatures)

// 서명 저장 (본인)
router.post('/training/:trainingId', authMiddleware, saveSignature)

// 서명된 참여자 상태 일괄 동기화 (관리자)
router.post('/training/:trainingId/sync-status', authMiddleware, trainingAdminMiddleware, syncSignatureStatus)

// 서명 삭제 (관리자)
router.delete('/training/:trainingId/user/:userId', authMiddleware, trainingAdminMiddleware, deleteSignature)

// 참여자별 무로그인 서명 링크 생성 (관리자)
router.post('/training/:trainingId/share-link', authMiddleware, trainingAdminMiddleware, createTrainingSignatureLink)

// 무로그인 서명 전용 조회/저장
router.get('/public/training/:trainingId', getTrainingSignaturesByAccessToken)
router.post('/public/training/:trainingId', saveTrainingSignatureByAccessToken)

export default router
