import cron from 'node-cron'
import prisma from '../utils/prisma'
import { sendEmail, getReminderEmailTemplate } from './email'

// 매일 오전 9시에 실행
cron.schedule('0 9 * * *', async () => {
  console.log('리마인더 스케줄러 실행 중...')
  await checkAndSendReminders()
})

// 리마인더 체크 및 발송 함수
export const checkAndSendReminders = async () => {
  try {
    const now = new Date()
    const threeMonthsLater = new Date()
    threeMonthsLater.setMonth(now.getMonth() + 3)
    
    const oneMonthLater = new Date()
    oneMonthLater.setMonth(now.getMonth() + 1)

    // deadline이 있는 연수들 가져오기
    const trainings = await prisma.training.findMany({
      where: {
        deadline: {
          not: null
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    })

    for (const training of trainings) {
      if (!training.deadline) continue

      const deadline = new Date(training.deadline)
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
      const threeMonthsDate = new Date(threeMonthsLater.getFullYear(), threeMonthsLater.getMonth(), threeMonthsLater.getDate())
      const oneMonthDate = new Date(oneMonthLater.getFullYear(), oneMonthLater.getMonth(), oneMonthLater.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // 3개월 전 알림 체크
      if (deadlineDate.getTime() === threeMonthsDate.getTime()) {
        await sendReminders(training, '3months')
      }

      // 1개월 전 알림 체크
      if (deadlineDate.getTime() === oneMonthDate.getTime()) {
        await sendReminders(training, '1month')
      }

      // 이수번호 미입력자 체크 (매일)
      await checkMissingCompletionNumbers(training)
    }
  } catch (error) {
    console.error('리마인더 체크 오류:', error)
  }
}

// 리마인더 발송 함수
const sendReminders = async (
  training: any,
  reminderType: '3months' | '1month'
) => {
  try {
    for (const participant of training.participants) {
      // 이미 발송된 리마인더인지 확인
      const existingReminder = await prisma.trainingReminder.findFirst({
        where: {
          trainingId: training.id,
          userId: participant.userId,
          reminderType
        }
      })

      if (existingReminder) {
        continue // 이미 발송됨
      }

      const user = participant.user
      const html = getReminderEmailTemplate(
        user.name,
        training.name,
        reminderType,
        training.deadline
      )

      const subject = reminderType === '3months'
        ? `[의무연수 안내] ${training.name} - 종료 3개월 전 알림`
        : `[의무연수 안내] ${training.name} - 종료 1개월 전 알림`

      const success = await sendEmail(user.email, subject, html)

      // 리마인더 로그 저장
      await prisma.trainingReminder.create({
        data: {
          trainingId: training.id,
          userId: participant.userId,
          reminderType,
          status: success ? 'sent' : 'failed'
        }
      })

      console.log(`${reminderType} 리마인더 발송: ${user.email} - ${training.name}`)
    }
  } catch (error) {
    console.error('리마인더 발송 오류:', error)
  }
}

// 이수번호 미입력자 체크 및 알림 발송
const checkMissingCompletionNumbers = async (training: any) => {
  try {
    const now = new Date()
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(now.getMonth() + 1)

    // deadline이 1개월 이내이고 이수번호가 없는 참여자
    if (training.deadline && new Date(training.deadline) <= oneMonthFromNow) {
      for (const participant of training.participants) {
        // 이수번호가 없고 완료되지 않은 경우
        if (!participant.completionNumber && participant.status !== 'completed') {
          // 최근 7일 내에 missing 리마인더를 발송하지 않은 경우에만
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

          const recentReminder = await prisma.trainingReminder.findFirst({
            where: {
              trainingId: training.id,
              userId: participant.userId,
              reminderType: 'missing',
              sentAt: {
                gte: sevenDaysAgo
              }
            }
          })

          if (!recentReminder) {
            const user = participant.user
            const html = getReminderEmailTemplate(
              user.name,
              training.name,
              'missing',
              training.deadline
            )

            const subject = `[의무연수 안내] ${training.name} - 이수번호 미입력 알림`
            const success = await sendEmail(user.email, subject, html)

            // 리마인더 로그 저장
            await prisma.trainingReminder.create({
              data: {
                trainingId: training.id,
                userId: participant.userId,
                reminderType: 'missing',
                status: success ? 'sent' : 'failed'
              }
            })

            console.log(`이수번호 미입력 알림 발송: ${user.email} - ${training.name}`)
          }
        }
      }
    }
  } catch (error) {
    console.error('이수번호 미입력자 체크 오류:', error)
  }
}

// 수동으로 리마인더 발송 (API 엔드포인트용)
export const sendManualReminders = async (trainingId?: string) => {
  await checkAndSendReminders()
}

