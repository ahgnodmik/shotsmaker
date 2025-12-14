# Netlify 배포 가이드

이 프로젝트를 Netlify에 배포하여 웹에서 사용할 수 있도록 설정하는 방법입니다.

## ⚠️ 중요 제한사항

### FFmpeg 제한
Netlify Functions는 FFmpeg를 직접 사용할 수 없습니다. 비디오 생성 기능은 다음 중 하나를 선택해야 합니다:

1. **클라이언트 사이드 처리**: 브라우저에서 비디오 생성 (제한적)
2. **외부 서비스 사용**: Cloudinary, Mux, AWS MediaConvert 등
3. **별도 서버**: 비디오 생성을 위한 별도 서버 운영

현재 구현된 API는 비디오 생성 메타데이터만 제공합니다.

## 1단계: Netlify 프로젝트 생성

1. [Netlify](https://www.netlify.com)에 로그인
2. "Add new site" > "Import an existing project"
3. GitHub/GitLab/Bitbucket 저장소 연결
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

## 2단계: 환경 변수 설정

Netlify 대시보드에서 다음 환경 변수를 설정하세요:

**Site settings > Environment variables**에서 추가:

### 필수 환경 변수

```env
# Google Sheets API
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI API
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# YouTube API (선택사항)
YOUTUBE_CLIENT_ID=your-client-id
YOUTUBE_CLIENT_SECRET=your-client-secret
YOUTUBE_REDIRECT_URI=https://your-site.netlify.app/api/youtube/callback
YOUTUBE_REFRESH_TOKEN=your-refresh-token

# 이미지/비디오 소스 (선택사항)
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key
```

### 환경 변수 설정 주의사항

1. **GOOGLE_PRIVATE_KEY**: 
   - 여러 줄 문자열이므로 따옴표로 감싸야 함
   - `\n`을 실제 줄바꿈으로 변환해야 함
   - Netlify에서는 환경 변수에 직접 입력하거나
   - Base64로 인코딩하여 저장 후 디코딩하는 방법 사용

2. **프로덕션/스테이징 분리**:
   - Production, Deploy previews, Branch deploys별로 다른 값 설정 가능

## 3단계: 빌드 설정 확인

`netlify.toml` 파일이 이미 설정되어 있습니다:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
```

## 4단계: API 엔드포인트 사용

### 주간 콘텐츠 생성

```javascript
// POST /api/generate-weekly-content
const response = await fetch('/api/generate-weekly-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    week: '2025-W21' // 선택사항, 없으면 현재 주차
  })
});

const data = await response.json();
console.log(data); // { success: true, contentIds: [1, 2], ... }
```

### 콘텐츠 검증

```javascript
// POST /api/update-content
const response = await fetch('/api/update-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contentId: 1,
    action: 'verify' // 'verify', 'improve', 'regenerate'
  })
});

const data = await response.json();
console.log(data.verification);
```

### 콘텐츠 개선

```javascript
// POST /api/update-content
const response = await fetch('/api/update-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contentId: 1,
    action: 'improve', // 또는 'regenerate'
    preview: false // true면 미리보기만
  })
});

const data = await response.json();
console.log(data.improvement);
```

### 콘텐츠 재생성

```javascript
// POST /api/update-content
const response = await fetch('/api/update-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contentId: 1,
    action: 'regenerate',
    preview: false
  })
});

const data = await response.json();
console.log(data.regenerated);
```

## 5단계: 비디오 생성 대안

### 옵션 1: 클라이언트 사이드 처리

브라우저에서 Web API를 사용하여 비디오 생성 (제한적):

```javascript
// 클라이언트에서 처리
import { createVideo } from '@/lib/video-client'; // 클라이언트 전용 함수

// Canvas API, Web Audio API 등을 사용
```

### 옵션 2: Cloudinary 사용

```javascript
// Cloudinary API 사용
import { v2 as cloudinary } from 'cloudinary';

// 비디오 생성
const result = await cloudinary.uploader.upload_large('video.mp4', {
  resource_type: 'video',
  // ...
});
```

### 옵션 3: 별도 서버

비디오 생성을 위한 별도 Node.js 서버 운영:

```javascript
// 별도 서버에서 FFmpeg 사용
// 예: AWS EC2, DigitalOcean, Railway 등
```

## 6단계: 배포 확인

1. **빌드 로그 확인**:
   - Netlify 대시보드 > Deploys > 최신 배포 > Build log

2. **함수 테스트**:
   - Netlify 대시보드 > Functions에서 함수 목록 확인
   - 각 함수의 로그 확인

3. **API 엔드포인트 테스트**:
   ```bash
   curl https://your-site.netlify.app/api/shorts
   ```

## 7단계: 도메인 설정 (선택사항)

1. Netlify 대시보드 > Domain settings
2. Custom domain 추가
3. DNS 설정 (A 레코드, CNAME 등)

## 문제 해결

### 환경 변수 오류

**문제**: `GOOGLE_PRIVATE_KEY` 파싱 오류

**해결**:
1. Netlify 환경 변수에서 여러 줄 문자열을 올바르게 입력
2. 또는 Base64 인코딩 사용:
   ```javascript
   // .env.local에서
   GOOGLE_PRIVATE_KEY_BASE64=base64-encoded-key
   
   // 코드에서
   const privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString();
   ```

### 타임아웃 오류

**문제**: 함수 실행 시간 초과

**해결**:
- `netlify.toml`에 타임아웃 설정 추가:
  ```toml
  [functions]
    timeout = 30  # 초 단위
  ```

### 빌드 실패

**문제**: 빌드 중 오류

**해결**:
1. 로컬에서 `npm run build` 테스트
2. 빌드 로그 확인
3. 의존성 문제 확인: `package.json` 확인

## 추가 리소스

- [Netlify Functions 문서](https://docs.netlify.com/functions/overview/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [환경 변수 관리](https://docs.netlify.com/environment-variables/overview/)

## 다음 단계

1. ✅ 환경 변수 설정 완료
2. ✅ API 엔드포인트 테스트
3. ⚠️ 비디오 생성 대안 구현 (필요시)
4. ✅ 프론트엔드에서 API 호출 구현



