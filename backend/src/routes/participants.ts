import { Router } from 'express'
import { getParticipants, updateCompletionNumber, getMyTrainings } from '../controllers/participants'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/training/:trainingId', authMiddleware, getParticipants)
router.get('/my-trainings', authMiddleware, getMyTrainings)
router.put('/:id/completion-number', authMiddleware, updateCompletionNumber)

export default router

