import { Router } from 'express'
import { getTrainings, createTraining, updateTraining, deleteTraining, completeTraining } from '../controllers/trainings'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, getTrainings)
router.post('/', authMiddleware, adminMiddleware, createTraining)
router.put('/:id', authMiddleware, adminMiddleware, updateTraining)
router.delete('/:id', authMiddleware, adminMiddleware, deleteTraining)
router.patch('/:id/complete', authMiddleware, adminMiddleware, completeTraining)

export default router

