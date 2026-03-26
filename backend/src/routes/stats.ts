import { Router } from 'express'
import { getTrainingStats, getUserStats, getIncompleteList } from '../controllers/stats'
import { authMiddleware, trainingAdminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/training/:trainingId', authMiddleware, trainingAdminMiddleware, getTrainingStats)
router.get('/user/:userId', authMiddleware, trainingAdminMiddleware, getUserStats)
router.get('/incomplete', authMiddleware, trainingAdminMiddleware, getIncompleteList)

export default router

