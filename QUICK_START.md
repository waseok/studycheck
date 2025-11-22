# 빠른 시작 가이드

## 1단계: 클라우드 데이터베이스 설정 (Neon 권장)

### Neon 사용 방법

1. **Neon 웹사이트 접속**
   - https://neon.tech 접속
   - "Sign up" 클릭 (GitHub 또는 Google 계정)

2. **프로젝트 생성**
   - "Create Project" 클릭
   - 프로젝트 이름: `training-platform`
   - Region: `Seoul (ap-northeast-2)` 또는 가장 가까운 지역
   - PostgreSQL 버전: 최신 버전 (기본값)

3. **연결 문자열 복사**
   - 프로젝트 대시보드에서 "Connection string" 섹션 찾기
   - "Pooled connection" 또는 "Direct connection" 선택
   - 연결 문자열 복사
   - 예: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

---

## 2단계: 환경 변수 설정

### backend/.env 파일 생성

```bash
cd backend
cp .env.example .env
```

또는 직접 `.env` 파일을 생성하고 다음 내용을 입력:

```env
# 데이터베이스 연결 문자열 (Neon에서 복사한 것)
DATABASE_URL="복사한_연결_문자열"

# JWT Secret (랜덤한 문자열)
JWT_SECRET="your-super-secret-jwt-key-change-this"

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

**중요**: 
- `DATABASE_URL`은 Neon에서 복사한 연결 문자열로 변경
- `SCHOOL_PASSWORD`와 `ADMIN_PASSWORD`는 원하는 비밀번호로 변경
- `JWT_SECRET`은 랜덤한 문자열로 변경 (보안상 중요)

---

## 3단계: 데이터베이스 마이그레이션

```bash
cd backend
npm run db:push
```

성공 메시지가 나타나면 데이터베이스 설정이 완료된 것입니다!

---

## 4단계: 서버 실행

### 백엔드 서버 실행

```bash
cd backend
npm run dev
```

백엔드 서버가 포트 3000에서 실행됩니다.

### 프론트엔드 실행 (새 터미널 창에서)

```bash
cd frontend
npm run dev
```

프론트엔드가 포트 5173에서 실행됩니다.

---

## 5단계: 브라우저에서 접속

1. **브라우저 열기**
   - http://localhost:5173 접속

2. **로그인**
   - 학교 비밀번호 또는 관리자 비밀번호 입력
   - (`.env` 파일에서 설정한 `SCHOOL_PASSWORD` 또는 `ADMIN_PASSWORD`)

3. **시작하기**
   - 관리자로 로그인하면 교직원 관리, 연수 관리, 통계 메뉴 사용 가능
   - 일반 사용자로 로그인하면 내 연수 메뉴만 사용 가능

---

## 문제 해결

### 데이터베이스 연결 오류

- 연결 문자열이 올바른지 확인
- Neon 대시보드에서 데이터베이스가 실행 중인지 확인
- SSL 모드가 올바르게 설정되어 있는지 확인

### 포트 이미 사용 중 오류

- 포트 3000이나 5173이 이미 사용 중인 경우
- 다른 포트 사용하거나 기존 프로세스 종료

### 의존성 설치 오류

```bash
# 프론트엔드 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install

# 백엔드 재설치
cd ../backend
rm -rf node_modules package-lock.json
npm install
```

---

## 다음 단계

1. **교직원 등록**
   - 관리자로 로그인
   - "교직원 관리" 메뉴에서 교직원 등록

2. **연수 등록**
   - 관리자로 로그인
   - "연수 관리" 메뉴에서 연수 등록
   - 대상자 범위 설정 시 자동으로 교직원이 연수에 포함됨

3. **이수번호 입력**
   - 일반 사용자는 "내 연수" 메뉴에서 이수번호 입력
   - 관리자는 "연수 관리" → "취합" 버튼에서 이수번호 입력

4. **통계 확인**
   - 관리자로 로그인
   - "통계" 메뉴에서 이수 현황 확인

---

## 이메일 설정 (선택사항)

리마인더 기능을 사용하려면 이메일 SMTP 설정이 필요합니다.

### Gmail 사용 방법

1. **Gmail 앱 비밀번호 생성**
   - Google 계정 설정 → 보안 → 2단계 인증 활성화
   - 앱 비밀번호 생성
   - 생성된 앱 비밀번호를 `.env` 파일의 `SMTP_PASS`에 입력

2. **환경 변수 설정**
   ```env
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="생성한_앱_비밀번호"
   ```

자세한 내용은 `DATABASE_SETUP.md` 파일을 참고하세요.



