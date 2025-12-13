// 환경 변수를 가장 먼저 로드
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import trainingRoutes from './routes/trainings'
import participantRoutes from './routes/participants'
import statsRoutes from './routes/stats'
import reminderRoutes from './routes/reminders'

// 리마인더 서비스 초기화 (스케줄러 시작)
import './services/reminder'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
// CORS 설정: 개발 환경과 프로덕션 환경 모두 지원
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'https://studycheck-liard.vercel.app']

// 허용된 origin 목록에 Vercel 도메인 추가 (기본값)
if (!allowedOrigins.includes('https://studycheck-liard.vercel.app')) {
  allowedOrigins.push('https://studycheck-liard.vercel.app')
}

console.log('🌐 CORS 허용된 Origin 목록:', allowedOrigins)

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // origin이 없으면 (같은 도메인에서 요청) 허용
    if (!origin) return callback(null, true)
    
    // Vercel 도메인 패턴 허용 (*.vercel.app, *.vercel.app/*)
    const isVercelDomain = origin.includes('.vercel.app')
    
    // 허용된 origin인지 확인
    if (allowedOrigins.includes(origin) || isVercelDomain || process.env.NODE_ENV === 'development') {
      callback(null, true)
    } else {
      console.warn('⚠️ CORS 차단된 Origin:', origin)
      console.warn('⚠️ 허용된 Origin 목록:', allowedOrigins)
      callback(new Error('CORS 정책에 의해 차단되었습니다.'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/trainings', trainingRoutes)
app.use('/api/participants', participantRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/reminders', reminderRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '의무연수 플랫폼 API 서버' })
})

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
})

