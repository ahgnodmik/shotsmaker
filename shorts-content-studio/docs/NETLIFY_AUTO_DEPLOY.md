# Netlify 자동 배포 설정 가이드

이 가이드는 GitHub 저장소와 Netlify를 연동하여 자동 배포를 설정하는 방법을 설명합니다.

## 📋 사전 요구사항

1. GitHub 계정 및 저장소
2. Netlify 계정
3. 프로젝트가 GitHub에 푸시되어 있어야 함

## 🚀 1단계: GitHub 저장소 준비

### 1-1. 저장소 생성 및 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init

# .gitignore 확인 (node_modules, .env.local 등 제외)
cat .gitignore

# GitHub 저장소 생성 후
git remote add origin https://github.com/your-username/shorts-content-studio.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 1-2. .gitignore 확인

다음 파일들이 제외되어 있는지 확인:

```
node_modules/
.next/
.env.local
.env*.local
output/
temp/
*.log
.DS_Store
```

## 🔗 2단계: Netlify와 GitHub 연동

### 2-1. Netlify 사이트 생성

1. [Netlify](https://app.netlify.com)에 로그인
2. 대시보드에서 **"Add new site"** 클릭
3. **"Import an existing project"** 선택
4. **"GitHub"** 선택 (또는 GitLab/Bitbucket)
5. GitHub 인증 (처음이면 권한 부여)
6. 저장소 선택: `your-username/shorts-content-studio`

### 2-2. 빌드 설정

Netlify가 자동으로 감지하지만, 확인:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Base directory**: (비워둠)

> 💡 `netlify.toml` 파일이 있으면 자동으로 이 설정을 사용합니다.

### 2-3. 배포 시작

**"Deploy site"** 버튼 클릭

## ⚙️ 3단계: 환경 변수 설정

### 3-1. 환경 변수 추가

1. Netlify 대시보드에서 사이트 선택
2. **Site settings** > **Environment variables** 이동
3. **"Add a variable"** 클릭

### 3-2. 필수 환경 변수

다음 변수들을 추가:

```env
# Google Sheets API
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI API
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 3-3. GOOGLE_PRIVATE_KEY 설정 팁

**방법 1: 직접 입력 (권장)**
- Netlify 환경 변수 입력란에 전체 private key를 복사/붙여넣기
- `\n`을 실제 줄바꿈으로 변환하여 입력
- 따옴표로 감싸기

**방법 2: Base64 인코딩**
```bash
# 로컬에서
cat your-service-account-key.json | base64

# Netlify에서
GOOGLE_PRIVATE_KEY_BASE64=<base64-encoded-value>
```

그리고 코드에서 디코딩:
```typescript
const privateKey = Buffer.from(
  process.env.GOOGLE_PRIVATE_KEY_BASE64 || '', 
  'base64'
).toString();
```

### 3-4. 환경별 변수 설정

- **Production**: 프로덕션 배포용
- **Deploy previews**: PR 미리보기용
- **Branch deploys**: 특정 브랜치 배포용

각각 다른 값을 설정할 수 있습니다.

## 🔄 4단계: 자동 배포 확인

### 4-1. 자동 배포 동작

다음 상황에서 자동 배포가 트리거됩니다:

1. **main/master 브랜치에 푸시**: 프로덕션 배포
2. **Pull Request 생성**: Deploy preview 생성
3. **다른 브랜치에 푸시**: Branch deploy 생성

### 4-2. 배포 상태 확인

1. Netlify 대시보드 > **Deploys** 탭
2. 각 배포의 상태 확인:
   - ✅ **Published**: 성공
   - ⏳ **Building**: 빌드 중
   - ❌ **Failed**: 실패 (로그 확인)

### 4-3. 배포 로그 확인

배포를 클릭하면 상세 로그를 볼 수 있습니다:

- 빌드 명령어 실행
- 의존성 설치
- Next.js 빌드
- 함수 배포

## 🎯 5단계: 커스텀 도메인 설정 (선택사항)

### 5-1. 도메인 추가

1. **Site settings** > **Domain management**
2. **"Add custom domain"** 클릭
3. 도메인 입력 (예: `shorts.yourdomain.com`)

### 5-2. DNS 설정

Netlify가 제공하는 DNS 레코드를 사용하거나:

- **A 레코드**: Netlify IP 주소
- **CNAME**: `your-site.netlify.app`

## 🔍 6단계: 배포 확인 및 테스트

### 6-1. 사이트 접속

배포 완료 후:
```
https://your-site-name.netlify.app
```

### 6-2. API 엔드포인트 테스트

```bash
# 콘텐츠 목록 조회
curl https://your-site-name.netlify.app/api/shorts

# 주제 목록 조회
curl https://your-site-name.netlify.app/api/topics
```

### 6-3. 환경 변수 확인

API가 정상 작동하는지 확인:
- Google Sheets 연결
- OpenAI API 호출

## 🛠️ 7단계: 문제 해결

### 7-1. 빌드 실패

**원인**: 환경 변수 누락, 의존성 오류 등

**해결**:
1. 배포 로그 확인
2. 로컬에서 `npm run build` 테스트
3. 환경 변수 재확인

### 7-2. 함수 타임아웃

**원인**: 긴 작업 시간

**해결**:
- `netlify.toml`에서 타임아웃 설정:
```toml
[functions]
  timeout = 30  # 초 단위
```

### 7-3. 환경 변수 인식 안 됨

**원인**: 잘못된 형식, 따옴표 문제

**해결**:
1. 환경 변수 재입력
2. 따옴표 확인
3. 줄바꿈 문자 확인

### 7-4. Next.js 빌드 오류

**원인**: TypeScript 오류, 의존성 문제

**해결**:
```bash
# 로컬에서 테스트
npm run build

# 타입 체크
npx tsc --noEmit
```

## 📝 8단계: 배포 워크플로우

### 일반적인 워크플로우

1. **로컬에서 개발**
   ```bash
   npm run dev
   ```

2. **변경사항 커밋**
   ```bash
   git add .
   git commit -m "기능 추가"
   git push origin main
   ```

3. **자동 배포**
   - Netlify가 자동으로 감지
   - 빌드 시작
   - 배포 완료

4. **확인**
   - Netlify 대시보드에서 배포 상태 확인
   - 사이트 접속하여 테스트

### 브랜치 전략

- **main**: 프로덕션 배포
- **develop**: 개발 환경
- **feature/***: 기능 브랜치 (Deploy preview)

## 🔐 9단계: 보안 설정

### 9-1. 환경 변수 보호

- ✅ 절대 코드에 하드코딩하지 않기
- ✅ `.env.local`은 `.gitignore`에 포함
- ✅ Netlify 환경 변수만 사용

### 9-2. API 키 관리

- 정기적으로 키 로테이션
- 불필요한 권한 제거
- 사용하지 않는 키 삭제

## 📊 10단계: 모니터링

### 10-1. 배포 알림 설정

1. **Site settings** > **Notifications**
2. 이메일/Slack 알림 설정
3. 배포 성공/실패 알림 받기

### 10-2. 분석 설정

1. **Site settings** > **Analytics**
2. Netlify Analytics 활성화 (유료)
3. 또는 Google Analytics 연동

## ✅ 체크리스트

배포 전 확인사항:

- [ ] GitHub 저장소에 코드 푸시 완료
- [ ] Netlify와 GitHub 연동 완료
- [ ] 모든 환경 변수 설정 완료
- [ ] 로컬에서 `npm run build` 성공
- [ ] `netlify.toml` 설정 확인
- [ ] 첫 배포 성공 확인
- [ ] API 엔드포인트 테스트 통과
- [ ] 커스텀 도메인 설정 (선택사항)

## 🎉 완료!

이제 코드를 푸시할 때마다 자동으로 배포됩니다!

### 다음 단계

- [ ] CI/CD 파이프라인 최적화
- [ ] 성능 모니터링 설정
- [ ] 에러 트래킹 설정 (Sentry 등)
- [ ] 백업 전략 수립

## 📚 참고 자료

- [Netlify 공식 문서](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [환경 변수 관리](https://docs.netlify.com/environment-variables/overview/)




