# 배포 가이드

의무연수 안내 취합 통합 플랫폼을 프로덕션 환경에 배포하는 방법을 안내합니다.

## 목차
1. [배포 아키텍처](#배포-아키텍처)
2. [프론트엔드 배포 (Vercel)](#프론트엔드-배포-vercel)
3. [백엔드 배포 (Railway)](#백엔드-배포-railway)
4. [백엔드 배포 (Render)](#백엔드-배포-render)
5. [환경 변수 설정](#환경-변수-설정)
6. [배포 후 확인사항](#배포-후-확인사항)
7. [문제 해결](#문제-해결)

---

## 배포 아키텍처

```
┌─────────────────┐
│   프론트엔드    │
│    (Vercel)     │
│  React + Vite   │
└────────┬────────┘
         │ HTTPS
         │ API 요청
         ▼
┌─────────────────┐
│    백엔드       │
│ (Railway/Render)│
│  Node.js + API  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   데이터베이스  │
│  Neon PostgreSQL│
└─────────────────┘
```

### 배포 플랫폼 선택

- **프론트엔드**: Vercel (무료, 자동 배포, HTTPS)
- **백엔드**: Railway 또는 Render (무료 티어 제공)
- **데이터베이스**: Neon (이미 설정 완료)

---

## 프론트엔드 배포 (Vercel)

### 1단계: Vercel 계정 생성

1. **Vercel 웹사이트 접속**
   - https://vercel.com 접속
   - GitHub 계정으로 가입 (권장)

### 2단계: 프로젝트 연결

1. **새 프로젝트 생성**
   - Vercel 대시보드에서 "Add New Project" 클릭
   - GitHub 저장소 선택 또는 직접 업로드

2. **프로젝트 설정**
   - **Root Directory**: `frontend` 선택
   - **Framework Preset**: Vite 선택
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3단계: 환경 변수 설정

Vercel 대시보드에서 환경 변수 추가:

```
VITE_API_URL=https://your-backend-url.railway.app/api
```

> **중요**: 백엔드 URL을 먼저 배포하고 URL을 확인한 후 설정하세요.

### 4단계: 배포

1. **자동 배포**
   - GitHub에 푸시하면 자동으로 배포됩니다
   - 또는 "Deploy" 버튼 클릭

2. **배포 확인**
   - 배포 완료 후 제공되는 URL로 접속
   - 예: `https://your-project.vercel.app`

### 5단계: 커스텀 도메인 (선택사항)

1. **도메인 추가**
   - 프로젝트 설정 → Domains
   - 도메인 입력 및 DNS 설정

---

## 백엔드 배포 (Railway)

### 1단계: Railway 계정 생성

1. **Railway 웹사이트 접속**
   - https://railway.app 접속
   - GitHub 계정으로 가입

### 2단계: 프로젝트 생성

1. **새 프로젝트 생성**
   - "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - 저장소 선택

2. **서비스 추가**
   - "New" → "GitHub Repo" 선택
   - `backend` 폴더를 루트로 설정

### 3단계: 환경 변수 설정

Railway 대시보드에서 환경 변수 추가:

```env
DATABASE_URL=postgresql://... (Neon 연결 문자열)
JWT_SECRET=your-production-secret-key
SCHOOL_PASSWORD=your-school-password
ADMIN_PASSWORD=your-admin-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### 4단계: 빌드 설정

Railway는 자동으로 감지하지만, 명시적으로 설정하려면:

1. **Settings** → **Build Command**: `npm run build`
2. **Settings** → **Start Command**: `npm start`

### 5단계: 배포 확인

1. **배포 완료 후**
   - Railway가 자동으로 URL 생성
   - 예: `https://your-project.railway.app`

2. **Health Check**
   - `https://your-project.railway.app/api/health` 접속
   - `{"status":"ok"}` 응답 확인

### 6단계: 커스텀 도메인 (선택사항)

1. **도메인 설정**
   - Settings → Networking
   - Custom Domain 추가

---

## 백엔드 배포 (Render)

### 1단계: Render 계정 생성

1. **Render 웹사이트 접속**
   - https://render.com 접속
   - GitHub 계정으로 가입

### 2단계: Web Service 생성

1. **새 Web Service 생성**
   - "New" → "Web Service" 선택
   - GitHub 저장소 연결

2. **서비스 설정**
   - **Name**: `training-platform-backend`
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 3단계: 환경 변수 설정

Render 대시보드에서 환경 변수 추가 (Railway와 동일):

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-production-secret-key
SCHOOL_PASSWORD=your-school-password
ADMIN_PASSWORD=your-admin-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### 4단계: 배포

1. **자동 배포**
   - GitHub에 푸시하면 자동 배포
   - 또는 "Manual Deploy" 클릭

2. **배포 확인**
   - 배포 완료 후 URL 확인
   - 예: `https://your-project.onrender.com`

---

## 환경 변수 설정

### 프로덕션 환경 변수 체크리스트

#### 백엔드 (Railway/Render)

- [ ] `DATABASE_URL` - Neon 데이터베이스 연결 문자열
- [ ] `JWT_SECRET` - 강력한 랜덤 문자열 (보안 중요!)
- [ ] `SCHOOL_PASSWORD` - 일반 교직원 로그인 비밀번호
- [ ] `ADMIN_PASSWORD` - 관리자 로그인 비밀번호
- [ ] `SMTP_HOST` - 이메일 SMTP 서버
- [ ] `SMTP_PORT` - SMTP 포트 (587 또는 465)
- [ ] `SMTP_SECURE` - SSL/TLS 사용 여부 (true/false)
- [ ] `SMTP_USER` - 이메일 계정
- [ ] `SMTP_PASS` - 이메일 비밀번호 또는 앱 비밀번호
- [ ] `PORT` - 서버 포트 (보통 3000, 플랫폼이 자동 설정)
- [ ] `NODE_ENV` - `production`으로 설정
- [ ] `FRONTEND_URL` - 프론트엔드 URL (CORS용)

#### 프론트엔드 (Vercel)

- [ ] `VITE_API_URL` - 백엔드 API URL (예: `https://your-backend.railway.app/api`)

### JWT_SECRET 생성 방법

```bash
# Node.js로 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

또는 온라인 도구 사용:
- https://randomkeygen.com/

---

## 배포 후 확인사항

### 1. 백엔드 확인

```bash
# Health Check
curl https://your-backend.railway.app/api/health

# 예상 응답
{"status":"ok","message":"의무연수 플랫폼 API 서버"}
```

### 2. 프론트엔드 확인

1. 브라우저에서 프론트엔드 URL 접속
2. 로그인 페이지가 정상적으로 표시되는지 확인
3. 로그인 테스트

### 3. CORS 확인

1. 브라우저 개발자 도구 열기 (F12)
2. Network 탭에서 API 요청 확인
3. CORS 오류가 없는지 확인

### 4. 데이터베이스 연결 확인

1. 관리자로 로그인
2. 교직원 관리 페이지 접속
3. 데이터 조회가 정상적으로 작동하는지 확인

---

## 문제 해결

### 1. CORS 오류

**증상**: 브라우저 콘솔에 CORS 오류 메시지

**해결 방법**:
- 백엔드 환경 변수 `FRONTEND_URL`에 프론트엔드 URL이 정확히 설정되었는지 확인
- 여러 도메인 사용 시: `FRONTEND_URL=https://domain1.com,https://domain2.com` 형식으로 설정

### 2. API 연결 실패

**증상**: 프론트엔드에서 API 요청이 실패

**해결 방법**:
- 프론트엔드 환경 변수 `VITE_API_URL` 확인
- 백엔드 URL이 올바른지 확인 (끝에 `/api` 포함 여부 확인)
- 백엔드 서버가 실행 중인지 확인

### 3. 데이터베이스 연결 오류

**증상**: 백엔드 로그에 데이터베이스 연결 오류

**해결 방법**:
- `DATABASE_URL` 환경 변수 확인
- Neon 대시보드에서 연결 문자열 재확인
- 데이터베이스가 활성화되어 있는지 확인

### 4. 빌드 실패

**증상**: 배포 시 빌드 오류

**해결 방법**:
- 로컬에서 `npm run build` 테스트
- `package.json`의 빌드 스크립트 확인
- 의존성 설치 오류 확인

### 5. 환경 변수 누락

**증상**: 기능이 작동하지 않음

**해결 방법**:
- 모든 필수 환경 변수가 설정되었는지 확인
- 환경 변수 이름 오타 확인
- 대소문자 구분 확인

---

## 배포 순서 권장사항

1. **데이터베이스 확인** (이미 완료)
   - Neon 데이터베이스가 활성화되어 있는지 확인

2. **백엔드 배포**
   - Railway 또는 Render에 백엔드 배포
   - 환경 변수 설정
   - Health Check 확인

3. **프론트엔드 배포**
   - Vercel에 프론트엔드 배포
   - `VITE_API_URL`에 백엔드 URL 설정
   - 배포 확인

4. **통합 테스트**
   - 로그인 테스트
   - 주요 기능 테스트
   - CORS 확인

---

## 보안 체크리스트

배포 전 확인사항:

- [ ] `JWT_SECRET`이 강력한 랜덤 문자열로 설정됨
- [ ] 프로덕션 비밀번호가 개발 환경과 다름
- [ ] `.env` 파일이 Git에 커밋되지 않음
- [ ] 환경 변수가 플랫폼 대시보드에 안전하게 저장됨
- [ ] HTTPS가 활성화됨 (Vercel, Railway, Render 모두 자동 제공)
- [ ] CORS가 올바르게 설정됨

---

## 추가 리소스

- **Vercel 문서**: https://vercel.com/docs
- **Railway 문서**: https://docs.railway.app
- **Render 문서**: https://render.com/docs
- **Neon 문서**: https://neon.tech/docs

---

## 다음 단계

배포가 완료되면:

1. **모니터링 설정**
   - 에러 로깅 (Sentry 등)
   - 성능 모니터링

2. **백업 설정**
   - 데이터베이스 자동 백업 (Neon은 자동 제공)

3. **도메인 설정**
   - 커스텀 도메인 연결
   - SSL 인증서 (자동 제공)

4. **사용자 가이드**
   - 사용자 매뉴얼 작성
   - 관리자 가이드 작성

