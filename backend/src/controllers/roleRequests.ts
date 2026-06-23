import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import {
  createRoleRequest,
  getPendingRoleRequests,
  getRoleRequestsByUserId,
  updateRoleRequest,
} from '../services/roleRequestStore'

type AppRole = 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER'

const getUserRole = (user: { role?: string | null; isAdmin: boolean }): AppRole => {
  if (user.role === 'SUPER_ADMIN' || user.isAdmin) return 'SUPER_ADMIN'
  if (user.role === 'TRAINING_ADMIN') return 'TRAINING_ADMIN'
  return 'USER'
}

// 연수 관리 권한 요청 생성 (일반 사용자만)
export const createRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    if (!userId) return res.status(401).json({ error: '인증이 필요합니다.' })

    const { message } = req.body as { message?: string }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '요청 사유를 입력해주세요.' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })

    const role = getUserRole(user)
    if (role !== 'USER') {
      return res.status(400).json({ error: '이미 연수 관리 권한이 있거나 요청할 수 없는 계정입니다.' })
    }

    const request = await createRoleRequest(userId, message.trim())
    res.status(201).json({ success: true, request })
  } catch (error) {
    if (error instanceof Error && error.message === 'PENDING_EXISTS') {
      return res.status(400).json({ error: '이미 검토 중인 권한 요청이 있습니다.' })
    }
    console.error('Create role request error:', error)
    res.status(500).json({ error: '권한 요청 중 오류가 발생했습니다.' })
  }
}

// 권한 요청 목록 (최고관리자: 대기 목록 / 본인: 내 요청 이력)
export const listRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    const isAdmin = (req as any).user?.isAdmin === true

    if (!userId) return res.status(401).json({ error: '인증이 필요합니다.' })

    if (isAdmin) {
      const pending = await getPendingRoleRequests()
      const userIds = [...new Set(pending.map((r) => r.userId))]
      const users = userIds.length
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, userType: true, position: true },
          })
        : []
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

      return res.json({
        requests: pending.map((r) => ({
          ...r,
          user: userMap[r.userId] || null,
        })),
      })
    }

    const myRequests = await getRoleRequestsByUserId(userId)
    res.json({ requests: myRequests })
  } catch (error) {
    console.error('List role requests error:', error)
    res.status(500).json({ error: '권한 요청 목록 조회 중 오류가 발생했습니다.' })
  }
}

// 권한 요청 승인 (최고관리자만)
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.userId
    const isAdmin = (req as any).user?.isAdmin === true
    const { id } = req.params

    if (!adminId || !isAdmin) {
      return res.status(403).json({ error: '최고 관리자 권한이 필요합니다.' })
    }

    const allPending = await getPendingRoleRequests()
    const target = allPending.find((r) => r.id === id)
    if (!target) {
      return res.status(404).json({ error: '대기 중인 권한 요청을 찾을 수 없습니다.' })
    }

    const user = await prisma.user.findUnique({ where: { id: target.userId } })
    if (!user) {
      return res.status(404).json({ error: '요청자를 찾을 수 없습니다.' })
    }

    await prisma.user.update({
      where: { id: target.userId },
      data: { role: 'TRAINING_ADMIN', isAdmin: false },
    })

    const updated = await updateRoleRequest(id, {
      status: 'APPROVED',
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
    })

    res.json({ success: true, request: updated, message: '연수 관리 권한이 승인되었습니다.' })
  } catch (error) {
    console.error('Approve role request error:', error)
    res.status(500).json({ error: '권한 승인 중 오류가 발생했습니다.' })
  }
}

// 권한 요청 거절 (최고관리자만, 거절 사유 필수)
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.userId
    const isAdmin = (req as any).user?.isAdmin === true
    const { id } = req.params
    const { rejectReason } = req.body as { rejectReason?: string }

    if (!adminId || !isAdmin) {
      return res.status(403).json({ error: '최고 관리자 권한이 필요합니다.' })
    }

    if (!rejectReason || !rejectReason.trim()) {
      return res.status(400).json({ error: '거절 사유를 입력해주세요.' })
    }

    const allPending = await getPendingRoleRequests()
    const target = allPending.find((r) => r.id === id)
    if (!target) {
      return res.status(404).json({ error: '대기 중인 권한 요청을 찾을 수 없습니다.' })
    }

    const updated = await updateRoleRequest(id, {
      status: 'REJECTED',
      rejectReason: rejectReason.trim(),
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
    })

    res.json({ success: true, request: updated, message: '권한 요청이 거절되었습니다.' })
  } catch (error) {
    console.error('Reject role request error:', error)
    res.status(500).json({ error: '권한 거절 중 오류가 발생했습니다.' })
  }
}
