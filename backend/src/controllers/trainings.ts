import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export const getTrainings = async (req: Request, res: Response) => {
  try {
    const trainings = await prisma.training.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true
              }
            }
          }
        }
      }
    })
    res.json(trainings)
  } catch (error) {
    console.error('Get trainings error:', error)
    res.status(500).json({ error: '연수 목록 조회 중 오류가 발생했습니다.' })
  }
}

export const createTraining = async (req: Request, res: Response) => {
  try {
    const {
      name,
      registrationBook,
      cycle,
      targetUsers,
      hours,
      implementationDate,
      department,
      manager,
      method,
      methodLink,
      deadline
    } = req.body

    if (!name) {
      return res.status(400).json({ error: '연수명을 입력해주세요.' })
    }

    if (!manager || manager.trim() === '') {
      return res.status(400).json({ error: '담당자를 입력해주세요.' })
    }

    // 연수 생성
    const training = await prisma.training.create({
      data: {
        name,
        registrationBook,
        cycle,
        targetUsers: Array.isArray(targetUsers) ? targetUsers : [],
        hours,
        implementationDate,
        department,
        manager: manager.trim(),
        method,
        methodLink,
        deadline: deadline ? new Date(deadline) : null
      }
    })

    // 대상자 자동 매칭
    if (Array.isArray(targetUsers) && targetUsers.length > 0) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          userType: {
            in: targetUsers
          }
        }
      })

      // training_participants 자동 생성
      await prisma.trainingParticipant.createMany({
        data: matchingUsers.map(user => ({
          trainingId: training.id,
          userId: user.id,
          status: 'pending'
        })),
        skipDuplicates: true
      })
    }

    // 생성된 연수와 참여자 정보 반환
    const trainingWithParticipants = await prisma.training.findUnique({
      where: { id: training.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true
              }
            }
          }
        }
      }
    })

    res.status(201).json(trainingWithParticipants)
  } catch (error) {
    console.error('Create training error:', error)
    res.status(500).json({ error: '연수 등록 중 오류가 발생했습니다.' })
  }
}

export const updateTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      name,
      registrationBook,
      cycle,
      targetUsers,
      hours,
      implementationDate,
      department,
      manager,
      method,
      methodLink,
      deadline
    } = req.body

    // 담당자 필수 검증
    if (manager !== undefined && (!manager || manager.trim() === '')) {
      return res.status(400).json({ error: '담당자를 입력해주세요.' })
    }

    // 연수 업데이트
    const training = await prisma.training.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(registrationBook !== undefined && { registrationBook }),
        ...(cycle !== undefined && { cycle }),
        ...(targetUsers !== undefined && { targetUsers: Array.isArray(targetUsers) ? targetUsers : [] }),
        ...(hours !== undefined && { hours }),
        ...(implementationDate !== undefined && { implementationDate }),
        ...(department !== undefined && { department }),
        ...(manager !== undefined && { manager: manager.trim() }),
        ...(method !== undefined && { method }),
        ...(methodLink !== undefined && { methodLink }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null })
      }
    })

    // targetUsers가 변경된 경우 참여자 재매칭
    if (targetUsers !== undefined && Array.isArray(targetUsers)) {
      // 기존 참여자 삭제
      await prisma.trainingParticipant.deleteMany({
        where: { trainingId: id }
      })

      // 새로운 대상자 매칭
      if (targetUsers.length > 0) {
        const matchingUsers = await prisma.user.findMany({
          where: {
            userType: {
              in: targetUsers
            }
          }
        })

        await prisma.trainingParticipant.createMany({
          data: matchingUsers.map(user => ({
            trainingId: id,
            userId: user.id,
            status: 'pending'
          })),
          skipDuplicates: true
        })
      }
    }

    // 업데이트된 연수 정보 반환
    const updatedTraining = await prisma.training.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true
              }
            }
          }
        }
      }
    })

    res.json(updatedTraining)
  } catch (error) {
    console.error('Update training error:', error)
    res.status(500).json({ error: '연수 정보 수정 중 오류가 발생했습니다.' })
  }
}

export const deleteTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.training.delete({
      where: { id }
    })

    res.json({ success: true, message: '연수가 삭제되었습니다.' })
  } catch (error) {
    console.error('Delete training error:', error)
    res.status(500).json({ error: '연수 삭제 중 오류가 발생했습니다.' })
  }
}

