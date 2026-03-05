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

    // 학년 → 반 → 이름 순 정렬
    result.sort((a, b) => {
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

// 서명 저장/업데이트 (본인만)
export const saveSignature = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params
    const userId = (req as any).user?.userId
    const { signatureImage } = req.body as { signatureImage?: string }

    if (!userId) return res.status(401).json({ error: '인증이 필요합니다.' })
    if (!signatureImage) return res.status(400).json({ error: '서명 이미지가 필요합니다.' })
    if (!signatureImage.startsWith('data:image/')) {
      return res.status(400).json({ error: '올바른 이미지 형식이 아닙니다.' })
    }

    // 참여자인지 확인
    const participant = await prisma.trainingParticipant.findUnique({
      where: { trainingId_userId: { trainingId, userId } }
    })
    if (!participant) return res.status(403).json({ error: '해당 연수의 참여자가 아닙니다.' })

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || undefined

    const signature = await prisma.trainingSignature.upsert({
      where: { trainingId_userId: { trainingId, userId } },
      create: { trainingId, userId, signatureImage, ipAddress },
      update: { signatureImage, signedAt: new Date(), ipAddress }
    })

    res.json({ success: true, signature })
  } catch (error) {
    console.error('saveSignature error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

// 서명 삭제 (관리자)
export const deleteSignature = async (req: Request, res: Response) => {
  try {
    const { trainingId, userId } = req.params

    await prisma.trainingSignature.deleteMany({
      where: { trainingId, userId }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('deleteSignature error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
