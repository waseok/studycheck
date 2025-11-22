# 의무연수 안내 취합 통합 플랫폼 개발 계획

## 프로젝트 개요
Google Sheets의 연수 데이터를 기반으로 교직원 연수 안내, 이수번호 취합, 통계, 자동 리마인더 기능을 제공하는 웹 플랫폼

## 기술 스택

### 프론트엔드
- **React + TypeScript + Vite** - 모던 웹 애플리케이션
- **Tailwind CSS + shadcn/ui** - 모던 UI 컴포넌트

### 백엔드
- **Node.js + Express + TypeScript** - 서버 API
- **PostgreSQL** - 데이터베이스 (배포 시 Railway/Neon 사용)
- **Prisma** - ORM (데이터베이스 관리)

### 인증
- **세션 기반 인증** 또는 **JWT 토큰**
- 일반 교직원: 학교 공통 비밀번호
- 관리자: 별도 관리자 비밀번호
- 비밀번호는 환경변수로 관리, 해시화하여 저장

### 이메일
- **Nodemailer** - 이메일 발송 라이브러리
- **SMTP 서버 옵션**:
  1. Gmail SMTP (학교 Gmail 사용 시, 앱 비밀번호 필요)
  2. SendGrid (월 100통 무료)
  3. Resend (월 3,000통 무료)

### 배포
- **프론트엔드**: Vercel (무료 티어, 자동 배포, HTTPS)
- **백엔드**: Railway 또는 Render (무료 티어, PostgreSQL 포함)
- **도메인**: 커스텀 도메인 가능

### 데이터 연동
- **초기**: CSV export 후 import 기능 또는 직접 입력
- **향후**: Google Sheets API 연동 가능 (선택사항)

## 핵심 기능

### 1. 교직원 관리
- 교직원 등록 (이름, 이메일, 유형: 교원/직원/공무직/기간제교사 등)
- 교직원 목록 조회/수정/삭제
- 교직원 유형별 필터링
- 관리자만 교직원 관리 가능

### 2. 연수 관리
- 연수 목록 조회/등록/수정/삭제
- 연수 정보: 연수명, 연수등록부, 이수 주기, 대상자 범위, 이수시간, 실시일, 업무부서, 담당자, 연수자료 및 방법, 이수 종료 기간
- 연수별 대상자 범위 설정 (예: "교원", "교직원", "기간제교사+교육공무직")
- 대상자 범위에 해당하는 교직원 자동 매칭
- 관리자만 연수 관리 가능

### 3. 연수 취합
- 연수별 취합 페이지 자동 생성
- 대상자 범위에 해당하는 교직원 자동 포함
- 교직원별 이수번호 입력 기능
- 이수번호 미입력자 확인
- 일반 교직원은 자신의 이수번호만 입력 가능

### 4. 통계
- 연수별 이수 현황 통계 (이수 완료율, 미이수자 수 등)
- 교직원별 이수 현황 통계
- 미이수자 목록
- 관리자만 통계 조회 가능

### 5. 자동 리마인더
- 연수 종료 3개월 전 자동 이메일 발송
- 연수 종료 1개월 전 자동 이메일 발송
- 이수번호 미입력자 리마인더 발송
- 스케줄러 (node-cron) 구현
- 리마인더 로그 관리

## 데이터베이스 스키마 설계

### 테이블 구조

1. **users** (교직원)
   - id (PK), name, email, user_type, is_admin, password_hash, created_at, updated_at

2. **trainings** (연수)
   - id (PK), name, registration_book, cycle, target_users (JSON 배열), hours, implementation_date, department, manager, method, deadline, created_at, updated_at

3. **training_participants** (연수 참여자)
   - id (PK), training_id (FK), user_id (FK), completion_number, status, completed_at, created_at, updated_at

4. **training_reminders** (리마인더 로그)
   - id (PK), training_id (FK), user_id (FK), reminder_type (3months/1month/missing), sent_at, status, created_at

5. **sessions** (세션 관리, 선택사항)
   - id (PK), user_id (FK), token, expires_at, created_at

## 구현 단계

### Phase 1: 프로젝트 초기 설정
- 프로젝트 구조 생성 (프론트엔드/백엔드 분리)
- 의존성 설치 및 설정
- 데이터베이스 스키마 생성 (Prisma)
- 기본 인증 시스템 구현

### Phase 2: 교직원 관리
- 교직원 CRUD API
- 교직원 관리 UI (관리자 전용)
- 교직원 유형 관리
- CSV import 기능

### Phase 3: 연수 관리
- 연수 CRUD API
- 연수 관리 UI (관리자 전용)
- 연수 대상자 자동 매칭 로직
- CSV import 기능 (Google Sheets export 가능)

### Phase 4: 연수 취합
- 연수별 취합 페이지 생성
- 이수번호 입력 기능 (교직원)
- 취합 현황 조회 (관리자)
- 이수번호 미입력자 확인

### Phase 5: 통계
- 통계 API
- 대시보드 UI (관리자)
- 차트/그래프 표시 (이수 현황, 미이수자 등)

### Phase 6: 자동 리마인더
- 이메일 발송 기능 (Nodemailer)
- 스케줄러 구현 (node-cron)
- 리마인더 설정 UI (관리자)
- 리마인더 로그 관리

### Phase 7: 배포
- 환경변수 설정
- Vercel 배포 (프론트엔드)
- Railway/Render 배포 (백엔드+DB)
- 도메인 설정

## 주요 구현 사항

### 인증 시스템
- 로그인 페이지: 학교 비밀번호 (일반 교직원) / 관리자 비밀번호 (관리자)
- 세션 또는 JWT 토큰 기반 인증
- 역할 기반 접근 제어 (RBAC)

### 대상자 자동 매칭
- 연수별 target_users 필드에 유형 배열 저장 (예: ["교원", "직원"])
- 교직원 user_type과 비교하여 자동 매칭
- 연수 등록/수정 시 training_participants 자동 생성

### 리마인더 시스템
- 매일 스케줄러 실행
- 연수 종료일 기준 3개월 전, 1개월 전 체크
- 이수번호 미입력자 체크
- 이메일 발송 및 로그 저장

### 이메일 템플릿
- 연수 종료 3개월 전 리마인더
- 연수 종료 1개월 전 리마인더
- 이수번호 미입력자 리마인더
- 한글 지원

## 확인된 요구사항

### 1. 이메일 서버
- **추천**: Gmail SMTP (학교 Gmail 사용 시) 또는 SendGrid/Resend (무료 티어)
- Gmail SMTP: 학교 Gmail 계정 사용 (앱 비밀번호 필요)
- SendGrid: 월 100통 무료
- Resend: 월 3,000통 무료

### 2. 인증 방식
- **일반 교직원**: 학교 공통 비밀번호로 로그인
- **관리자(연수 담당자)**: 별도 관리자 비밀번호로 로그인
- 비밀번호는 환경변수로 관리, 해시화하여 저장

### 3. 배포 환경
- **추천**: Vercel (프론트엔드) + Railway (백엔드+PostgreSQL)
  - 무료 티어로 시작 가능
  - 자동 배포 (Git 연결)
  - HTTPS 자동 제공
  - 커스텀 도메인 가능

### 4. Google Sheets 연동
- **초기**: CSV export 후 import 기능 또는 직접 입력
- **이유**: 
  - 간단한 시작
  - 데이터베이스와 동기화 이슈 방지
  - 관리자가 직접 입력/수정 가능
- **향후 확장**: Google Sheets를 백업/동기화 용도로 사용 가능

## 구현 Todo 리스트

1. ✅ 프로젝트 초기 설정 - 프론트엔드/백엔드 구조 생성, 의존성 설치
2. ✅ 데이터베이스 스키마 설계 및 생성 (users, trainings, training_participants, training_reminders)
3. ✅ 인증 시스템 구현 (학교 비밀번호/관리자 비밀번호, 세션/JWT)
4. ✅ 교직원 관리 기능 구현 (CRUD API 및 UI, CSV import)
5. ✅ 연수 관리 기능 구현 (CRUD API, 대상자 자동 매칭, UI, CSV import)
6. ✅ 연수 취합 기능 구현 (취합 페이지 생성, 이수번호 입력)
7. ✅ 통계 기능 구현 (이수 현황 통계, 대시보드)
8. ✅ 자동 리마인더 기능 구현 (이메일 발송, 스케줄러, 리마인더 로그)
9. ✅ 배포 설정 (Vercel 프론트엔드, Railway/Render 백엔드)

## 참고사항

- 모든 날짜는 한국 시간 기준 (KST)
- 이메일은 한글 지원 필수
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 접근성 고려 (키보드 네비게이션, 스크린 리더 지원)

