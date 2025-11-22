# 클라우드 데이터베이스 설정 가이드

## 방법 1: Neon 사용 (권장 - 가장 쉬움)

### 1단계: Neon 계정 생성

1. **Neon 웹사이트 방문**
   - https://neon.tech 접속
   - "Sign up" 클릭
   - GitHub 또는 Google 계정으로 가입 (간편)

### 2단계: 프로젝트 생성

1. **프로젝트 생성**
   - "Create Project" 클릭
   - 프로젝트 이름: `training-platform` (또는 원하는 이름)
   - Region: `Seoul (ap-northeast-2)` 또는 가장 가까운 지역 선택
   - PostgreSQL 버전: 최신 버전 (기본값)

2. **생성 완료**
   - 프로젝트가 생성되면 자동으로 데이터베이스가 생성됨

### 3단계: 연결 문자열 복사

1. **Connection String 복사**
   - 프로젝트 대시보드에서 "Connection string" 섹션 찾기
   - "Pooled connection" 또는 "Direct connection" 선택
   - 연결 문자열 복사 (예: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)

### 4단계: 환경 변수 설정

1. **backend/.env 파일 생성**
   ```bash
   cd backend
   cp .env.example .env
   # 또는 직접 .env 파일 생성
   ```

2. **DATABASE_URL 설정**
   ```env
   DATABASE_URL="복사한_연결_문자열"
   ```

3. **다른 환경 변수 설정**
   ```env
   JWT_SECRET="your-secret-key-change-this-in-production"
   SCHOOL_PASSWORD="school-common-password"
   ADMIN_PASSWORD="admin-password"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   PORT=3000
   NODE_ENV=development
   ```

### 5단계: 데이터베이스 마이그레이션

```bash
cd backend
npm run db:push
```

---

## 방법 2: Railway 사용

### 1단계: Railway 계정 생성

1. **Railway 웹사이트 방문**
   - https://railway.app 접속
   - "Start a New Project" 클릭
   - GitHub 계정으로 가입

### 2단계: PostgreSQL 추가

1. **PostgreSQL 서비스 추가**
   - "New" → "Database" → "PostgreSQL" 선택
   - 자동으로 PostgreSQL 데이터베이스가 생성됨

### 3단계: 연결 정보 확인

1. **Connection 정보 확인**
   - PostgreSQL 서비스 클릭
   - "Variables" 탭에서 연결 정보 확인
   - `DATABASE_URL` 변수 복사

### 4단계: 환경 변수 설정

위의 "방법 1: Neon 사용"의 4단계와 동일

---

## 방법 3: Supabase 사용

### 1단계: Supabase 계정 생성

1. **Supabase 웹사이트 방문**
   - https://supabase.com 접속
   - "Start your project" 클릭
   - GitHub 계정으로 가입

### 2단계: 프로젝트 생성

1. **새 프로젝트 생성**
   - "New Project" 클릭
   - 프로젝트 이름: `training-platform`
   - 데이터베이스 비밀번호 설정 (기억해야 함)
   - Region: `Northeast Asia (Seoul)` 선택

### 3단계: 연결 문자열 복사

1. **Database 연결 정보 확인**
   - 프로젝트 대시보드에서 "Settings" → "Database" 클릭
   - "Connection string" 섹션에서 "URI" 선택
   - 연결 문자열 복사

### 4단계: 환경 변수 설정

위의 "방법 1: Neon 사용"의 4단계와 동일

---

## 환경 변수 파일 예시

`backend/.env` 파일 내용:

```env
# Database (Neon, Railway, Supabase 등에서 복사한 연결 문자열)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# JWT Secret (랜덤한 문자열 생성 가능)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# 비밀번호 설정
SCHOOL_PASSWORD="school-common-password"
ADMIN_PASSWORD="admin-password"

# Email SMTP 설정 (Gmail 사용 예시)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Server 설정
PORT=3000
NODE_ENV=development
```

---

## 데이터베이스 마이그레이션 실행

환경 변수 설정이 완료되면:

```bash
cd backend

# Prisma 클라이언트 생성 (이미 완료됨)
npm run db:generate

# 데이터베이스 스키마 생성
npm run db:push
```

성공 메시지가 나타나면 데이터베이스 설정이 완료된 것입니다!

---

## 문제 해결

### 연결 오류가 발생하는 경우

1. **연결 문자열 확인**
   - 연결 문자열에 올바른 사용자명, 비밀번호, 호스트가 포함되어 있는지 확인
   - SSL 모드가 올바르게 설정되어 있는지 확인 (`sslmode=require`)

2. **방화벽 확인**
   - 클라우드 데이터베이스의 IP 화이트리스트 확인
   - 필요시 모든 IP 허용 설정

3. **비밀번호 확인**
   - 데이터베이스 비밀번호가 올바른지 확인
   - 특수문자가 있는 경우 URL 인코딩 필요할 수 있음

### 마이그레이션 오류가 발생하는 경우

1. **Prisma 클라이언트 재생성**
   ```bash
   npm run db:generate
   ```

2. **데이터베이스 연결 확인**
   ```bash
   # .env 파일의 DATABASE_URL이 올바른지 확인
   cat .env
   ```

---

## 다음 단계

데이터베이스 설정이 완료되면:

1. **백엔드 서버 실행**
   ```bash
   cd backend
   npm run dev
   ```

2. **프론트엔드 실행**
   ```bash
   cd frontend
   npm run dev
   ```

3. **브라우저에서 접속**
   - http://localhost:5173 접속
   - 로그인 페이지에서 비밀번호 입력


