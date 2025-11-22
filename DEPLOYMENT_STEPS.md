# 배포 진행 단계별 가이드

실제로 배포를 진행하는 단계별 가이드를 안내합니다.

## 📋 사전 준비사항

### 1. GitHub 계정 및 저장소 준비

배포 플랫폼들이 GitHub와 연동되므로 먼저 GitHub에 코드를 올려야 합니다.

#### Git 저장소 초기화 (아직 안 했다면)

```bash
# 프로젝트 루트에서
git init
git add .
git commit -m "Initial commit: 의무연수 안내 취합 통합 플랫폼"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

---

## 🚀 배포 진행 순서

### 순서 1: 백엔드 배포 (Railway 또는 Render)

백엔드를 먼저 배포해야 프론트엔드에서 API URL을 설정할 수 있습니다.

#### 옵션 A: Railway 사용 (권장)

1. **Railway 계정 생성**
   - https://railway.app 접속
   - "Start a New Project" 클릭
   - GitHub 계정으로 로그인

2. **프로젝트 생성**
   - "Deploy from GitHub repo" 선택
   - 저장소 선택
   - "Deploy Now" 클릭

3. **서비스 설정**
   - 생성된 서비스 클릭
   - Settings → Root Directory: `backend` 설정
   - Settings → Build Command: `npm run build` (또는 자동 감지)
   - Settings → Start Command: `npm start`

4. **환경 변수 설정**
   - Variables 탭 클릭
   - 다음 환경 변수 추가:

```env
DATABASE_URL=postgresql://neondb_owner:npg_2EWtFuPspK7c@ep-snowy-credit-ad9l8edx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=여기에_강력한_랜덤_문자열_입력
SCHOOL_PASSWORD=1234
ADMIN_PASSWORD=8714
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=edutech7@pajuwaseok.es.kr
SMTP_PASS=앱_비밀번호_또는_일반_비밀번호
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

   > **중요**: `FRONTEND_URL`은 아직 프론트엔드를 배포하지 않았으므로 나중에 업데이트해야 합니다.

5. **JWT_SECRET 생성**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   생성된 값을 복사해서 `JWT_SECRET`에 입력

6. **배포 확인**
   - 배포가 완료되면 Railway가 자동으로 URL 생성
   - 예: `https://your-project.up.railway.app`
   - Health Check: `https://your-project.up.railway.app/api/health` 접속
   - `{"status":"ok"}` 응답 확인

#### 옵션 B: Render 사용

1. **Render 계정 생성**
   - https://render.com 접속
   - GitHub 계정으로 로그인

2. **Web Service 생성**
   - "New" → "Web Service" 선택
   - GitHub 저장소 연결
   - 설정:
     - Name: `training-platform-backend`
     - Root Directory: `backend`
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`

3. **환경 변수 설정** (Railway와 동일)

4. **배포 확인** (Railway와 동일)

---

### 순서 2: 프론트엔드 배포 (Vercel)

백엔드 URL을 확인한 후 프론트엔드를 배포합니다.

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 생성**
   - "Add New Project" 클릭
   - GitHub 저장소 선택
   - Import Project 클릭

3. **프로젝트 설정**
   - **Root Directory**: `frontend` 선택 (중요!)
   - **Framework Preset**: Vite (자동 감지됨)
   - **Build Command**: `npm run build` (자동 감지됨)
   - **Output Directory**: `dist` (자동 감지됨)

4. **환경 변수 설정**
   - Environment Variables 섹션에서 추가:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
   > 백엔드 URL 끝에 `/api` 포함!

5. **배포**
   - "Deploy" 버튼 클릭
   - 배포 완료 대기 (1-2분)

6. **배포 확인**
   - 배포 완료 후 제공되는 URL로 접속
   - 예: `https://your-project.vercel.app`
   - 로그인 페이지가 정상적으로 표시되는지 확인

---

### 순서 3: 백엔드 CORS 설정 업데이트

프론트엔드 URL을 확인한 후 백엔드의 `FRONTEND_URL` 환경 변수를 업데이트합니다.

1. **Railway/Render 대시보드 접속**
2. **환경 변수 수정**
   - `FRONTEND_URL` 값을 프론트엔드 URL로 업데이트
   - 예: `FRONTEND_URL=https://your-project.vercel.app`
3. **서비스 재배포** (자동으로 재배포됨)

---

### 순서 4: 통합 테스트

1. **로그인 테스트**
   - 프론트엔드 URL 접속
   - 일반 사용자 비밀번호로 로그인 (`1234`)
   - 관리자 비밀번호로 로그인 (`8714`)

2. **기능 테스트**
   - 교직원 관리 (관리자)
   - 연수 관리 (관리자)
   - 연수 취합
   - 통계 확인

3. **CORS 확인**
   - 브라우저 개발자 도구 (F12) 열기
   - Network 탭에서 API 요청 확인
   - CORS 오류가 없는지 확인

---

## 🔧 문제 해결

### 백엔드 배포 실패

**증상**: Railway/Render에서 빌드 실패

**해결**:
1. 로컬에서 테스트:
   ```bash
   cd backend
   npm run build
   npm start
   ```
2. `package.json`의 빌드 스크립트 확인
3. Railway/Render 로그 확인

### 프론트엔드 배포 실패

**증상**: Vercel에서 빌드 실패

**해결**:
1. 로컬에서 테스트:
   ```bash
   cd frontend
   npm run build
   ```
2. Root Directory가 `frontend`로 설정되었는지 확인
3. Vercel 빌드 로그 확인

### API 연결 실패

**증상**: 프론트엔드에서 API 요청 실패

**해결**:
1. `VITE_API_URL` 환경 변수 확인
2. 백엔드 URL이 올바른지 확인 (끝에 `/api` 포함)
3. 백엔드 Health Check 확인
4. CORS 설정 확인 (`FRONTEND_URL`)

### CORS 오류

**증상**: 브라우저 콘솔에 CORS 오류

**해결**:
1. 백엔드 `FRONTEND_URL` 환경 변수 확인
2. 프론트엔드 URL과 정확히 일치하는지 확인
3. 여러 도메인 사용 시: `FRONTEND_URL=https://domain1.com,https://domain2.com`

---

## 📝 체크리스트

배포 전:
- [ ] GitHub에 코드 푸시 완료
- [ ] 로컬에서 빌드 테스트 완료
- [ ] JWT_SECRET 생성 완료
- [ ] 환경 변수 목록 준비 완료

백엔드 배포:
- [ ] Railway/Render 계정 생성
- [ ] 프로젝트 생성 및 설정
- [ ] 환경 변수 모두 설정
- [ ] Health Check 통과
- [ ] 백엔드 URL 확인 및 저장

프론트엔드 배포:
- [ ] Vercel 계정 생성
- [ ] 프로젝트 생성 및 설정
- [ ] Root Directory: `frontend` 설정
- [ ] `VITE_API_URL` 환경 변수 설정
- [ ] 배포 완료 및 URL 확인

배포 후:
- [ ] 백엔드 `FRONTEND_URL` 업데이트
- [ ] 로그인 테스트
- [ ] 주요 기능 테스트
- [ ] CORS 확인

---

## 🎯 빠른 참조

### 백엔드 URL 확인
```bash
# Railway
https://your-project.up.railway.app

# Render
https://your-project.onrender.com
```

### Health Check
```
https://your-backend-url/api/health
```

### 환경 변수 요약

**백엔드**:
- `DATABASE_URL` - Neon 연결 문자열
- `JWT_SECRET` - 랜덤 문자열 (생성 필요)
- `SCHOOL_PASSWORD` - 일반 사용자 비밀번호
- `ADMIN_PASSWORD` - 관리자 비밀번호
- `FRONTEND_URL` - 프론트엔드 URL (나중에 업데이트)
- 기타 SMTP 설정

**프론트엔드**:
- `VITE_API_URL` - 백엔드 URL + `/api`

---

## 💡 팁

1. **단계별 진행**: 한 번에 모든 것을 배포하려 하지 말고, 백엔드 → 프론트엔드 순서로 진행
2. **로그 확인**: 배포 플랫폼의 로그를 자주 확인하여 문제를 빠르게 발견
3. **테스트**: 각 단계마다 테스트하여 문제를 조기에 발견
4. **환경 변수**: 민감한 정보는 환경 변수로 관리하고 Git에 커밋하지 않기

---

배포 중 문제가 발생하면 각 플랫폼의 문서를 참고하거나 로그를 확인하세요!

