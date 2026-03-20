import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth'
import {
  getMeetings, getMeeting, createMeeting, updateMeeting,
  deleteMeeting, completeMeeting, addParticipants, removeParticipant,
  saveMeetingSignature, deleteMeetingSignature
} from '../controllers/meetings'

const router = Router()

router.get('/', authMiddleware, getMeetings)
router.get('/:id', authMiddleware, getMeeting)
router.post('/', authMiddleware, adminMiddleware, createMeeting)
router.put('/:id', authMiddleware, adminMiddleware, updateMeeting)
router.put('/:id/complete', authMiddleware, adminMiddleware, completeMeeting)
router.delete('/:id', authMiddleware, adminMiddleware, deleteMeeting)
router.post('/:id/participants', authMiddleware, adminMiddleware, addParticipants)
router.delete('/:id/participants/:userId', authMiddleware, adminMiddleware, removeParticipant)
router.post('/:id/signature', authMiddleware, saveMeetingSignature)
router.delete('/:id/signature/:userId', authMiddleware, adminMiddleware, deleteMeetingSignature)

export default router
