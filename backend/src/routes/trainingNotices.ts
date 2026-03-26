import { Router } from 'express'
import { getTrainingNotices, createTrainingNotice, updateTrainingNotice, deleteTrainingNotice } from '../controllers/trainingNotices'
import { authMiddleware, trainingAdminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, getTrainingNotices)
router.post('/', authMiddleware, trainingAdminMiddleware, createTrainingNotice)
router.put('/:id', authMiddleware, trainingAdminMiddleware, updateTrainingNotice)
router.delete('/:id', authMiddleware, trainingAdminMiddleware, deleteTrainingNotice)

export default router
