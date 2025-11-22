# 컨텍스트 연속 가이드

## 새 대화를 시작할 때

새로운 대화 세션이 시작되면 다음을 말씀해주세요:

```
의무연수 안내 취합 통합 플랫폼 프로젝트를 이어가고 싶습니다.
PROJECT_STATUS.md 파일을 확인해주세요.
```

또는:

```
PROJECT_STATUS.md를 읽고 프로젝트 상태를 확인해주세요.
```

## 프로젝트 핵심 정보

### 프로젝트 경로
```
/Users/air/Library/CloudStorage/GoogleDrive-lds43890@ssem.re.kr/내 드라이브/동수동수동수동수동수동수동수동수/cursor/의무연수 안내 취합 통합 플랫폼
```

### 주요 파일
- `PROJECT_STATUS.md` - 프로젝트 상태 요약
- `PROJECT_PLAN.md` - 프로젝트 계획서
- `README.md` - 프로젝트 개요
- `QUICK_START.md` - 빠른 시작 가이드
- `NEXT_STEPS.md` - 다음 단계 가이드
- `DATABASE_SETUP.md` - 데이터베이스 설정 가이드

### 환경 설정
- **백엔드**: `backend/.env` 파일에 환경 변수 설정
- **프론트엔드**: `frontend/` 폴더
- **데이터베이스**: Neon PostgreSQL (클라우드)

### 실행 방법
```bash
# 백엔드
cd backend && npm run dev

# 프론트엔드
cd frontend && npm run dev
```

### 로그인 정보
- 일반 교직원: `1234`
- 관리자: `8714`

## 현재 작업 상태

### 완료된 작업
1. ✅ 프로젝트 구조 생성
2. ✅ Node.js 설치
3. ✅ 데이터베이스 연결 (Neon)
4. ✅ 백엔드 API 구현
5. ✅ 프론트엔드 구현
6. ✅ 인증 시스템
7. ✅ 로그인 기능
8. ✅ ProtectedRoute 구현

### 해결된 이슈
1. ✅ 환경 변수 로드 문제
2. ✅ 로그인 후 메뉴 클릭 시 리다이렉트 문제

### 다음 작업 (필요 시)
1. 이메일 설정 (SMTP)
2. 데이터 입력 (교직원, 연수)
3. 배포 준비

## 문제 해결

### 서버 실행 문제
```bash
# 백엔드 서버 확인
lsof -ti:3000

# 프론트엔드 서버 확인
lsof -ti:5173

# 서버 재시작
cd backend && npm run dev
cd frontend && npm run dev
```

### 환경 변수 확인
```bash
cd backend
cat .env | grep -E "(SCHOOL_PASSWORD|ADMIN_PASSWORD|DATABASE_URL)"
```

## 참고사항

- 모든 주요 설정과 상태는 `PROJECT_STATUS.md`에 기록되어 있습니다.
- 새로운 기능을 추가하거나 문제를 해결한 후 `PROJECT_STATUS.md`를 업데이트하세요.
- 중요한 변경사항은 이 파일에도 기록하세요.

