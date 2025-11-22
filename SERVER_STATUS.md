# 서버 실행 상태

## 현재 실행 중인 서버

### 백엔드 서버
- **포트**: 3000
- **상태**: ✅ 실행 중
- **URL**: http://localhost:3000
- **API 엔드포인트**: http://localhost:3000/api

### 프론트엔드 서버
- **포트**: 5173
- **상태**: ✅ 실행 중
- **URL**: http://localhost:5173

## 브라우저 접속 방법

1. **브라우저 열기**
   - Chrome, Safari, Firefox 등 아무 브라우저나 열기

2. **주소 입력**
   - 주소창에 입력: `http://localhost:5173`
   - 또는 `http://localhost:5173/login`

3. **로그인**
   - 일반 교직원: `1234`
   - 관리자: `8714`

## 서버 재시작 방법

### 백엔드 서버 재시작

```bash
# 기존 서버 종료
lsof -ti:3000 | xargs kill

# 서버 시작
cd backend
npm run dev
```

### 프론트엔드 서버 재시작

```bash
# 기존 서버 종료
lsof -ti:5173 | xargs kill

# 서버 시작
cd frontend
npm run dev
```

## 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 포트 3000 사용 중인 프로세스 확인
lsof -ti:3000

# 포트 5173 사용 중인 프로세스 확인
lsof -ti:5173

# 프로세스 종료
kill [PID]
```

### 서버가 실행되지 않는 경우

1. **의존성 확인**
   ```bash
   # 백엔드
   cd backend
   npm install

   # 프론트엔드
   cd frontend
   npm install
   ```

2. **환경 변수 확인**
   - `backend/.env` 파일이 존재하는지 확인
   - `DATABASE_URL`이 올바르게 설정되었는지 확인

3. **로그 확인**
   - 백엔드: `/tmp/backend.log`
   - 프론트엔드: `/tmp/frontend.log`



