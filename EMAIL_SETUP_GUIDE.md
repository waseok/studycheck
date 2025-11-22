# 이메일 설정 가이드

의무연수 안내 취합 통합 플랫폼의 이메일(SMTP) 설정 방법을 안내합니다.

## 목차
1. [Gmail 사용 방법](#gmail-사용-방법)
2. [다른 이메일 서비스 사용](#다른-이메일-서비스-사용)
3. [환경 변수 설정](#환경-변수-설정)
4. [이메일 테스트](#이메일-테스트)
5. [문제 해결](#문제-해결)

---

## Gmail 사용 방법

### 1단계: Gmail 2단계 인증 활성화

1. Google 계정 설정 페이지 접속: https://myaccount.google.com/security
2. "2단계 인증" 섹션 찾기
3. "2단계 인증 사용" 클릭
4. 안내에 따라 2단계 인증 설정 완료

> **중요**: 앱 비밀번호를 생성하려면 반드시 2단계 인증이 활성화되어 있어야 합니다.

### 2단계: 앱 비밀번호 생성

1. Google 계정 설정 페이지에서 "앱 비밀번호" 검색 또는 직접 접속: https://myaccount.google.com/apppasswords
2. "앱 선택" 드롭다운에서 "기타(맞춤 이름)" 선택
3. 앱 이름 입력 (예: "의무연수 플랫폼")
4. "생성" 버튼 클릭
5. 생성된 16자리 앱 비밀번호 복사 (공백 없이)

> **참고**: 앱 비밀번호는 한 번만 표시됩니다. 안전한 곳에 저장해두세요.

### 3단계: 환경 변수 설정

`backend/.env` 파일을 열고 다음 설정을 추가/수정합니다:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="생성한_앱_비밀번호_16자리"
```

**예시:**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="example@gmail.com"
SMTP_PASS="abcd efgh ijkl mnop"
```

> **주의**: `SMTP_PASS`에는 Gmail 계정 비밀번호가 아닌 **앱 비밀번호**를 입력해야 합니다.

### 4단계: 서버 재시작

환경 변수를 변경한 후에는 백엔드 서버를 재시작해야 합니다:

```bash
# 백엔드 서버 중지 (Ctrl+C)
# 백엔드 서버 재시작
cd backend
npm run dev
```

---

## 다른 이메일 서비스 사용

### Outlook/Hotmail

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
```

### Naver

```env
SMTP_HOST="smtp.naver.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@naver.com"
SMTP_PASS="your-password"
```

### Daum

```env
SMTP_HOST="smtp.daum.net"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@hanmail.net"
SMTP_PASS="your-password"
```

### 기업용 이메일

기업용 이메일 서버를 사용하는 경우 IT 담당자에게 다음 정보를 요청하세요:
- SMTP 서버 주소 (호스트)
- SMTP 포트 번호
- 보안 연결 여부 (SSL/TLS)
- 인증 방법

---

## 환경 변수 설정

### 필수 환경 변수

`backend/.env` 파일에 다음 변수들이 설정되어 있어야 합니다:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `SMTP_HOST` | SMTP 서버 주소 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP 포트 번호 | `587` (TLS) 또는 `465` (SSL) |
| `SMTP_SECURE` | SSL/TLS 사용 여부 | `false` (587) 또는 `true` (465) |
| `SMTP_USER` | 이메일 주소 | `your-email@gmail.com` |
| `SMTP_PASS` | 이메일 비밀번호 또는 앱 비밀번호 | `your-password` |

### 포트 번호 가이드

- **587 (TLS)**: `SMTP_SECURE=false` 사용
- **465 (SSL)**: `SMTP_SECURE=true` 사용
- **25**: 대부분의 이메일 서비스에서 차단됨 (사용 비권장)

---

## 이메일 테스트

### 방법 1: 대시보드에서 테스트

1. 관리자 계정으로 로그인
2. 대시보드 페이지로 이동
3. "이메일 설정 테스트" 카드에서 테스트 이메일 주소 입력
4. "테스트 이메일 발송" 버튼 클릭
5. 이메일 수신 확인

### 방법 2: API 직접 호출

```bash
curl -X POST http://localhost:3000/api/reminders/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "test@example.com"}'
```

### 테스트 성공 시

- 테스트 이메일이 수신함에 도착
- 대시보드에 "성공" 메시지 표시
- 리마인더 기능이 정상 작동

### 테스트 실패 시

- 이메일이 수신되지 않음
- 대시보드에 오류 메시지 표시
- [문제 해결](#문제-해결) 섹션 참고

---

## 문제 해결

### 1. "인증 실패" 오류

**원인**: 
- 잘못된 이메일 주소 또는 비밀번호
- Gmail의 경우 앱 비밀번호를 사용하지 않음

**해결 방법**:
- Gmail 사용 시: 앱 비밀번호 생성 및 사용
- 다른 서비스: 계정 비밀번호 확인
- 2단계 인증이 활성화되어 있는지 확인

### 2. "연결 시간 초과" 오류

**원인**:
- 잘못된 SMTP 호스트 또는 포트
- 방화벽 또는 네트워크 문제

**해결 방법**:
- `SMTP_HOST`와 `SMTP_PORT` 확인
- 회사 네트워크 사용 시 IT 담당자에게 문의
- 다른 포트 번호 시도 (587 ↔ 465)

### 3. "이메일을 받지 못함"

**원인**:
- 스팸 폴더로 이동
- 잘못된 이메일 주소
- SMTP 설정 오류

**해결 방법**:
- 스팸 폴더 확인
- 이메일 주소 정확성 확인
- 대시보드에서 테스트 이메일 발송하여 확인

### 4. "리마인더가 발송되지 않음"

**원인**:
- 스케줄러가 실행되지 않음
- 연수에 deadline이 설정되지 않음
- 참여자가 없음

**해결 방법**:
- 백엔드 서버가 실행 중인지 확인
- 연수에 이수 기한(deadline)이 설정되어 있는지 확인
- 연수에 참여자가 등록되어 있는지 확인
- 대시보드에서 "리마인더 수동 발송" 버튼으로 테스트

### 5. Gmail "보안 수준이 낮은 앱" 오류

**원인**: 
- 구형 Gmail 보안 설정

**해결 방법**:
- 앱 비밀번호 사용 (권장)
- 또는 Google 계정 설정에서 "보안 수준이 낮은 앱의 액세스" 허용 (비권장)

---

## 리마인더 스케줄

리마인더는 다음 조건에 따라 자동으로 발송됩니다:

### 자동 발송 시간
- **매일 오전 9시** (한국 시간 기준)

### 발송 조건

1. **3개월 전 알림**
   - 연수 종료일이 정확히 3개월 후인 경우
   - 각 참여자당 1회만 발송

2. **1개월 전 알림**
   - 연수 종료일이 정확히 1개월 후인 경우
   - 각 참여자당 1회만 발송

3. **이수번호 미입력 알림**
   - 연수 종료일이 1개월 이내인 경우
   - 이수번호가 입력되지 않은 참여자에게
   - 최근 7일 내에 발송하지 않은 경우에만 발송

### 수동 발송

대시보드의 "리마인더 수동 발송" 버튼을 사용하면 스케줄을 기다리지 않고 즉시 발송할 수 있습니다.

---

## 보안 권장사항

1. **앱 비밀번호 사용**: Gmail 사용 시 반드시 앱 비밀번호 사용
2. **환경 변수 보호**: `.env` 파일을 Git에 커밋하지 않기
3. **정기적 변경**: 앱 비밀번호를 정기적으로 변경
4. **접근 제한**: 관리자만 이메일 설정 변경 가능

---

## 추가 정보

- **이메일 템플릿**: `backend/src/services/email.ts`에서 수정 가능
- **스케줄러 설정**: `backend/src/services/reminder.ts`에서 수정 가능
- **리마인더 로그**: 데이터베이스의 `training_reminders` 테이블에서 확인 가능

---

## 문의

이메일 설정 관련 문제가 지속되면 다음을 확인하세요:
1. 백엔드 서버 로그 (`console.log` 출력)
2. 데이터베이스의 `training_reminders` 테이블
3. 이메일 서비스 제공업체의 SMTP 설정 문서

