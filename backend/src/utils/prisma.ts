import { Prisma, PrismaClient } from '@prisma/client'

const NEON_POOL_OPTIONS = {
  connection_limit: '5',
  pool_timeout: '20',
  connect_timeout: '10',
} as const

const buildDatabaseUrl = (): string | undefined => {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) return undefined

  try {
    const url = new URL(rawUrl)
    if (url.hostname.endsWith('.neon.tech')) {
      Object.entries(NEON_POOL_OPTIONS).forEach(([key, value]) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value)
      })

      const connectionType = url.hostname.includes('-pooler.') ? 'pooled' : 'direct'
      console.log(`🗄️ Neon DB 연결: ${connectionType}, connection_limit=${url.searchParams.get('connection_limit')}`)
      if (connectionType === 'direct') {
        console.warn('⚠️ Neon Direct URL입니다. 안정적인 운영을 위해 -pooler 호스트의 연결 문자열을 권장합니다.')
      }
    }
    return url.toString()
  } catch {
    // URL 파싱이 불가능하면 기존 값을 그대로 사용해 이전 설정과의 호환성을 유지합니다.
    return rawUrl
  }
}

// 읽기 작업은 재실행해도 데이터가 중복 변경되지 않으므로 연결 종료 시에만 재시도합니다.
const RETRYABLE_READ_ACTIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
])
const TRANSIENT_ERROR_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024'])
const RETRY_DELAYS_MS = [500, 1500]

const isTransientConnectionError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && TRANSIENT_ERROR_CODES.has(error.code)) {
    return true
  }

  const message = error instanceof Error ? error.message : String(error)
  return /connection.*closed|server has closed the connection|can't reach database|connection pool|timed out/i.test(message)
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Prisma 클라이언트 인스턴스 생성 (Neon 연결 풀링 최적화)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
})

prisma.$use(async (params, next) => {
  const canRetry = RETRYABLE_READ_ACTIONS.has(params.action) && !params.runInTransaction

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await next(params)
    } catch (error) {
      if (!canRetry || attempt >= RETRY_DELAYS_MS.length || !isTransientConnectionError(error)) {
        throw error
      }

      const delay = RETRY_DELAYS_MS[attempt]
      console.warn(`⚠️ DB 연결 일시 오류: ${params.model}.${params.action} ${attempt + 1}회 재시도 (${delay}ms 후)`)
      await wait(delay)
    }
  }
})

// 애플리케이션 종료 시 Prisma 연결 정리
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma

