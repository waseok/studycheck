# 서버 재시작 가이드

## 🔄 서버 재시작 방법

### 1단계: 현재 실행 중인 서버 중지

#### 방법 1: 터미널에서 직접 중지
- 서버를 실행한 터미널 창에서 `Ctrl + C` (Mac: `Cmd + C`)를 누르세요
- 여러 번 눌러서 완전히 중지되도록 하세요

#### 방법 2: 포트를 사용하는 프로세스 강제 종료
터미널에서 다음 명령어를 실행하세요:

**백엔드 서버 (포트 3000) 중지:**
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# 또는
kill -9 $(lsof -ti:3000)
```

**프론트엔드 서버 (포트 5173) 중지:**
```bash
# Mac/Linux
lsof -ti:5173 | xargs kill -9

# 또는
kill -9 $(lsof -ti:5173)
```

### 2단계: 서버 재시작

#### 백엔드 서버 재시작
```bash
cd backend
npm run dev
```

성공하면 다음과 같은 메시지가 나타납니다:
```
서버가 포트 3000에서 실행 중입니다.
```

#### 프론트엔드 서버 재시작 (새 터미널 창에서)
```bash
cd frontend
npm run dev
```

성공하면 다음과 같은 메시지가 나타납니다:
```
VITE v5.0.8  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 3단계: 브라우저 캐시 삭제

1. 브라우저를 완전히 닫기
2. 브라우저를 다시 열기
3. `http://localhost:5173` 접속
4. 개발자 도구 열기 (F12)
5. Network 탭에서 "Disable cache" 체크

## 🔍 문제가 계속되면 확인할 사항

1. **백엔드 서버가 실행 중인지 확인**
   ```bash
   lsof -ti:3000
   ```
   결과가 나오면 서버가 실행 중입니다.

2. **프론트엔드 서버가 실행 중인지 확인**
   ```bash
   lsof -ti:5173
   ```
   결과가 나오면 서버가 실행 중입니다.

3. **환경 변수 확인**
   - `backend/.env` 파일이 있는지 확인
   - `JWT_SECRET`이 설정되어 있는지 확인

4. **브라우저 localStorage 확인**
   - 개발자 도구 → Application 탭 → Local Storage
   - `token`과 `isAdmin`이 저장되어 있는지 확인

