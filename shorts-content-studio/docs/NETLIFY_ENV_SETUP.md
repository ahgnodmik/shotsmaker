# Netlify 환경 변수 설정 가이드

## .env.local → Netlify 환경 변수 설정

`.env.local`에 있는 모든 환경 변수를 Netlify에 설정할 수 있습니다. 다만 몇 가지 주의사항이 있습니다.

## 📋 환경 변수 목록

현재 `.env.local`에 있는 변수들:

### ✅ 필수 변수 (반드시 설정 필요)

1. **GOOGLE_SHEET_ID** - Google Sheets ID
2. **GOOGLE_SERVICE_ACCOUNT_EMAIL** - Google Service Account 이메일
3. **GOOGLE_PRIVATE_KEY** - Google Private Key (따옴표 포함)
4. **OPENAI_API_KEY** - OpenAI API 키
5. **OPENAI_MODEL** - OpenAI 모델 (기본값: gpt-4o-mini)

### ⚠️ 선택사항 (기능 사용 시 필요)

6. **PEXELS_API_KEY** - Pexels API 키 (비디오 생성 시)
7. **YOUTUBE_CLIENT_ID** - YouTube Client ID (YouTube 업로드 시)
8. **YOUTUBE_CLIENT_SECRET** - YouTube Client Secret (YouTube 업로드 시)
9. **YOUTUBE_REDIRECT_URI** - YouTube Redirect URI ⚠️ **변경 필요**
10. **YOUTUBE_REFRESH_TOKEN** - YouTube Refresh Token (YouTube 업로드 시)

## ⚠️ 중요 주의사항

### 1. YOUTUBE_REDIRECT_URI 변경 필요

`.env.local`에는 `localhost` URL이 있지만, Netlify에서는 실제 사이트 URL을 사용해야 합니다:

**변경 전:**
```
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
```

**변경 후 (Netlify):**
```
YOUTUBE_REDIRECT_URI=https://your-site.netlify.app/api/youtube/callback
```

### 2. GOOGLE_PRIVATE_KEY 형식

Netlify에서도 따옴표로 감싸야 합니다:

```
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 🚀 자동 설정 방법

### 방법 1: 스크립트 사용 (권장)

```bash
# 1. Netlify 사이트 연결 (처음 한 번만)
netlify link

# 2. 환경 변수 자동 설정
npm run setup-netlify-env

# 또는 특정 사이트 ID 지정
npm run setup-netlify-env -- --site-id=YOUR_SITE_ID
```

스크립트가 자동으로:
- ✅ 필수 변수 확인
- ✅ YOUTUBE_REDIRECT_URI를 Netlify URL로 변경
- ✅ 모든 변수를 Netlify에 설정

### 방법 2: Netlify 대시보드에서 수동 설정

1. **Netlify 대시보드 접속**
   - https://app.netlify.com
   - 사이트 선택

2. **환경 변수 추가**
   - Site settings > Environment variables
   - "Add a variable" 클릭

3. **변수 추가**
   - `.env.local`의 각 변수를 복사하여 추가
   - **YOUTUBE_REDIRECT_URI만 Netlify URL로 변경**

### 방법 3: Netlify CLI로 수동 설정

```bash
# 필수 변수
netlify env:set GOOGLE_SHEET_ID "your-sheet-id"
netlify env:set GOOGLE_SERVICE_ACCOUNT_EMAIL "your-email@project.iam.gserviceaccount.com"
netlify env:set GOOGLE_PRIVATE_KEY '"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"'
netlify env:set OPENAI_API_KEY "sk-..."
netlify env:set OPENAI_MODEL "gpt-4o-mini"

# 선택사항 (필요한 것만)
netlify env:set PEXELS_API_KEY "your-pexels-key"
netlify env:set YOUTUBE_CLIENT_ID "your-client-id"
netlify env:set YOUTUBE_CLIENT_SECRET "your-client-secret"
netlify env:set YOUTUBE_REDIRECT_URI "https://your-site.netlify.app/api/youtube/callback"
netlify env:set YOUTUBE_REFRESH_TOKEN "your-refresh-token"
```

## ✅ 설정 확인

### CLI로 확인

```bash
# 환경 변수 목록 확인
netlify env:list

# 특정 변수 확인
netlify env:get GOOGLE_SHEET_ID
```

### 대시보드에서 확인

1. Site settings > Environment variables
2. 모든 변수가 설정되어 있는지 확인
3. 값이 올바른지 확인

## 🔄 환경 변수 업데이트

변수를 변경한 후:

1. **Netlify 대시보드에서 수정**
   - Environment variables에서 변수 클릭
   - 값 수정 후 저장

2. **재배포 필요**
   - 환경 변수 변경 후 사이트 재배포 필요
   - 자동 배포가 설정되어 있으면 다음 푸시 시 자동 재배포
   - 또는 수동 재배포: "Trigger deploy" > "Clear cache and deploy site"

## 📝 체크리스트

- [ ] `.env.local` 파일 확인
- [ ] 필수 변수 모두 설정
- [ ] YOUTUBE_REDIRECT_URI를 Netlify URL로 변경
- [ ] GOOGLE_PRIVATE_KEY 따옴표 확인
- [ ] Netlify에 모든 변수 설정 완료
- [ ] 환경 변수 확인
- [ ] 사이트 재배포
- [ ] API 테스트

## 🎯 요약

**질문: .env.local에 있는 것들을 모두 넣으면 되나?**

**답변:**
- ✅ **대부분 넣어도 됩니다**
- ⚠️ **YOUTUBE_REDIRECT_URI만 Netlify URL로 변경 필요**
- ✅ **선택사항 변수는 사용하는 기능에 따라 설정**
- ✅ **자동 설정 스크립트 사용 권장**: `npm run setup-netlify-env`




