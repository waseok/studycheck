# 컨텍스트 연속 가이드

## 새 대화 시작 시
```
의무연수 안내 취합 통합 플랫폼 프로젝트를 이어가고 싶습니다.
CONTEXT_CONTINUATION.md를 확인해주세요.
```

## 프로젝트 핵심 정보

**경로**: `/Users/air/Library/CloudStorage/GoogleDrive-lds43890@ssem.re.kr/내 드라이브/동수동수동수동수동수동수동수동수/cursor/의무연수 안내 취합 통합 플랫폼`

**기술 스택**:
- 프론트엔드: React + TypeScript + Vite + Tailwind CSS
- 백엔드: Node.js + Express + TypeScript + Prisma
- DB: Neon PostgreSQL
- 배포: Vercel (프론트), Render (백엔드)

**실행**:
```bash
cd backend && npm run dev  # 포트 3000
cd frontend && npm run dev # 포트 5173
```

**로그인**:
- 일반: 이메일 + PIN 또는 초기 비밀번호 `1234`
- 관리자: 비밀번호 `8714`
- Google 로그인 지원

**배포 URL**:
- 프론트: https://studycheck-liard.vercel.app
- 백엔드: https://studycheck.onrender.com

## 현재 상태 (2024년 12월)

### 최근 작업 완료
1. ✅ 교직원 등록에 학년/반/직위 필드 추가
2. ✅ 로그인 페이지 개선 (아이디/비밀번호 저장, 입력칸 대비 증가)
3. ✅ 연수 등록부 필드 제거
4. ✅ 연수 취합 페이지 개선 (정렬/필터링, 컬럼 순서 변경)
5. ✅ 미이수자 알림 메일 발송 기능 (연수 관리 페이지에 버튼 추가)
6. ✅ Google 로그인 기능 추가
7. ✅ **로그인 문제 해결** (백엔드 서버 시작 오류, Prisma 스키마 불일치 해결)
8. ✅ **참여자 조회 문제 해결** (데이터베이스 필드 불일치 해결)
9. ✅ **회원가입 기능 추가** (이메일 ID, 직위/학년/반 선택 입력, 자동 교직원 등록)
10. ✅ **연수 설명란 추가** (연수 등록/수정 시 설명 입력 가능)
11. ✅ **연수 목록 다운로드 기능** (관리자용 엑셀 다운로드)
12. ✅ **내 정보 수정 페이지 추가** (일반 사용자가 학년/반 등 본인 정보 수정 가능)

### 현재 이슈
- 없음 (모든 기능 정상 작동)

## 로그인 관련

**Google OAuth 설정**:
- 클라이언트 ID: `169923019842-sp11ru0l59ghkq95r18fv0a52teg19ru.apps.googleusercontent.com`
- 환경 변수: 
  - 프론트엔드: `VITE_GOOGLE_CLIENT_ID` (`.env` 파일)
  - 백엔드: `GOOGLE_CLIENT_ID` (`.env` 파일)

**로그인 파일 위치**:
- 프론트엔드: `frontend/src/pages/Login.tsx`
- 백엔드: `backend/src/controllers/auth.ts` (googleLogin, register 함수)

**회원가입**:
- 회원가입 API: `/api/auth/register` (인증 불필요)
- 회원가입 시 자동으로 교직원 등록, 일반 사용자(USER)로 설정
- 입력 정보: 이름*, 이메일(ID)*, 유형*, 직위(선택), 학년(선택), 반(선택)
- 가입 후 초기 비밀번호(1234)로 로그인하여 PIN 설정 필요

**내 정보 수정**:
- 페이지: `/dashboard/profile` (`frontend/src/pages/Profile.tsx`)
- API: `GET /api/users/me`, `PUT /api/users/me` (본인만 수정 가능)
- 수정 가능: 이름, 이메일, 유형, 직위, 학년, 반
- 일반 사용자는 role과 isAdmin 수정 불가 (관리자 전용)

**문제 해결 시 확인사항**:
1. 백엔드 서버 실행 확인 (`http://localhost:3000/api/health`)
2. Prisma 스키마와 데이터베이스 동기화 확인 (`npx prisma db push`)
3. Prisma 클라이언트 재생성 필요 시 (`npm run db:generate`)

## 중요 코드 위치

**로그인/인증**:
- `backend/src/controllers/auth.ts` - 모든 로그인 로직 (googleLogin 포함)
- `backend/src/routes/auth.ts` - 인증 라우트
- `frontend/src/pages/Login.tsx` - 로그인 페이지
- `frontend/src/api/auth.ts` - 인증 API 클라이언트

**보안 핵심**:
- `backend/src/controllers/participants.ts` - `getMyTrainings`: `userId`로만 필터링
- `backend/src/middleware/auth.ts` - JWT 토큰 검증

**주요 페이지**:
- `frontend/src/pages/Dashboard.tsx` - 대시보드
- `frontend/src/pages/Trainings.tsx` - 연수 관리 (미이수자 알림 발송 버튼, 연수 목록 다운로드, 설명란 추가)
- `frontend/src/pages/TrainingCollection.tsx` - 연수 취합 (정렬/필터링 포함)
- `frontend/src/pages/Users.tsx` - 교직원 관리 (학년/반/직위 필드)
- `frontend/src/pages/Profile.tsx` - 내 정보 수정 (일반 사용자 본인 정보 수정)
- `frontend/src/pages/Login.tsx` - 로그인/회원가입 (회원가입 버튼 및 모달 추가)

## 보안 규칙

1. **`getMyTrainings`**: `userId`가 없으면 빈 배열 반환, `userId`로만 필터링
2. **관리자**: 모든 연수는 `/trainings` API 사용, `getMyTrainings`는 자신의 연수만
3. **일반 사용자**: 항상 자신의 데이터만 조회

## 빠른 시작

1. **서버 실행 확인**:
   ```bash
   lsof -ti:3000,5173  # 실행 중인지 확인
   # 없으면 각각 실행
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

2. **데이터베이스 스키마 동기화** (필요 시):
   ```bash
   cd backend
   npx prisma db push  # 스키마 변경 시
   npm run db:generate  # Prisma 클라이언트 재생성
   ```

3. **주요 기능**:
   - 회원가입: 로그인 페이지에서 "회원가입" 버튼 클릭
   - 내 정보 수정: 상단 메뉴 "내 정보" 클릭 (학년/반 수정 가능)
   - 연수 목록 다운로드: 연수 관리 페이지에서 "연수 목록 다운로드" 버튼 클릭

4. **문제 해결 순서**:
   - 백엔드 서버 실행 확인 (`curl http://localhost:3000/api/health`)
   - Prisma 스키마와 데이터베이스 동기화 확인
   - 브라우저 콘솔 오류 확인
   - 백엔드 로그 확인 (`/tmp/backend.log`)

## 최근 수정 사항 (2024년 12월)

### 데이터베이스 스키마 변경
- `User` 모델: `position`, `grade`, `class` 필드 추가 (회원가입 시 입력 가능)
- `Training` 모델: `description` 필드 추가 (연수 설명란)

### 새로 추가된 API
- `POST /api/auth/register` - 회원가입 (인증 불필요)
- `GET /api/users/me` - 현재 사용자 정보 조회
- `PUT /api/users/me` - 현재 사용자 정보 수정

### 주요 변경 파일
- `backend/src/controllers/auth.ts` - register 함수 추가
- `backend/src/controllers/users.ts` - getMyProfile, updateMyProfile 함수 추가
- `backend/src/routes/users.ts` - `/me` 엔드포인트 추가
- `backend/src/controllers/participants.ts` - select에서 position, grade, class 포함
- `frontend/src/pages/Login.tsx` - 회원가입 모달 추가
- `frontend/src/pages/Profile.tsx` - 새로 생성 (내 정보 수정 페이지)
- `frontend/src/pages/Trainings.tsx` - 설명란 및 다운로드 기능 추가
- `frontend/src/App.tsx` - `/dashboard/profile` 라우트 추가
- `frontend/src/components/Layout.tsx` - "내 정보" 메뉴 추가

## 참고
- 상세 정보는 `PROJECT_STATUS.md`, `PROJECT_PLAN.md` 참고
- 변경사항은 이 파일에 간단히 기록
