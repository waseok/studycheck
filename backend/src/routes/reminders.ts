import { Router } from 'express'
import { sendManualReminders } from '../services/reminder'
import { sendEmail, getReminderEmailTemplate } from '../services/email'
import { authMiddleware, adminMiddleware } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = Router()

// 수동으로 리마인더 발송 (관리자만)
router.post('/send', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await sendManualReminders()
    res.json({ success: true, message: '리마인더 발송이 완료되었습니다.' })
  } catch (error) {
    console.error('Manual reminder send error:', error)
    res.status(500).json({ error: '리마인더 발송 중 오류가 발생했습니다.' })
  }
})

// 특정 연수의 미이수자에게 알림 발송 (관리자만)
router.post('/send-incomplete/:trainingId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { trainingId } = req.params
    
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        participants: {
          where: {
            OR: [
              { status: 'pending' },
              { completionNumber: null },
              { completionNumber: '' }
            ]
          },
          include: {
            user: true
          }
        }
      }
    })

    if (!training) {
      return res.status(404).json({ error: '연수를 찾을 수 없습니다.' })
    }

    let sentCount = 0
    let failedCount = 0

    for (const participant of training.participants) {
      try {
        const html = getReminderEmailTemplate(
          participant.user.name,
          training.name,
          'missing',
          training.deadline || undefined
        )

        const subject = `[의무연수 안내] ${training.name} - 이수번호 미입력 알림`
        const success = await sendEmail(participant.user.email, subject, html)

        if (success) {
          // 리마인더 로그 저장
          await prisma.trainingReminder.create({
            data: {
              trainingId: training.id,
              userId: participant.userId,
              reminderType: 'missing',
              status: 'sent'
            }
          })
          sentCount++
        } else {
          failedCount++
        }
      } catch (error) {
        console.error(`이메일 발송 실패: ${participant.user.email}`, error)
        failedCount++
      }
    }

    res.json({
      success: true,
      message: `미이수자 ${sentCount}명에게 알림이 발송되었습니다.`,
      sentCount,
      failedCount,
      total: training.participants.length
    })
  } catch (error: any) {
    console.error('미이수자 알림 발송 오류:', error)
    res.status(500).json({ error: '알림 발송 중 오류가 발생했습니다.' })
  }
})

// 이메일 테스트 발송 (관리자만)
router.post('/test-email', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: '이메일 주소를 입력해주세요.' })
    }

    // 이메일 주소 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '올바른 이메일 주소 형식이 아닙니다.' })
    }

    // 테스트 이메일 내용
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>의무연수 안내 취합 통합 플랫폼</h1>
          </div>
          <div class="content">
            <h2>이메일 설정 테스트</h2>
            <p>안녕하세요.</p>
            <p>이 메일은 의무연수 안내 취합 통합 플랫폼의 이메일 설정 테스트 메일입니다.</p>
            <p>이 메일을 받으셨다면 SMTP 설정이 정상적으로 작동하는 것입니다.</p>
            <p>감사합니다.</p>
          </div>
          <div class="footer">
            <p>이 메일은 자동으로 발송된 테스트 메일입니다.</p>
            <p>발송 시간: ${new Date().toLocaleString('ko-KR')}</p>
          </div>
        </div>
      </body>
      </html>
    `

    const success = await sendEmail(email, '[의무연수 플랫폼] 이메일 설정 테스트', testHtml)

    if (success) {
      res.json({ success: true, message: `테스트 이메일이 ${email}로 발송되었습니다.` })
    } else {
      res.status(500).json({ error: '이메일 발송에 실패했습니다. SMTP 설정을 확인해주세요.' })
    }
  } catch (error: any) {
    console.error('Test email send error:', error)
    res.status(500).json({ 
      error: '이메일 발송 중 오류가 발생했습니다.',
      details: error.message 
    })
  }
})

export default router

