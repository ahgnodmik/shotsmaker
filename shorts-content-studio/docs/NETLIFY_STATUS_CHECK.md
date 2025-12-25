# Netlify 연동 및 배포 상태 확인 가이드

## 현재 상태

### ✅ 확인된 사항

1. **Netlify CLI 설치됨**: `netlify-cli@23.12.3`
2. **netlify.toml 설정 완료**: 빌드 설정 및 함수 설정 포함
3. **GitHub 저장소 연결**: `https://github.com/ahgnodmik/shotsmaker.git`

## 상태 확인 방법

### 1. Netlify CLI로 상태 확인

```bash
# 로그인 상태 확인
netlify status

# 사이트 목록 확인
netlify sites:list

# 현재 디렉토리 연결된 사이트 확인
netlify status --json
```

### 2. Netlify 대시보드에서 확인

1. [Netlify 대시보드](https://app.netlify.com) 접속
2. 로그인 후 사이트 목록 확인
3. `shotsmaker` 또는 관련 사이트 찾기

## 연동 설정 단계

### 단계 1: Netlify 로그인

```bash
netlify login
```

브라우저가 열리면 Netlify 계정으로 로그인하세요.

### 단계 2: 사이트 초기화 (처음인 경우)

```bash
# 현재 디렉토리를 Netlify 사이트로 초기화
netlify init

# 또는 기존 사이트에 연결
netlify link
```

### 단계 3: GitHub 연동 확인

Netlify 대시보드에서:
1. 사이트 선택
2. **Site settings** > **Build & deploy**
3. **Continuous Deployment** 섹션 확인
4. 연결된 저장소: `ahgnodmik/shotsmaker` 확인

### 단계 4: 환경 변수 설정 확인

Netlify 대시보드에서:
1. **Site settings** > **Environment variables**
2. 다음 변수들이 설정되어 있는지 확인:

```env
GOOGLE_SHEET_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
OPENAI_API_KEY
OPENAI_MODEL
```

### 단계 5: 배포 상태 확인

```bash
# 최신 배포 확인
netlify deploy:list

# 배포 로그 확인
netlify logs
```

## 배포 테스트

### 로컬 빌드 테스트

```bash
# 빌드 테스트
npm run build

# 빌드 성공 확인
ls -la .next
```

### 수동 배포 테스트

```bash
# 프로덕션 배포
netlify deploy --prod

# 또는 미리보기 배포
netlify deploy
```

## 문제 해결

### 문제 1: 로그인 안 됨

```bash
# 로그아웃 후 재로그인
netlify logout
netlify login
```

### 문제 2: 사이트 연결 안 됨

```bash
# 사이트 목록 확인
netlify sites:list

# 사이트 ID로 연결
netlify link --id YOUR_SITE_ID
```

### 문제 3: 빌드 실패

1. 로컬에서 빌드 테스트:
   ```bash
   npm run build
   ```

2. Netlify 대시보드에서 배포 로그 확인
3. 환경 변수 확인

### 문제 4: 환경 변수 인식 안 됨

1. Netlify 대시보드에서 환경 변수 재확인
2. 변수 이름 오타 확인
3. 재배포:
   ```bash
   netlify deploy --prod
   ```

## 자동 배포 확인

### GitHub 푸시 시 자동 배포

1. GitHub에 코드 푸시:
   ```bash
   git push origin main
   ```

2. Netlify 대시보드에서 자동 배포 시작 확인
3. 배포 완료 대기 (보통 2-5분)

### 배포 알림 설정

1. **Site settings** > **Notifications**
2. 이메일/Slack 알림 설정
3. 배포 성공/실패 알림 받기

## 체크리스트

배포 준비 상태 확인:

- [ ] Netlify CLI 설치됨
- [ ] Netlify 로그인 완료
- [ ] GitHub 저장소 연결됨
- [ ] netlify.toml 설정 완료
- [ ] 환경 변수 설정 완료
- [ ] 로컬 빌드 성공
- [ ] 첫 배포 성공
- [ ] 자동 배포 작동 확인

## 다음 단계

1. **첫 배포 실행**
   ```bash
   netlify deploy --prod
   ```

2. **사이트 URL 확인**
   - Netlify 대시보드에서 사이트 URL 확인
   - 예: `https://shotsmaker.netlify.app`

3. **API 테스트**
   ```bash
   curl https://your-site.netlify.app/api/shorts
   ```

4. **자동 배포 확인**
   - GitHub에 푸시
   - Netlify에서 자동 배포 확인




