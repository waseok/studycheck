import { Router } from 'express'
import { getTrainingNotices, createTrainingNotice, updateTrainingNotice, deleteTrainingNotice } from '../controllers/trainingNotices'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, getTrainingNotices)
router.post('/', authMiddleware, createTrainingNotice)
router.put('/:id', authMiddleware, updateTrainingNotice)
router.delete('/:id', authMiddleware, deleteTrainingNotice)

export default router
