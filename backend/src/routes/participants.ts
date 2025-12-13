import { Router } from 'express'
import { getParticipants, updateCompletionNumber, getMyTrainings, cleanupDuplicates } from '../controllers/participants'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/training/:trainingId', authMiddleware, getParticipants)
router.get('/my-trainings', authMiddleware, getMyTrainings)
router.put('/:id/completion-number', authMiddleware, updateCompletionNumber)
router.post('/cleanup-duplicates', authMiddleware, adminMiddleware, cleanupDuplicates)

export default router

