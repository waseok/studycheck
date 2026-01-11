import { PrismaClient } from '@prisma/client'

// Prisma 클라이언트 인스턴스 생성 (연결 풀링 최적화)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// 애플리케이션 종료 시 Prisma 연결 정리
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma

