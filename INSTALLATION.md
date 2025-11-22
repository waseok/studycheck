# Node.js 설치 가이드 (macOS)

## 방법 1: 공식 웹사이트에서 설치 (가장 간단)

1. **Node.js 공식 웹사이트 방문**
   - 브라우저에서 https://nodejs.org/ 접속
   - LTS (Long Term Support) 버전 다운로드 클릭
   - macOS 설치 파일 (.pkg) 다운로드

2. **설치 파일 실행**
   - 다운로드한 `.pkg` 파일 더블클릭
   - 설치 마법사를 따라 진행
   - 관리자 비밀번호 입력 (필요시)

3. **설치 확인**
   ```bash
   node --version
   npm --version
   ```

---

## 방법 2: Homebrew를 사용하여 설치 (권장)

### Homebrew 설치 (아직 설치되지 않은 경우)

1. **터미널 열기**
   - `Command + Space` → "터미널" 입력

2. **Homebrew 설치**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   - 설치 중 관리자 비밀번호 입력 요청
   - 설치 완료까지 몇 분 소요

3. **Homebrew 설치 확인**
   ```bash
   brew --version
   ```

### Node.js 설치

```bash
# Node.js 설치 (LTS 버전)
brew install node

# 설치 확인
node --version
npm --version
```

---

## 방법 3: nvm (Node Version Manager)을 사용하여 설치 (개발자용)

여러 버전의 Node.js를 관리하고 싶은 경우 사용

### nvm 설치

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 터미널 재시작 또는 다음 명령어 실행
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Node.js 설치

```bash
# 최신 LTS 버전 설치
nvm install --lts

# 설치된 버전 사용
nvm use --lts

# 설치 확인
node --version
npm --version
```

---

## 설치 후 확인

터미널에서 다음 명령어를 실행하여 설치가 정상적으로 완료되었는지 확인하세요:

```bash
node --version
# 예상 출력: v20.x.x (버전 번호)

npm --version
# 예상 출력: 10.x.x (버전 번호)
```

---

## 문제 해결

### "command not found: node" 오류가 발생하는 경우

1. 터미널을 완전히 종료하고 다시 열기
2. `~/.zshrc` 또는 `~/.bash_profile` 파일에 경로가 추가되었는지 확인
3. 다음 명령어로 경로 추가:
   ```bash
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

### 권한 오류가 발생하는 경우

```bash
# npm 전역 패키지 설치 경로 확인
npm config get prefix

# 필요시 권한 수정 (권장하지 않음)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

---

## 추천 방법

- **초보자**: 방법 1 (공식 웹사이트에서 설치)
- **일반 사용자**: 방법 2 (Homebrew 사용)
- **개발자**: 방법 3 (nvm 사용)

---

## 설치 후 프로젝트 설정

Node.js 설치가 완료되면 다음 명령어를 실행하세요:

```bash
# 프로젝트 디렉토리로 이동
cd "/Users/air/Library/CloudStorage/GoogleDrive-lds43890@ssem.re.kr/내 드라이브/동수동수동수동수동수동수동수동수/cursor/의무연수 안내 취합 통합 플랫폼"

# 프론트엔드 의존성 설치
cd frontend
npm install

# 백엔드 의존성 설치
cd ../backend
npm install
```

