import { Router } from 'express'
import { getTrainings, createTraining, updateTraining, deleteTraining, completeTraining } from '../controllers/trainings'
import { authMiddleware, adminMiddleware, trainingAdminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, getTrainings)
router.post('/', authMiddleware, trainingAdminMiddleware, createTraining)
router.put('/:id', authMiddleware, trainingAdminMiddleware, updateTraining)
router.delete('/:id', authMiddleware, trainingAdminMiddleware, deleteTraining)
router.patch('/:id/complete', authMiddleware, trainingAdminMiddleware, completeTraining)

export default router

