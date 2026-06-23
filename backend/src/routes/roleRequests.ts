import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth'
import { createRequest, listRequests, approveRequest, rejectRequest } from '../controllers/roleRequests'

const router = Router()

router.post('/', authMiddleware, createRequest)
router.get('/', authMiddleware, listRequests)
router.patch('/:id/approve', authMiddleware, adminMiddleware, approveRequest)
router.patch('/:id/reject', authMiddleware, adminMiddleware, rejectRequest)

export default router
