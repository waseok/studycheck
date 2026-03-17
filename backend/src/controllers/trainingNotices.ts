import { Request, Response } from 'express'
import prisma from '../utils/prisma'

interface AuthRequest extends Request {
  user?: {
    userId?: string
    isAdmin: boolean
    role?: string
    loginTime: number
  }
}

export const getTrainingNotices = async (_req: Request, res: Response) => {
  try {
    const notices = await prisma.trainingNotice.findMany({
      orderBy: { order: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    })
    res.json(notices)
  } catch (error) {
    console.error('Get training notices error:', error)
    res.status(500).json({ error: '연수 안내 목록 조회 중 오류가 발생했습니다.' })
  }
}

export const createTrainingNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { order, name, targetUsers, hours, manager, method } = req.body
    if (!name) return res.status(400).json({ error: '연수명을 입력해주세요.' })

    const notice = await prisma.trainingNotice.create({
      data: {
        order: parseInt(order) || 1,
        name,
        targetUsers: targetUsers || null,
        hours: hours || null,
        manager: manager || null,
        method: method || null,
        createdById: req.user!.userId!,
      },
      include: { createdBy: { select: { id: true, name: true } } }
    })
    res.status(201).json(notice)
  } catch (error) {
    console.error('Create training notice error:', error)
    res.status(500).json({ error: '연수 안내 등록 중 오류가 발생했습니다.' })
  }
}

export const updateTrainingNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { order, name, targetUsers, hours, manager, method } = req.body
    if (!name) return res.status(400).json({ error: '연수명을 입력해주세요.' })

    const notice = await prisma.trainingNotice.update({
      where: { id },
      data: {
        order: parseInt(order) || 1,
        name,
        targetUsers: targetUsers || null,
        hours: hours || null,
        manager: manager || null,
        method: method || null,
      },
      include: { createdBy: { select: { id: true, name: true } } }
    })
    res.json(notice)
  } catch (error) {
    console.error('Update training notice error:', error)
    res.status(500).json({ error: '연수 안내 수정 중 오류가 발생했습니다.' })
  }
}

export const deleteTrainingNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.trainingNotice.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete training notice error:', error)
    res.status(500).json({ error: '연수 안내 삭제 중 오류가 발생했습니다.' })
  }
}
