import { Router } from 'express'
import { getTrainingStats, getUserStats, getIncompleteList } from '../controllers/stats'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/training/:trainingId', authMiddleware, adminMiddleware, getTrainingStats)
router.get('/user/:userId', authMiddleware, adminMiddleware, getUserStats)
router.get('/incomplete', authMiddleware, adminMiddleware, getIncompleteList)

export default router

