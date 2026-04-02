import { Router } from 'express'
import { authMiddleware, trainingAdminMiddleware } from '../middleware/auth'
import { getGroups, createGroup, updateGroup, deleteGroup, addGroupMembers, removeGroupMember } from '../controllers/groups'

const router = Router()

router.get('/', authMiddleware, getGroups)
router.post('/', authMiddleware, trainingAdminMiddleware, createGroup)
router.put('/:id', authMiddleware, trainingAdminMiddleware, updateGroup)
router.delete('/:id', authMiddleware, trainingAdminMiddleware, deleteGroup)
router.post('/:id/members', authMiddleware, trainingAdminMiddleware, addGroupMembers)
router.delete('/:id/members/:userId', authMiddleware, trainingAdminMiddleware, removeGroupMember)

export default router
