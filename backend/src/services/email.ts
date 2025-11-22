import nodemailer from 'nodemailer'

// SMTP 설정
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
}

// 이메일 전송기 생성
const transporter = nodemailer.createTransport(smtpConfig)

// 이메일 발송 함수
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"의무연수 안내 취합 통합 플랫폼" <${smtpConfig.auth.user}>`,
      to,
      subject,
      html
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('이메일 발송 오류:', error)
    return false
  }
}

// 리마인더 이메일 템플릿
export const getReminderEmailTemplate = (
  userName: string,
  trainingName: string,
  reminderType: '3months' | '1month' | 'missing',
  deadline?: Date
): string => {
  const deadlineStr = deadline ? new Date(deadline).toLocaleDateString('ko-KR') : ''
  
  let message = ''
  let subject = ''

  switch (reminderType) {
    case '3months':
      subject = `[의무연수 안내] ${trainingName} - 종료 3개월 전 알림`
      message = `
        <h2>의무연수 종료 3개월 전 알림</h2>
        <p>${userName}님 안녕하세요.</p>
        <p><strong>${trainingName}</strong> 연수의 이수 기한이 3개월 남았습니다.</p>
        <p>이수 기한: ${deadlineStr}</p>
        <p>연수를 이수하시고 이수번호를 입력해주시기 바랍니다.</p>
        <p>감사합니다.</p>
      `
      break
    case '1month':
      subject = `[의무연수 안내] ${trainingName} - 종료 1개월 전 알림`
      message = `
        <h2>의무연수 종료 1개월 전 알림</h2>
        <p>${userName}님 안녕하세요.</p>
        <p><strong>${trainingName}</strong> 연수의 이수 기한이 1개월 남았습니다.</p>
        <p>이수 기한: ${deadlineStr}</p>
        <p>연수를 이수하시고 이수번호를 입력해주시기 바랍니다.</p>
        <p>감사합니다.</p>
      `
      break
    case 'missing':
      subject = `[의무연수 안내] ${trainingName} - 이수번호 미입력 알림`
      message = `
        <h2>이수번호 미입력 알림</h2>
        <p>${userName}님 안녕하세요.</p>
        <p><strong>${trainingName}</strong> 연수의 이수번호가 아직 입력되지 않았습니다.</p>
        ${deadlineStr ? `<p>이수 기한: ${deadlineStr}</p>` : ''}
        <p>연수를 이수하셨다면 이수번호를 입력해주시기 바랍니다.</p>
        <p>감사합니다.</p>
      `
      break
  }

  return `
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
          ${message}
        </div>
        <div class="footer">
          <p>이 메일은 자동으로 발송된 메일입니다.</p>
          <p>문의사항이 있으시면 연수 담당자에게 연락해주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

