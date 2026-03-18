import { Request, Response } from 'express'
import prisma from '../utils/prisma'

// 연수 서명 목록 조회 (참여자 + 서명 상태)
export const getSignatures = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params

    const training = await prisma.training.findUnique({
      where: { id: trainingId }
    })
    if (!training) return res.status(404).json({ error: '연수를 찾을 수 없습니다.' })

    const participants = await prisma.trainingParticipant.findMany({
      where: { trainingId },
      include: {
        user: {
          select: { id: true, name: true, userType: true, position: true, grade: true, class: true }
        }
      }
    })

    const signatures = await prisma.trainingSignature.findMany({
      where: { trainingId }
    })

    const signatureMap = new Map(signatures.map((s: any) => [s.userId, s]))

    const result = participants.map(p => ({
      participantId: p.id,
      userId: p.user.id,
      name: p.user.name,
      userType: p.user.userType,
      position: p.user.position,
      grade: p.user.grade,
      class: p.user.class,
      signature: signatureMap.has(p.user.id) ? {
        id: (signatureMap.get(p.user.id) as any).id,
        signatureImage: (signatureMap.get(p.user.id) as any).signatureImage,
        signedAt: (signatureMap.get(p.user.id) as any).signedAt,
      } : null
    }))

    // 교장 > 교감 > 담임 > 교과전담 > 유치원 > 행정실 > 그 외 순 정렬
    const getTypeOrder = (p: { userType: string; position?: string | null; grade?: string | null; class?: string | null }): number => {
      const isTeacher = p.userType === '교원' || p.userType === '기간제교사'
      if (isTeacher) {
        if (p.position === '교장') return 0
        if (p.position === '교감') return 1
        if (p.grade && p.class) return 2  // 학급 담임
        return 3  // 교과 전담
      }
      if (p.userType === '유치원') return 4
      if (['직원', '공무직', '교육공무직', '교직원'].includes(p.userType)) return 5
      return 6
    }

    result.sort((a, b) => {
      const aOrder = getTypeOrder(a)
      const bOrder = getTypeOrder(b)
      if (aOrder !== bOrder) return aOrder - bOrder
      const gradeA = parseInt(a.grade || '99') || 99
      const gradeB = parseInt(b.grade || '99') || 99
      if (gradeA !== gradeB) return gradeA - gradeB
      const classA = parseInt(a.class || '99') || 99
      const classB = parseInt(b.class || '99') || 99
      if (classA !== classB) return classA - classB
      return a.name.localeCompare(b.name, 'ko')
    })

    res.json({ training, participants: result })
  } catch (error) {
    console.error('getSignatures error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

// 서명 저장/업데이트 (본인 또는 관리자가 타인 대리 서명 가능)
export const saveSignature = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params
    const requestUserId = (req as any).user?.userId
    const isAdmin = (req as any).user?.isAdmin || false
    const { signatureImage, targetUserId } = req.body as { signatureImage?: string; targetUserId?: string }

    if (!requestUserId) return res.status(401).json({ error: '인증이 필요합니다.' })
    if (!signatureImage) return res.status(400).json({ error: '서명 이미지가 필요합니다.' })
    if (!signatureImage.startsWith('data:image/')) {
      return res.status(400).json({ error: '올바른 이미지 형식이 아닙니다.' })
    }

    // 관리자는 targetUserId로 타인 서명 가능, 일반 사용자는 본인만
    if (targetUserId && targetUserId !== requestUserId && !isAdmin) {
      return res.status(403).json({ error: '본인 서명만 작성할 수 있습니다.' })
    }
    const userId = (isAdmin && targetUserId) ? targetUserId : requestUserId

    // 참여자인지 확인
    const participant = await prisma.trainingParticipant.findUnique({
      where: { trainingId_userId: { trainingId, userId } }
    })
    if (!participant) return res.status(403).json({ error: '해당 연수의 참여자가 아닙니다.' })

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || undefined

    const [signature] = await prisma.$transaction([
      prisma.trainingSignature.upsert({
        where: { trainingId_userId: { trainingId, userId } },
        create: { trainingId, userId, signatureImage, ipAddress },
        update: { signatureImage, signedAt: new Date(), ipAddress }
      }),
      prisma.trainingParticipant.updateMany({
        where: { trainingId, userId },
        data: { status: 'completed', completedAt: new Date() }
      })
    ])

    res.json({ success: true, signature })
  } catch (error) {
    console.error('saveSignature error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

// 서명된 참여자 상태 일괄 동기화 (관리자) - 서명했지만 pending 상태인 경우 수정
export const syncSignatureStatus = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params

    const signatures = await prisma.trainingSignature.findMany({
      where: { trainingId }
    })

    if (signatures.length === 0) {
      return res.json({ updated: 0 })
    }

    const result = await prisma.trainingParticipant.updateMany({
      where: {
        trainingId,
        userId: { in: signatures.map((s: any) => s.userId) },
        status: 'pending'
      },
      data: { status: 'completed', completedAt: new Date() }
    })

    res.json({ updated: result.count })
  } catch (error) {
    console.error('syncSignatureStatus error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

// 서명 삭제 (관리자)
export const deleteSignature = async (req: Request, res: Response) => {
  try {
    const { trainingId, userId } = req.params

    await prisma.$transaction([
      prisma.trainingSignature.deleteMany({ where: { trainingId, userId } }),
      prisma.trainingParticipant.updateMany({
        where: { trainingId, userId },
        data: { status: 'pending', completedAt: null }
      })
    ])

    res.json({ success: true })
  } catch (error) {
    console.error('deleteSignature error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
