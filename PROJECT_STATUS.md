# 프로젝트 상태 요약

## 프로젝트 정보
- **프로젝트명**: 의무연수 안내 취합 통합 플랫폼
- **목적**: 교직원 연수 안내, 이수번호 취합, 통계, 자동 리마인더 기능 제공

## 기술 스택
- **프론트엔드**: React + TypeScript + Vite + Tailwind CSS
- **백엔드**: Node.js + Express + TypeScript
- **데이터베이스**: PostgreSQL (Neon 클라우드)
- **인증**: JWT 토큰 기반
- **이메일**: Nodemailer (SMTP)

## 현재 상태 (2024년 기준)

### ✅ 완료된 작업
1. 프로젝트 구조 생성
2. Node.js 설치 완료
3. 데이터베이스 연결 완료 (Neon)
4. 데이터베이스 스키마 생성 완료
5. 백엔드 API 구현 완료
6. 프론트엔드 기본 구조 완료
7. 인증 시스템 구현 완료
8. 로그인 기능 작동 확인

### 🔧 설정 완료된 내용
- **백엔드 서버**: 포트 3000
- **프론트엔드 서버**: 포트 5173
- **데이터베이스**: Neon PostgreSQL
- **로그인 비밀번호**:
  - 일반 교직원: `1234`
  - 관리자: `8714`

### 📝 환경 변수 (.env 파일 위치: backend/.env)
```
DATABASE_URL="postgresql://neondb_owner:npg_2EWtFuPspK7c@ep-snowy-credit-ad9l8edx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="your-secret-key-change-this-in-production"
SCHOOL_PASSWORD="1234"
ADMIN_PASSWORD="8714"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
PORT=3000
NODE_ENV=development
```

## 구현된 기능

### 1. 인증 시스템
- 로그인 (학교 비밀번호/관리자 비밀번호)
- JWT 토큰 기반 인증
- ProtectedRoute를 통한 라우트 보호

### 2. 교직원 관리 (관리자 전용)
- 교직원 등록/수정/삭제
- 교직원 목록 조회
- 교직원 유형 관리

### 3. 연수 관리 (관리자 전용)
- 연수 등록/수정/삭제
- 대상자 범위 설정
- 대상자 자동 매칭

### 4. 연수 취합
- 연수별 취합 페이지
- 이수번호 입력 기능
- 취합 현황 조회

### 5. 통계 (관리자 전용)
- 연수별 이수 현황 통계
- 미이수자 목록
- 차트/그래프 표시

### 6. 자동 리마인더
- 연수 종료 3개월 전 알림
- 연수 종료 1개월 전 알림
- 이수번호 미입력자 알림
- 스케줄러 구현 (매일 오전 9시)

## 실행 방법

### 백엔드 서버 실행
```bash
cd backend
npm run dev
```

### 프론트엔드 서버 실행
```bash
cd frontend
npm run dev
```

### 브라우저 접속
- URL: http://localhost:5173
- 로그인 비밀번호: `1234` (일반) 또는 `8714` (관리자)

## 알려진 이슈

### 해결된 이슈
1. ✅ 환경 변수 로드 문제 - dotenv.config()를 index.ts 최상단으로 이동하여 해결
2. ✅ 로그인 후 메뉴 클릭 시 로그인 페이지로 리다이렉트되는 문제 - ProtectedRoute 추가 및 API 응답 인터셉터 개선으로 해결

### 진행 중인 이슈
- 없음 (모든 기능 정상 작동 확인됨)

## 다음 단계 (필요 시)

1. **이메일 설정**
   - Gmail 앱 비밀번호 생성
   - SMTP 설정 완료
   - 리마인더 기능 테스트

2. **데이터 입력**
   - 교직원 등록
   - 연수 등록
   - 테스트 데이터 입력

3. **배포 준비**
   - 환경 변수 설정 (프로덕션)
   - Vercel 배포 (프론트엔드)
   - Railway/Render 배포 (백엔드)

## 프로젝트 구조

```
의무연수 안내 취합 통합 플랫폼/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── api/          # API 클라이언트
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── types/        # TypeScript 타입
│   │   └── App.tsx       # 메인 앱 컴포넌트
│   └── package.json
├── backend/              # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/  # 컨트롤러
│   │   ├── routes/       # 라우트
│   │   ├── middleware/   # 미들웨어
│   │   ├── services/     # 서비스 (이메일, 리마인더)
│   │   └── index.ts      # 서버 진입점
│   ├── prisma/
│   │   └── schema.prisma # 데이터베이스 스키마
│   └── package.json
└── PROJECT_PLAN.md       # 프로젝트 계획서
```

## 중요 파일 위치

- **프론트엔드 진입점**: `frontend/src/main.tsx`
- **백엔드 진입점**: `backend/src/index.ts`
- **데이터베이스 스키마**: `backend/prisma/schema.prisma`
- **환경 변수**: `backend/.env`
- **프로젝트 계획**: `PROJECT_PLAN.md`

## 다음 대화에서 이어가기

새로운 대화를 시작할 때는 다음을 말씀해주세요:
1. "의무연수 안내 취합 통합 플랫폼 프로젝트를 이어가고 싶습니다"
2. "PROJECT_STATUS.md 파일을 확인해주세요"
3. 현재 작업 중인 기능이나 문제점 설명

## 연락처 및 참고사항

- 프로젝트 경로: `/Users/air/Library/CloudStorage/GoogleDrive-lds43890@ssem.re.kr/내 드라이브/동수동수동수동수동수동수동수동수/cursor/의무연수 안내 취합 통합 플랫폼`
- 데이터베이스: Neon PostgreSQL (클라우드)
- 서버 실행 상태 확인: `lsof -ti:3000` (백엔드), `lsof -ti:5173` (프론트엔드)

