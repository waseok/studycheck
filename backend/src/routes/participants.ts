import { Router } from 'express'
import { getParticipants, updateCompletionNumber, getMyTrainings, cleanupDuplicates, cancelCompletion, addParticipant, removeParticipant } from '../controllers/participants'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/training/:trainingId', authMiddleware, getParticipants)
router.get('/my-trainings', authMiddleware, getMyTrainings)
router.put('/:id/completion-number', authMiddleware, updateCompletionNumber)
router.put('/:id/cancel-completion', authMiddleware, cancelCompletion)
router.post('/cleanup-duplicates', authMiddleware, adminMiddleware, cleanupDuplicates)
router.post('/training/:trainingId/add', authMiddleware, adminMiddleware, addParticipant)
router.delete('/training/:trainingId/user/:userId', authMiddleware, adminMiddleware, removeParticipant)

export default router

