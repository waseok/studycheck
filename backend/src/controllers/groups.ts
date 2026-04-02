import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 그룹 목록 조회
export const getGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.staffGroup.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, userType: true, position: true } }
          }
        }
      }
    })
    res.json(groups)
  } catch (error) {
    console.error('getGroups error:', error)
    res.status(500).json({ error: '그룹 목록 조회 중 오류가 발생했습니다.' })
  }
}

// 그룹 생성
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, memberIds } = req.body as { name: string; memberIds?: string[] }
    if (!name?.trim()) return res.status(400).json({ error: '그룹명은 필수입니다.' })

    const group = await prisma.staffGroup.create({
      data: {
        name: name.trim(),
        members: memberIds?.length
          ? { create: memberIds.map(userId => ({ userId })) }
          : undefined
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, userType: true, position: true } }
          }
        }
      }
    })
    res.status(201).json(group)
  } catch (error) {
    console.error('createGroup error:', error)
    res.status(500).json({ error: '그룹 생성 중 오류가 발생했습니다.' })
  }
}

// 그룹 수정 (이름 변경)
export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name } = req.body as { name: string }
    if (!name?.trim()) return res.status(400).json({ error: '그룹명은 필수입니다.' })

    const group = await prisma.staffGroup.update({
      where: { id },
      data: { name: name.trim() },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, userType: true, position: true } }
          }
        }
      }
    })
    res.json(group)
  } catch (error) {
    console.error('updateGroup error:', error)
    res.status(500).json({ error: '그룹 수정 중 오류가 발생했습니다.' })
  }
}

// 그룹 삭제
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.staffGroup.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    console.error('deleteGroup error:', error)
    res.status(500).json({ error: '그룹 삭제 중 오류가 발생했습니다.' })
  }
}

// 그룹 멤버 추가
export const addGroupMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { memberIds } = req.body as { memberIds: string[] }
    if (!memberIds?.length) return res.status(400).json({ error: '추가할 멤버를 선택해주세요.' })

    await prisma.staffGroupMember.createMany({
      data: memberIds.map(userId => ({ groupId: id, userId })),
      skipDuplicates: true
    })

    const group = await prisma.staffGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, userType: true, position: true } }
          }
        }
      }
    })
    res.json(group)
  } catch (error) {
    console.error('addGroupMembers error:', error)
    res.status(500).json({ error: '멤버 추가 중 오류가 발생했습니다.' })
  }
}

// 그룹 멤버 제거
export const removeGroupMember = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params
    await prisma.staffGroupMember.deleteMany({
      where: { groupId: id, userId }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('removeGroupMember error:', error)
    res.status(500).json({ error: '멤버 제거 중 오류가 발생했습니다.' })
  }
}
