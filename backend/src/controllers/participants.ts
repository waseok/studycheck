import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export const getParticipants = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params

    const participants = await prisma.trainingParticipant.findMany({
      where: { trainingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        },
        training: {
          select: {
            id: true,
            name: true,
            deadline: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    res.json(participants)
  } catch (error) {
    console.error('Get participants error:', error)
    res.status(500).json({ error: '참여자 목록 조회 중 오류가 발생했습니다.' })
  }
}

export const getMyTrainings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' })
    }

    // 사용자 ID로 참여한 연수만 조회
    const participants = await prisma.trainingParticipant.findMany({
      where: { userId },
      include: {
        training: {
          select: {
            id: true,
            name: true,
            deadline: true,
            targetUsers: true,
            department: true,
            manager: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        training: {
          deadline: 'desc'
        }
      }
    })

    res.json(participants)
  } catch (error) {
    console.error('Get my trainings error:', error)
    res.status(500).json({ error: '내 연수 목록 조회 중 오류가 발생했습니다.' })
  }
}

export const updateCompletionNumber = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { completionNumber } = req.body
    const userId = (req as any).user?.userId
    const isAdmin = (req as any).user?.isAdmin

    if (!completionNumber) {
      return res.status(400).json({ error: '이수번호를 입력해주세요.' })
    }

    // 참여자 정보 조회
    const participant = await prisma.trainingParticipant.findUnique({
      where: { id },
      include: {
        user: true
      }
    })

    if (!participant) {
      return res.status(404).json({ error: '참여자를 찾을 수 없습니다.' })
    }

    // 관리자가 아니면 본인 것만 수정 가능
    if (!isAdmin && participant.userId !== userId) {
      return res.status(403).json({ error: '본인의 이수번호만 수정할 수 있습니다.' })
    }

    // 이수번호 업데이트
    const updated = await prisma.trainingParticipant.update({
      where: { id },
      data: {
        completionNumber,
        status: 'completed',
        completedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        training: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.json(updated)
  } catch (error) {
    console.error('Update completion number error:', error)
    res.status(500).json({ error: '이수번호 입력 중 오류가 발생했습니다.' })
  }
}

