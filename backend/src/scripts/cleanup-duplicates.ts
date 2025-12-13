/**
 * 데이터베이스 중복 레코드 정리 스크립트
 * 같은 trainingId와 userId 조합의 중복 레코드를 정리합니다.
 * 가장 최근에 업데이트된 레코드만 유지하고 나머지는 삭제합니다.
 */

import prisma from '../utils/prisma'

async function cleanupDuplicates() {
  console.log('🔍 중복 레코드 검색 중...')

  try {
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
      console.log('✅ 중복 레코드가 없습니다.')
      return
    }

    // 중복 레코드 정리
    let deletedCount = 0
    for (const { key, participants } of duplicates) {
      // 가장 최근에 업데이트된 레코드 (첫 번째, 이미 updatedAt desc로 정렬됨)
      const keep = participants[0]
      const toDelete = participants.slice(1)

      console.log(`\n🔑 키: ${key}`)
      console.log(`   유지할 레코드: ${keep.id} (업데이트: ${keep.updatedAt})`)
      console.log(`   삭제할 레코드: ${toDelete.length}개`)

      // 이수번호가 있는 레코드를 우선 유지
      const hasCompletionNumber = participants.find(p => p.completionNumber)
      if (hasCompletionNumber && hasCompletionNumber.id !== keep.id) {
        console.log(`   ⚠️  이수번호가 있는 레코드 발견: ${hasCompletionNumber.id}, 유지할 레코드 변경`)
        const newKeep = hasCompletionNumber
        const newToDelete = participants.filter(p => p.id !== newKeep.id)
        
        // 이수번호가 있는 레코드의 정보를 유지할 레코드에 병합
        await prisma.trainingParticipant.update({
          where: { id: newKeep.id },
          data: {
            completionNumber: newKeep.completionNumber || keep.completionNumber,
            status: newKeep.status === 'completed' ? 'completed' : keep.status,
            completedAt: newKeep.completedAt || keep.completedAt
          }
        })

        // 나머지 삭제
        for (const participant of newToDelete) {
          await prisma.trainingParticipant.delete({
            where: { id: participant.id }
          })
          deletedCount++
        }
      } else {
        // 나머지 삭제
        for (const participant of toDelete) {
          await prisma.trainingParticipant.delete({
            where: { id: participant.id }
          })
          deletedCount++
        }
      }
    }

    console.log(`\n✅ 정리 완료: ${deletedCount}개의 중복 레코드 삭제됨`)
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
if (require.main === module) {
  cleanupDuplicates()
    .then(() => {
      console.log('🎉 스크립트 실행 완료')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export default cleanupDuplicates


