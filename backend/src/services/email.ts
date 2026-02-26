import nodemailer from 'nodemailer'
import https from 'https'

// Gmail SMTP: 465(SSL)을 기본으로 사용 (클라우드 호스팅에서 587이 차단되는 경우가 많음)
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '587' ? false : true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
}

const transporter = nodemailer.createTransport(smtpConfig)

// Brevo HTTP API로 이메일 발송 (SMTP가 차단된 환경용)
const sendViaBrevo = (to: string, subject: string, html: string, fromEmail: string, fromName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) { resolve(false); return }

    const body = JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    })

    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
      timeout: 15000,
    }, (res) => {
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true)
        } else {
          console.error('Brevo API 오류:', res.statusCode, data)
          resolve(false)
        }
      })
    })

    req.on('error', (err) => { console.error('Brevo 요청 오류:', err); resolve(false) })
    req.on('timeout', () => { req.destroy(); resolve(false) })
    req.write(body)
    req.end()
  })
}

// 이메일 제공자 결정: BREVO_API_KEY가 있으면 Brevo, 없으면 SMTP
const useBrevo = !!process.env.BREVO_API_KEY

// 연결 상태 확인
export const verifySmtp = async (): Promise<{ ok: boolean; error?: string; provider?: string }> => {
  if (useBrevo) {
    return { ok: true, provider: 'Brevo HTTP API' }
  }

  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    return { ok: false, error: 'SMTP_USER/SMTP_PASS 또는 BREVO_API_KEY 환경변수를 설정해주세요.' }
  }
  try {
    await transporter.verify()
    return { ok: true, provider: `SMTP (${smtpConfig.host}:${smtpConfig.port})` }
  } catch (error: any) {
    return { ok: false, error: `SMTP 연결 실패 (${smtpConfig.host}:${smtpConfig.port}): ${error.message}` }
  }
}

// 이메일 발송 함수
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  const fromEmail = process.env.SMTP_USER || process.env.BREVO_SENDER || 'noreply@school.kr'
  const fromName = '의무연수 안내 취합 통합 플랫폼'

  // Brevo HTTP API 사용
  if (useBrevo) {
    return sendViaBrevo(to, subject, html, fromEmail, fromName)
  }

  // SMTP 사용
  try {
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.error('이메일 설정이 되어 있지 않습니다.')
      return false
    }

    await transporter.sendMail({
      from: `"${fromName}" <${smtpConfig.auth.user}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('SMTP 발송 오류:', error)
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

