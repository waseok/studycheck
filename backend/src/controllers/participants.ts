import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export const getParticipants = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params

    console.log(`📊 getParticipants 호출: trainingId=${trainingId}`)

    const participants = await prisma.trainingParticipant.findMany({
      where: { trainingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            position: true,
            grade: true,
            class: true
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
        createdAt: 'asc'
      }
    })

    // 클라이언트 측에서 이름 순으로 정렬 (orderBy에서 relation 사용 시 문제가 있을 수 있음)
    participants.sort((a, b) => {
      const aName = a.user?.name || ''
      const bName = b.user?.name || ''
      return aName.localeCompare(bName, 'ko')
    })

    console.log(`✅ getParticipants 결과: ${participants.length}명의 참여자 조회됨`, {
      trainingId,
      count: participants.length,
      participantIds: participants.map(p => ({ id: p.id, userId: p.userId, userName: p.user?.name }))
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

    // userId가 없으면 무조건 빈 배열 반환 (관리자도 포함)
    if (!userId) {
      console.log('⚠️ getMyTrainings: userId가 없어서 빈 배열 반환')
      return res.json([])
    }

    console.log(`🔍 getMyTrainings: 사용자(${userId})의 연수만 조회`)

    // 사용자 ID로 참여한 연수만 조회 (명시적으로 userId로만 필터링)
    const participants = await prisma.trainingParticipant.findMany({
      where: { 
        userId: userId // 명시적으로 userId로만 필터링
      },
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

    // 결과를 반환하기 전에 한 번 더 필터링 (보안 강화)
    const filteredParticipants = participants.filter(p => {
      if (p.userId !== userId) {
        console.error(`❌ 보안 위반: participant.userId(${p.userId}) !== 요청 userId(${userId})`)
        return false // 다른 사용자의 데이터는 제거
      }
      return true
    })

    // 미완료 연수를 위로 정렬
    const sorted = filteredParticipants.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      // 같은 상태면 기한 순으로 정렬
      if (a.training?.deadline && b.training?.deadline) {
        return new Date(b.training.deadline).getTime() - new Date(a.training.deadline).getTime()
      }
      return 0
    })

    console.log(`✅ getMyTrainings: ${sorted.length}개 반환 (userId: ${userId})`)
    res.json(sorted)
  } catch (error) {
    console.error('Get my trainings error:', error)
    res.status(500).json({ error: '내 연수 목록 조회 중 오류가 발생했습니다.' })
  }
}

export const cleanupDuplicates = async (req: Request, res: Response) => {
  try {
    console.log('🔍 중복 레코드 검색 중...')

    // 모든 참여자 레코드 조회
    const allParticipants = await prisma.trainingParticipant.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // trainingId와 userId 조합별로 그룹화
    const grouped = new Map<string, typeof allParticipants>()
    
    for (const participant of allParticipants) {
      const key = `${participant.trainingId}-${participant.userId}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(participant)
    }

    // 중복이 있는 그룹 찾기
    const duplicates: Array<{ key: string; participants: typeof allParticipants }> = []
    for (const [key, participants] of grouped.entries()) {
      if (participants.length > 1) {
        duplicates.push({ key, participants })
      }
    }

    console.log(`📊 총 ${allParticipants.length}개의 참여자 레코드 중 ${duplicates.length}개의 중복 그룹 발견`)

    if (duplicates.length === 0) {
      return res.json({ 
        success: true, 
        message: '중복 레코드가 없습니다.',
        deletedCount: 0,
        duplicateGroups: 0
      })
    }

    // 중복 레코드 정리
    let deletedCount = 0
    for (const { key, participants } of duplicates) {
      // 이수번호가 있는 레코드를 우선 유지
      const hasCompletionNumber = participants.find(p => p.completionNumber)
      const keep = hasCompletionNumber || participants[0] // 이수번호가 있으면 그것을, 없으면 가장 최근 것
      const toDelete = participants.filter(p => p.id !== keep.id)

      // 이수번호가 있는 레코드의 정보를 유지할 레코드에 병합 (필요한 경우)
      if (hasCompletionNumber && hasCompletionNumber.id !== keep.id) {
        await prisma.trainingParticipant.update({
          where: { id: keep.id },
          data: {
            completionNumber: hasCompletionNumber.completionNumber || keep.completionNumber,
            status: hasCompletionNumber.status === 'completed' ? 'completed' : keep.status,
            completedAt: hasCompletionNumber.completedAt || keep.completedAt
          }
        })
      }

      // 나머지 삭제
      for (const participant of toDelete) {
        await prisma.trainingParticipant.delete({
          where: { id: participant.id }
        })
        deletedCount++
      }
    }

    console.log(`✅ 정리 완료: ${deletedCount}개의 중복 레코드 삭제됨`)

    res.json({
      success: true,
      message: `중복 레코드 정리가 완료되었습니다. ${deletedCount}개의 중복 레코드가 삭제되었습니다.`,
      deletedCount,
      duplicateGroups: duplicates.length
    })
  } catch (error) {
    console.error('❌ 중복 레코드 정리 오류:', error)
    res.status(500).json({ error: '중복 레코드 정리 중 오류가 발생했습니다.' })
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

