import nodemailer from 'nodemailer'
import https from 'https'

// ============================================================
// 이메일 제공자 (우선순위: EmailJS > Brevo > SMTP)
// ============================================================

type EmailProvider = 'emailjs' | 'brevo' | 'smtp'

function getProvider(): EmailProvider {
  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY) return 'emailjs'
  if (process.env.BREVO_API_KEY) return 'brevo'
  return 'smtp'
}

const provider = getProvider()

// ============================================================
// EmailJS HTTP API
// ============================================================

function postJson(hostname: string, path: string, body: string, headers: Record<string, string>): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'POST', headers: { ...headers, 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)) }, timeout: 15000 }, (res) => {
      let data = ''
      res.on('data', (c: string) => { data += c })
      res.on('end', () => resolve({ status: res.statusCode || 500, data }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')) })
    req.write(body)
    req.end()
  })
}

// 마지막 발송 에러를 저장 (디버깅용)
let lastSendError = ''
export const getLastSendError = () => lastSendError

const sendViaEmailJs = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const body = JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY || undefined,
      template_params: {
        to_email: to,
        subject: subject,
        message_html: html,
      }
    })

    const res = await postJson('api.emailjs.com', '/api/v1.0/email/send', body, {})
    if (res.status === 200) {
      lastSendError = ''
      return true
    }
    lastSendError = `EmailJS ${res.status}: ${res.data}`
    console.error('EmailJS 오류:', res.status, res.data)
    return false
  } catch (error: any) {
    lastSendError = `EmailJS 예외: ${error.message}`
    console.error('EmailJS 발송 오류:', error)
    return false
  }
}

// ============================================================
// Brevo HTTP API
// ============================================================

const sendViaBrevo = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const fromEmail = process.env.SMTP_USER || 'noreply@school.kr'
    const body = JSON.stringify({
      sender: { name: '의무연수 안내 취합 통합 플랫폼', email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    })

    const res = await postJson('api.brevo.com', '/v3/smtp/email', body, {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY || '',
    })
    if (res.status >= 200 && res.status < 300) return true
    console.error('Brevo API 오류:', res.status, res.data)
    return false
  } catch (error) {
    console.error('Brevo 발송 오류:', error)
    return false
  }
}

// ============================================================
// SMTP (Gmail 등)
// ============================================================

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '587' ? false : true,
  auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
}

const transporter = nodemailer.createTransport(smtpConfig)

const sendViaSmtp = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) return false
    await transporter.sendMail({
      from: `"의무연수 안내 취합 통합 플랫폼" <${smtpConfig.auth.user}>`,
      to, subject, html,
    })
    return true
  } catch (error) {
    console.error('SMTP 발송 오류:', error)
    return false
  }
}

// ============================================================
// 공통 인터페이스
// ============================================================

export const verifySmtp = async (): Promise<{ ok: boolean; error?: string; provider?: string }> => {
  if (provider === 'emailjs') {
    if (!process.env.EMAILJS_TEMPLATE_ID) {
      return { ok: false, error: 'EMAILJS_TEMPLATE_ID 환경변수가 설정되지 않았습니다.' }
    }
    return { ok: true, provider: 'EmailJS' }
  }
  if (provider === 'brevo') {
    return { ok: true, provider: 'Brevo HTTP API' }
  }
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    return { ok: false, error: 'EMAILJS_SERVICE_ID 또는 SMTP_USER/SMTP_PASS 환경변수를 설정해주세요.' }
  }
  try {
    await transporter.verify()
    return { ok: true, provider: `SMTP (${smtpConfig.host}:${smtpConfig.port})` }
  } catch (error: any) {
    return { ok: false, error: `SMTP 연결 실패: ${error.message}` }
  }
}

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  switch (provider) {
    case 'emailjs': return sendViaEmailJs(to, subject, html)
    case 'brevo': return sendViaBrevo(to, subject, html)
    case 'smtp': return sendViaSmtp(to, subject, html)
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

