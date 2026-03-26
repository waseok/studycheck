import { Router } from 'express'
import { authMiddleware, trainingAdminMiddleware } from '../middleware/auth'
import {
  getMeetings, getMeeting, createMeeting, updateMeeting,
  deleteMeeting, completeMeeting, addParticipants, removeParticipant,
  saveMeetingSignature, deleteMeetingSignature
} from '../controllers/meetings'

const router = Router()

router.get('/', authMiddleware, getMeetings)
router.get('/:id', authMiddleware, getMeeting)
router.post('/', authMiddleware, trainingAdminMiddleware, createMeeting)
router.put('/:id', authMiddleware, trainingAdminMiddleware, updateMeeting)
router.put('/:id/complete', authMiddleware, trainingAdminMiddleware, completeMeeting)
router.delete('/:id', authMiddleware, trainingAdminMiddleware, deleteMeeting)
router.post('/:id/participants', authMiddleware, trainingAdminMiddleware, addParticipants)
router.delete('/:id/participants/:userId', authMiddleware, trainingAdminMiddleware, removeParticipant)
router.post('/:id/signature', authMiddleware, saveMeetingSignature)
router.delete('/:id/signature/:userId', authMiddleware, trainingAdminMiddleware, deleteMeetingSignature)

export default router
